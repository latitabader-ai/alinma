import { useState } from "react";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, CheckCircle2, AlertTriangle, XCircle, Sparkles, TrendingUp, Loader2, PieChart } from "lucide-react";
import { Link } from "wouter";

type Tab = "apply" | "invest" | "how";
type RiskLevel = "low" | "mid" | "high" | null;

interface AssessResult {
  level: RiskLevel;
  levelText: string;
  conf: string;
  installment: number;
  dbr: number;
  decision: string;
  factors: { name: string; val: number; max: number }[];
}

interface Opp {
  id: number;
  title: string;
  level: "low" | "mid" | "high";
  levelText: string;
  goal: number;
  raised: number;
  retPct: number;   // العائد المتوقع %
  months: number;
}

const INITIAL_OPPS: Opp[] = [
  { id: 1, title: "تمويل سيارة",          level: "low",  levelText: "منخفض",   goal: 80000, raised: 62000, retPct: 6.5, months: 36 },
  { id: 2, title: "معدّات ورشة",           level: "low",  levelText: "منخفض",   goal: 45000, raised: 31000, retPct: 7.0, months: 24 },
  { id: 3, title: "أجهزة إلكترونية",      level: "mid",  levelText: "متوسط",   goal: 20000, raised:  8000, retPct: 7.5, months: 18 },
  { id: 4, title: "توسعة مطعم",           level: "mid",  levelText: "متوسط",   goal: 60000, raised: 22000, retPct: 8.2, months: 30 },
  { id: 5, title: "مشروع تقني ناشئ",      level: "high", levelText: "مرتفع",   goal: 35000, raised:  5000, retPct: 11.0, months: 24 },
];

/* توزيع ذكي: أوزان المخاطر — منخفض 50%، متوسط 35%، مرتفع 15% */
const RISK_WEIGHT = { low: 0.50, mid: 0.35, high: 0.15 };

interface Alloc { opp: Opp; amount: number; sharePct: number }

function smartAllocate(total: number, opps: Opp[]): Alloc[] {
  // جمع الأوزان المتاحة
  const weighted = opps.map(o => ({ opp: o, w: RISK_WEIGHT[o.level] / opps.filter(x => x.level === o.level).length }));
  const sumW = weighted.reduce((s, x) => s + x.w, 0);

  return weighted.map(({ opp, w }) => {
    const raw = (w / sumW) * total;
    const amount = Math.max(1000, Math.round(raw / 1000) * 1000);
    const sharePct = Math.round((amount / total) * 100);
    return { opp, amount, sharePct };
  });
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

  return { level, levelText, conf, installment, dbr, decision, factors };
}

export default function CrowdFinance() {
  const [tab, setTab] = useState<Tab>("apply");
  const [opps, setOpps] = useState<Opp[]>(INITIAL_OPPS);
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

  // الاستثمار الذكي
  const [investAmt, setInvestAmt] = useState("10000");
  const [allocating, setAllocating] = useState(false);
  const [allocations, setAllocations] = useState<Alloc[] | null>(null);

  function handleAssess() { setResult(assess(+amount, +term, +salary, +oblig, +credit, +tenure, emp)); }

  function contribute(id: number) {
    setOpps(prev => prev.map(o => o.id === id ? { ...o, raised: Math.min(o.goal, o.raised + 1000) } : o));
  }

  function handleSmartInvest() {
    const total = Math.max(5000, Math.round(+investAmt / 1000) * 1000);
    setAllocating(true);
    setAllocations(null);
    setTimeout(() => {
      setAllocations(smartAllocate(total, opps));
      setAllocating(false);
    }, 1800);
  }

  const LC = {
    low:  { bg: "bg-green-500/10", border: "border-green-500/50", text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500" },
    mid:  { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    high: { bg: "bg-red-500/10",   border: "border-red-500/50",   text: "text-red-600 dark:text-red-400",   bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",   dot: "bg-red-500" },
  };

  const inputClass = "w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm font-medium focus:outline-none focus:border-accent";

  const avgRet = allocations
    ? (allocations.reduce((s, a) => s + a.opp.retPct * a.sharePct, 0) / 100).toFixed(1)
    : null;

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
            {(["apply", "invest", "how"] as Tab[]).map((t, i) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-all ${tab === t ? "text-foreground border-accent" : "text-muted-foreground border-transparent"}`}>
                {["طلب تمويل", "فرص المساهمة", "كيف يقيّم؟"][i]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 space-y-4">

          {/* ===== Tab 1: Apply ===== */}
          {tab === "apply" && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />تمويل متوافق مع الشريعة (مرابحة)
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">أدخل بياناتك، وسيقيّم محرّك الذكاء الاصطناعي أهليتك ومستوى المخاطرة فوراً.</p>
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
              <button onClick={handleAssess} className="w-full bg-accent text-accent-foreground font-bold text-base py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
                قيّم طلبي الآن
              </button>
              {result && (
                <div className={`rounded-2xl p-5 border ${LC[result.level!].bg} ${LC[result.level!].border}`}>
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
                  <div className={`rounded-xl px-4 py-3 text-sm font-bold text-white ${result.level==="low"?"bg-green-500":result.level==="mid"?"bg-amber-500":"bg-red-500"}`}>
                    {result.decision}
                  </div>
                </div>
              )}
              <p className="text-center text-[10px] text-muted-foreground leading-relaxed">القرار يحاكي نموذج تصنيف مدرّب على معايير المخاطر السعودية</p>
            </div>
          )}

          {/* ===== Tab 2: Invest ===== */}
          {tab === "invest" && (
            <div className="space-y-4">

              {/* زر الاستثمار الذكي التلقائي */}
              <div className="bg-gradient-to-l from-accent/15 to-primary/10 border border-accent/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-black text-foreground text-sm">الاستثمار الذكي التلقائي</h3>
                  <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">توزيع المخاطر</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">أدخل المبلغ وسيوزّعه النظام تلقائياً على الفرص لتقليل المخاطر وزيادة العائد.</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={investAmt}
                    onChange={e => setInvestAmt(e.target.value)}
                    placeholder="المبلغ (ريال)"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm font-medium focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleSmartInvest}
                    disabled={allocating}
                    className="bg-accent text-accent-foreground font-bold text-sm px-4 py-2.5 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {allocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {allocating ? "يحسب..." : "وزّع الآن"}
                  </button>
                </div>
              </div>

              {/* ملخص التوزيع */}
              {allocations && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-accent" />
                      <span className="font-black text-sm text-foreground">ملخّص التوزيع</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground">متوسط العائد المتوقع </span>
                      <span className="text-accent font-black text-sm">{avgRet}%</span>
                    </div>
                  </div>

                  {/* شريط التوزيع البصري */}
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                    {allocations.map(a => (
                      <div key={a.opp.id} className={`${LC[a.opp.level].bar} transition-all`} style={{ width: `${a.sharePct}%` }} />
                    ))}
                  </div>

                  {allocations.map(a => (
                    <div key={a.opp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${LC[a.opp.level].dot}`} />
                        <span className="text-xs text-foreground font-medium">{a.opp.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LC[a.opp.level].badge}`}>{a.opp.levelText}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-foreground">{a.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground"> ر.س · {a.opp.retPct}%</span>
                      </div>
                    </div>
                  ))}

                  <button className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform mt-1">
                    تأكيد الاستثمار الذكي
                  </button>
                </div>
              )}

              {/* قائمة الفرص */}
              <div>
                <h2 className="text-base font-black text-foreground mb-1">فرص تمويل مقبولة</h2>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">اجتازت تقييم المخاطر · عائد حلال من ربح المرابحة</p>
              </div>

              {opps.map(opp => {
                const pct = Math.round((opp.raised / opp.goal) * 100);
                const remaining = opp.goal - opp.raised;
                return (
                  <div key={opp.id} className={`rounded-2xl p-5 border ${LC[opp.level].bg} ${LC[opp.level].border}`}>
                    {/* العنوان + الشارة */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-base text-foreground">{opp.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">على {opp.months} شهراً · متبقي {remaining.toLocaleString()} ر.س</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* مستوى المخاطر بمؤشر لوني */}
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${LC[opp.level].badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${LC[opp.level].dot}`}/>
                          خطر {opp.levelText}
                        </span>
                        {/* العائد المتوقع */}
                        <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {opp.retPct}%
                        </span>
                      </div>
                    </div>

                    {/* شريط الاكتمال */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div className={`h-full rounded-full transition-all duration-700 ${LC[opp.level].bar}`} style={{ width: `${pct}%` }}/>
                    </div>
                    <div className="flex justify-between text-xs mb-4">
                      <span className={`font-bold ${LC[opp.level].text}`}>{pct}% مكتمل</span>
                      <span className="text-muted-foreground">{opp.goal.toLocaleString()} ر.س</span>
                    </div>

                    <button onClick={() => contribute(opp.id)}
                      className="w-full bg-background hover:bg-muted text-foreground font-bold text-sm py-3 rounded-xl border border-border active:scale-95 transition-all">
                      ساهم بـ 1,000 ريال
                    </button>
                  </div>
                );
              })}

              <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
                كل فرصة مرّت بمحرّك التقييم · أموالك موزّعة لتقليل المخاطر · يديرها الإنماء
              </p>
            </div>
          )}

          {/* ===== Tab 3: How ===== */}
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
                  نسبة عبء الدين = (الالتزامات + القسط الجديد) ÷ الراتب. وفق حدود ساما، تجاوز 45% يعني رفضاً تلقائياً.
                </p>
              </div>
              <div className="bg-muted border border-border rounded-2xl p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-amber-500 font-bold">للجنة بصدق: </span>
                  المحرّك يحاكي منطق نموذج Random Forest درّبناه على 800 سجل اصطناعي بدقّة ~71%. في المرحلة القادمة نعيد تدريبه على بيانات حقيقية عبر Open Banking Sandbox.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </MobileContainer>
  );
}
