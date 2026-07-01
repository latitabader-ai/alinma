import { useState } from "react";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "wouter";

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

  function handleAssess() { setResult(assess(+amount, +term, +salary, +oblig, +credit, +tenure, emp)); }

  const LC = {
    low:  { bg: "bg-green-500/10", border: "border-green-500/50", text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500" },
    mid:  { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    high: { bg: "bg-red-500/10",   border: "border-red-500/50",   text: "text-red-600 dark:text-red-400",   bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",   dot: "bg-red-500" },
  };

  const inputClass = "w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm font-medium focus:outline-none focus:border-accent";

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
