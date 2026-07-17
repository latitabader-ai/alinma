import { useState, useEffect } from "react";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, CheckCircle2, AlertTriangle, XCircle, Loader2, Cpu, WifiOff, Store, X, Users, FileCheck } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OpenBankingConnect from "@/components/OpenBankingConnect";
import ContractExecution from "@/components/ContractExecution";
import { type Txn } from "@/lib/AccountProvider";
import { SAIBOR_3M, RISK_SPREAD, returnRateFor, totalProfit, type RiskLevel as PricingLevel } from "@/lib/saibor";

// خيارات نوع السلعة في النموذج (لمطابقة القيمة القادمة من المتجر)
const ITEM_OPTIONS = ["سيارة", "أجهزة إلكترونية", "معدّات مهنية", "أثاث منزلي", "تمويل استهلاكي"];
import { assessViaApi, warmUpApi } from "@/lib/riskApi";

type Tab = "apply" | "how";
type RiskLevel = "low" | "mid" | "high" | null;

interface AssessResult {
  level: RiskLevel;
  levelText: string;
  conf: string;
  installment: number;
  dbr: number;
  decision: string;
  factors: { name: string; val: number; max: number }[];
  source: "api" | "local";              // مصدر التقييم: نموذج حقيقي أم منطق محلي
  modelAccuracy?: number;                // الدقة الإجمالية (عند المصدر api)
  highRiskPrecision?: number;            // دقة التنبؤ بالحالات المرتفعة الخطورة
  incomeConfidence?: { score: number; label: string; evidence: string };  // تحقّق الدخل بأرقام محسوبة
  importances?: { name: string; value: number }[]; // أوزان عوامل النموذج
}

// نص القرار بحسب مستوى الخطر (يُستخدم عند مسار الـ API)
function decisionFor(level: "low" | "mid" | "high", dbr: number): string {
  if (level === "high" && dbr > 0.45) return "نسبة عبء الدين تتجاوز 45% — لا يمكن قبول الطلب.";
  if (level === "high") return "يحتاج ضمانات إضافية أو تخفيض المبلغ قبل القبول.";
  if (level === "mid") return "مقبول بشروط — يُطرح للمساهمين مع تنويع أوسع.";
  return "مقبول — يُطرح للمساهمين كفرصة تمويل موثّقة.";
}

function assess(amount: number, term: number, salary: number, oblig: number, credit: number, tenure: number, emp: string): AssessResult {
  const margin = 0.065;
  const totalDue = amount * (1 + margin * (term / 12));
  const installment = totalDue / term;
  const dbr = (oblig + installment) / salary;
  let score = 0;
  const factors: { name: string; val: number; max: number }[] = [];

  let f1 = 0; if (dbr > 0.45) f1 = 40; else if (dbr > 0.33) f1 = 22; else if (dbr > 0.25) f1 = 10;
  score += f1; factors.push({ name: "نسبة عبء الدين", val: f1, max: 40 });
  let f2 = 0; if (credit < 500) f2 = 30; else if (credit < 650) f2 = 15; else if (credit < 750) f2 = 5;
  score += f2; factors.push({ name: "التصنيف الائتماني", val: f2, max: 30 });
  let f3 = 0; if (tenure < 12) f3 = 15; else if (tenure < 24) f3 = 7;
  score += f3; factors.push({ name: "استقرار التوظيف", val: f3, max: 15 });
  let f4 = 0; if (emp === "أعمال حرة") f4 = 10; else if (emp === "قطاع خاص صغير") f4 = 6;
  score += f4; factors.push({ name: "نوع جهة العمل", val: f4, max: 10 });
  let f5 = 0; if (amount > salary * 12 * 0.8) f5 = 12;
  score += f5; factors.push({ name: "حجم التمويل", val: f5, max: 12 });

  let level: RiskLevel, levelText: string, conf: string, decision: string;
  if (dbr > 0.45)    { level = "high"; levelText = "مرفوض — تجاوز حدود ساما"; decision = "نسبة عبء الدين تتجاوز 45% — لا يمكن قبول الطلب."; conf = "وفق الحد التنظيمي للبنك المركزي"; }
  else if (score >= 38) { level = "high"; levelText = "خطر مرتفع"; decision = "يحتاج ضمانات إضافية أو تخفيض المبلغ قبل القبول."; conf = "ثقة التقييم: عالية"; }
  else if (score >= 20) { level = "mid";  levelText = "خطر متوسط"; decision = "مقبول بشروط — يُطرح للمساهمين مع تنويع أوسع."; conf = "ثقة التقييم: متوسطة"; }
  else               { level = "low";  levelText = "خطر منخفض"; decision = "مقبول — يُطرح للمساهمين كفرصة تمويل موثّقة."; conf = "ثقة التقييم: عالية"; }

  return { level, levelText, conf, installment, dbr, decision, factors, source: "local" };
}

export default function CrowdFinance() {
  const [tab, setTab] = useState<Tab>("apply");
  const [result, setResult] = useState<AssessResult | null>(null);

  // نموذج الطلب
  const [amount, setAmount] = useState("50000");
  const [term, setTerm]     = useState("36");
  const [salary, setSalary] = useState("12000");
  const [oblig, setOblig]   = useState("2000");
  const [credit, setCredit] = useState("700");
  const [tenure, setTenure] = useState("36");
  const [item, setItem]     = useState("سيارة");
  const [emp, setEmp]       = useState("حكومي");
  const [assessing, setAssessing] = useState(false);

  // كشف الحساب من المصرفية المفتوحة — يُرسل للنموذج ليحتسب ثقة الدخل
  const [txns, setTxns] = useState<Txn[] | null>(null);

  // قادم من المتجر (عبر query params): اسم المنتج لعرضه في التنبيه
  const [fromStore, setFromStore] = useState<string | null>(null);

  // إيقاظ خادم النموذج مبكّراً ليكون جاهزاً عند التقييم
  useEffect(() => { warmUpApi(); }, []);

  // تعبئة تلقائية عند القدوم من صفحة المتجر (نوع السلعة + المبلغ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qAmount = params.get("amount");
    const qItem = params.get("item");
    const qName = params.get("name");
    if (qAmount && !isNaN(Number(qAmount)) && Number(qAmount) > 0) {
      setAmount(String(Math.round(Number(qAmount))));
    }
    if (qItem) {
      // طابق نوع السلعة مع أقرب خيار موجود، وإلا اترك الافتراضي
      const match = ITEM_OPTIONS.find(o => o === qItem);
      if (match) setItem(match);
    }
    if (qName || qItem) setFromStore(qName || qItem);
  }, []);

  async function handleAssess() {
    setAssessing(true);
    try {
      // نحاول أولاً محرّك التقييم الحقيقي (API + نموذج Random Forest)
      const api = await assessViaApi({
        item, amount: +amount, term: +term, salary: +salary,
        oblig: +oblig, credit: +credit, tenure: +tenure, emp,
        transactions: txns ?? undefined,
      });
      setResult({
        level: api.level,
        levelText: api.levelText === "مرتفع" || api.levelText === "متوسط" || api.levelText === "منخفض"
          ? `خطر ${api.levelText}` : api.levelText,
        conf: `ثقة النموذج: ${api.confidence}%`,
        installment: api.installment,
        dbr: api.dbr,
        decision: decisionFor(api.level, api.dbr),
        factors: [],
        source: "api",
        modelAccuracy: api.modelAccuracy,
        highRiskPrecision: api.highRiskPrecision,
        incomeConfidence: api.incomeConfidence,
        importances: api.importances,
      });
    } catch {
      // تعذّر الاتصال — نعود للمنطق المحلي حتى يعمل العرض دائماً
      setResult(assess(+amount, +term, +salary, +oblig, +credit, +tenure, emp));
    } finally {
      setAssessing(false);
    }
  }

  const LC = {
    low:  { bg: "bg-green-500/10", border: "border-green-500/50", text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500", label: "منخفض" },
    mid:  { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "متوسط" },
    high: { bg: "bg-red-500/10",   border: "border-red-500/50",   text: "text-red-600 dark:text-red-400",   bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",   dot: "bg-red-500", label: "مرتفع" },
  };

  const inputClass = "w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm font-medium focus:outline-none focus:border-accent";

  // تسعير عائد المساهمين — يتبع تصنيف المخاطر (المُقيَّم إن وُجد، وإلا تقدير مبدئي من المدخلات الحالية)
  const pricingLevel: PricingLevel =
    (result?.level ?? assess(+amount || 0, +term || 12, +salary || 1, +oblig || 0, +credit || 0, +tenure || 0, emp).level ?? "mid") as PricingLevel;
  const contribReturnPct = returnRateFor(pricingLevel);
  const contribProfit = totalProfit(+amount || 0, +term || 12, pricingLevel);

  return (
    <MobileContainer className="bg-background text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col w-full">

        {/* Header */}
        <div className="bg-card px-4 pt-5 pb-0 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Link href="/finance-ar">
              <ChevronRight className="w-6 h-6 text-foreground cursor-pointer" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">تمويل جماعي</h1>
            <div className="w-6" />
          </div>
          <div className="flex border-b border-border">
            {([["apply", "طلب تمويل"], ["how", "كيف يقيّم؟"]] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-all ${tab === t ? "text-foreground border-accent" : "text-muted-foreground border-transparent"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 space-y-4">

          {/* ===== Tab 1: Apply ===== */}
          {tab === "apply" && (
            <div className="space-y-4">
              {/* شريط القدوم من المتجر (query params) */}
              {fromStore && (
                <Alert className="bg-accent/10 border-accent/30 text-foreground pr-4 pl-10">
                  <button
                    onClick={() => setFromStore(null)}
                    aria-label="إخفاء"
                    className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <AlertDescription className="flex items-start gap-2 text-right">
                    <Store className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      قادم من المتجر: <span className="font-bold text-foreground">{fromStore}</span> — يكتمل التمويل عادة خلال أيام، وتُصرف قيمة السلعة للتاجر عند اكتمال الجمع
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />تمويل متوافق مع الشريعة (مرابحة)
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">املأ بياناتك تلقائياً عبر المصرفية المفتوحة، أو أدخلها يدوياً — وسيقيّم محرّك الذكاء الاصطناعي أهليتك فوراً.</p>

              {/* المصرفية المفتوحة الكاملة — تملأ حقول الطلب تلقائياً (مع إبقاء التعديل اليدوي) */}
              <OpenBankingConnect
                onFilled={({ salary, oblig, credit, transactions }) => {
                  setTxns(transactions);
                  setSalary(String(salary));
                  setOblig(String(oblig));
                  setCredit(String(credit));
                  setTenure("48");
                }}
              />

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground font-bold mb-1.5">نوع السلعة المطلوبة</label>
                  <select value={item} onChange={e => setItem(e.target.value)} className={inputClass}>
                    {["سيارة","أجهزة إلكترونية","معدّات مهنية","أثاث منزلي","تمويل استهلاكي"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">مبلغ التمويل (ريال)</label>
                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className={inputClass}/></div>
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">مدة السداد (شهر)</label>
                    <select value={term} onChange={e=>setTerm(e.target.value)} className={inputClass}>
                      {["12","24","36","48"].map(v=><option key={v}>{v}</option>)}</select></div>
                </div>

                {/* عائد المساهمين على المبلغ المختار — يتحدّث لحظياً */}
                {+amount > 0 && (
                  <div className="bg-muted/50 border border-border rounded-2xl p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-accent" /> عائد المساهمين على هذا المبلغ
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LC[pricingLevel].badge}`}>
                        تسعير {LC[pricingLevel].label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="text-[9px] text-muted-foreground mb-0.5">العائد السنوي</p>
                        <p className="text-base font-black text-green-600 dark:text-green-400">{contribReturnPct}%</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center flex-1">
                        <p className="text-[9px] text-muted-foreground mb-0.5">ربح المساهمين</p>
                        <p className="text-base font-black text-foreground">+{Math.round(contribProfit).toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">ر.س</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center flex-1">
                        <p className="text-[9px] text-muted-foreground mb-0.5">إجمالي السداد</p>
                        <p className="text-base font-black text-foreground">{Math.round(+amount + contribProfit).toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">ر.س</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-3 leading-relaxed">
                      التسعير على أساس سايبور {SAIBOR_3M}% + هامش مخاطر {RISK_SPREAD[pricingLevel]}% · يُوزَّع الربح على المساهمين خلال {term} شهراً
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">الراتب الشهري (ريال)</label>
                    <input type="number" value={salary} onChange={e=>setSalary(e.target.value)} className={inputClass}/></div>
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">الالتزامات الشهرية</label>
                    <input type="number" value={oblig} onChange={e=>setOblig(e.target.value)} className={inputClass}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">التصنيف الائتماني (سمة)</label>
                    <input type="number" value={credit} onChange={e=>setCredit(e.target.value)} className={inputClass}/></div>
                  <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">مدة التوظيف (شهر)</label>
                    <input type="number" value={tenure} onChange={e=>setTenure(e.target.value)} className={inputClass}/></div>
                </div>
                <div><label className="block text-xs text-muted-foreground font-bold mb-1.5">جهة العمل</label>
                  <select value={emp} onChange={e=>setEmp(e.target.value)} className={inputClass}>
                    {["حكومي","شركة كبرى","شركة متوسطة","قطاع خاص صغير","أعمال حرة"].map(v=><option key={v}>{v}</option>)}</select></div>
              </div>
              <button onClick={handleAssess} disabled={assessing}
                className="w-full bg-accent text-accent-foreground font-bold text-base py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70">
                {assessing && <Loader2 className="w-5 h-5 animate-spin" />}
                {assessing ? "جارٍ التقييم عبر النموذج..." : "قيّم طلبي الآن"}
              </button>

              {/* Skeleton أثناء استدعاء النموذج (API) */}
              {assessing && (
                <div className="rounded-2xl p-5 border border-border bg-card space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="w-32 h-4 rounded" />
                      <Skeleton className="w-24 h-3 rounded" />
                    </div>
                  </div>
                  <Skeleton className="w-full h-3 rounded" />
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="w-24 h-2.5 rounded shrink-0" />
                        <Skeleton className="flex-1 h-1.5 rounded-full" />
                        <Skeleton className="w-8 h-2.5 rounded shrink-0" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="w-full h-10 rounded-xl" />
                </div>
              )}

              {!assessing && result && (
                <div className={`rounded-2xl p-5 border ${LC[result.level!].bg} ${LC[result.level!].border}`}>
                  {/* شارة مصدر التقييم */}
                  <div className="flex justify-end mb-2">
                    {result.source === "api" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-500/15 px-2 py-1 rounded-full">
                        <Cpu className="w-3 h-3" /> نموذج Random Forest حقيقي
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <WifiOff className="w-3 h-3" /> تقييم محلي (API غير متصل)
                      </span>
                    )}
                  </div>

                  {/* تحقّق الدخل — كل رقم هنا محسوب من كشف الحساب لا ادّعاء عام */}
                  {result.incomeConfidence && (
                    <div className={`rounded-xl p-3 mb-3 border ${
                      result.incomeConfidence.score >= 80 ? "bg-green-500/10 border-green-500/30"
                      : result.incomeConfidence.score >= 50 ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-foreground flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5" /> تحقّق الدخل من كشف الحساب
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          result.incomeConfidence.score >= 80 ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : result.incomeConfidence.score >= 50 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                          : "bg-red-500/20 text-red-700 dark:text-red-400"
                        }`}>
                          {result.incomeConfidence.score}% · {result.incomeConfidence.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {result.incomeConfidence.evidence}
                      </p>
                    </div>
                  )}

                  {/* مقاييس أداء النموذج — نُبرز دقة اكتشاف الحالات المرتفعة (الأهم لحماية المساهمين) */}
                  {result.source === "api" && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-2.5 text-center">
                        <p className="text-lg font-black text-green-600 dark:text-green-400">{result.highRiskPrecision ?? "—"}%</p>
                        <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">دقة التنبؤ بالحالات<br/>مرتفعة الخطورة</p>
                      </div>
                      <div className="bg-muted border border-border rounded-xl p-2.5 text-center">
                        <p className="text-lg font-black text-foreground">{result.modelAccuracy}%</p>
                        <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">الدقة الإجمالية<br/>(3 مستويات خطر)</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    {result.level==="low"  && <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0"/>}
                    {result.level==="mid"  && <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0"/>}
                    {result.level==="high" && <XCircle className="w-8 h-8 text-red-500 shrink-0"/>}
                    <div>
                      <p className={`text-lg font-black ${LC[result.level!].text}`}>{result.levelText}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.conf}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    القسط الشهري: <span className="text-foreground font-bold">{Math.round(result.installment).toLocaleString()} ريال</span>
                    {" · "}نسبة عبء الدين: <span className="text-foreground font-bold">{(result.dbr*100).toFixed(0)}%</span>
                  </p>

                  {/* عوامل النموذج الحقيقي (importances) */}
                  {result.source === "api" && result.importances && (
                    <div className="space-y-2 mb-4">
                      <p className="text-[11px] font-bold text-muted-foreground mb-1">أهم العوامل التي يعتمدها النموذج:</p>
                      {result.importances.slice(0, 5).map(f => (
                        <div key={f.name} className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0">{f.name.replace(/_/g, " ")}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(f.value / 30 * 100, 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-bold w-9 text-left text-foreground">{f.value}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* عوامل المنطق المحلي (fallback) */}
                  {result.source === "local" && (
                    <div className="space-y-2 mb-4">
                      {result.factors.map(f=>{
                        const pct=f.max?(f.val/f.max)*100:0;
                        const barColor=f.val===0?"bg-green-500":pct>50?"bg-red-500":"bg-amber-500";
                        return(
                          <div key={f.name} className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground w-28 shrink-0">{f.name}</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor} transition-all`} style={{width:`${pct}%`}}/>
                            </div>
                            <span className={`text-[11px] font-bold w-6 text-left ${f.val===0?"text-green-500":"text-foreground"}`}>{f.val===0?"✓":`+${f.val}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={`rounded-xl px-4 py-3 text-sm font-bold text-white ${result.level==="low"?"bg-green-500":result.level==="mid"?"bg-amber-500":"bg-red-500"}`}>
                    {result.decision}
                  </div>
                </div>
              )}

              {/* طبقة تكوين العقد — تعمل فقط بعد قبول الطلب (لا صرف قبل عقد صحيح) */}
              {result && result.level !== "high" && (
                <ContractExecution
                  // إعادة التقييم بمدخلات مختلفة تُنشئ عقداً جديداً — لا يبقى عقد سابق معروضاً
                  key={`${item}-${amount}-${term}-${result.level}`}
                  purpose={item}
                  amount={+amount || 0}
                  tenor={+term || 36}
                  ai={{ level: result.level ?? "mid", dbr: result.dbr, confidence: result.highRiskPrecision ?? 0 }}
                />
              )}

              <p className="text-center text-[10px] text-muted-foreground leading-relaxed">التقييم عبر نموذج Random Forest حقيقي مدرّب على معايير المخاطر السعودية (مع تقييم محلي احتياطي)</p>
            </div>
          )}

          {/* ===== Tab 2: How ===== */}
          {tab === "how" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-foreground">كيف يقيّم المحرّك الخطر؟</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mt-1">شفافية كاملة — هذه العوامل التي تعلّمها النموذج وأوزانها.</p>
              </div>
              <div className="bg-card rounded-2xl p-5 border border-border">
                <h3 className="font-bold text-base text-foreground mb-4">العوامل وأوزانها</h3>
                {[
                  { name: "نسبة عبء الدين", pct: 100, val: "29%" },
                  { name: "التصنيف الائتماني", pct: 52, val: "15%" },
                  { name: "مدة التوظيف", pct: 41, val: "12%" },
                  { name: "الالتزامات الشهرية", pct: 28, val: "8%" },
                  { name: "القسط الجديد", pct: 28, val: "8%" },
                  { name: "جهة العمل", pct: 24, val: "7%" },
                ].map(f => (
                  <div key={f.name} className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{f.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${f.pct}%` }} />
                    </div>
                    <span className="text-accent font-bold text-xs w-8 text-left">{f.val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-2xl p-5 border border-border">
                <h3 className="font-bold text-base text-foreground mb-2">القاعدة الأساسية</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  نسبة عبء الدين = (الالتزامات + القسط الجديد) ÷ الراتب. وفق حدود ساما, تجاوز 45% يعني رفضاً تلقائياً.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </MobileContainer>
  );
}
