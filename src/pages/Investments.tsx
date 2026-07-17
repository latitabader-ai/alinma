import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, TrendingUp, Briefcase, Sprout, FileSignature, HandCoins, Clock, Car, Store, User, Wrench, Sparkles, Loader2, PieChart, ShieldCheck, Wallet, CalendarClock, Activity } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "@/lib/AccountProvider";
import { SAIBOR_3M, RISK_SPREAD, returnRateFor, maturityLabel, FIRST_PAYOUT_AFTER_DAYS, type RiskLevel } from "@/lib/saibor";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RepaymentSchedule from "@/components/RepaymentSchedule";

// خطّاف حركة رقمية تصاعدية (Count-up) — يعطي إحساساً بالنمو المالي
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

type Tab = "portfolios" | "namaa" | "ipos" | "funding";

interface Opp {
  id: number;
  title: string;
  icon: JSX.Element;
  goal: number;
  raised: number;
  retPct: number;
  level: RiskLevel;
  deadline: string;
  months: number;   // مدة التمويل — عليها يُحتسب رجوع العائد
}

// فرص تمويل للمساهمة (تجربة المموِّل)
// العائد ليس رقماً اعتباطياً: يُشتقّ من سايبور + هامش مخاطر التصنيف
const OPPS: Opp[] = [
  { id: 1, title: "تمويل سيارة",        icon: <Car className="w-5 h-5" />,    goal: 80000, raised: 52000, level: "low",  retPct: returnRateFor("low"),  deadline: "5 أيام",   months: 36 },
  { id: 2, title: "مشاريع منشآت صغيرة", icon: <Store className="w-5 h-5" />,  goal: 60000, raised: 22000, level: "mid",  retPct: returnRateFor("mid"),  deadline: "8 أيام",   months: 30 },
  { id: 3, title: "تمويل شخصي",         icon: <User className="w-5 h-5" />,   goal: 40000, raised: 30000, level: "low",  retPct: returnRateFor("low"),  deadline: "3 أيام",   months: 24 },
  { id: 4, title: "تمويل معدّات",       icon: <Wrench className="w-5 h-5" />, goal: 35000, raised: 9000,  level: "high", retPct: returnRateFor("high"), deadline: "12 يوماً", months: 18 },
];

// مساهمات المموِّل الحالية
interface Contribution { title: string; amount: number; retPct: number; level: RiskLevel; status: string }

const INITIAL_CONTRIBUTIONS: Contribution[] = [
  { title: "تمويل سيارة",      amount: 5000, retPct: returnRateFor("low"), level: "low", status: "نشطة" },
  { title: "معدّات ورشة",      amount: 3000, retPct: returnRateFor("low"), level: "low", status: "نشطة" },
  { title: "أجهزة إلكترونية", amount: 2000, retPct: returnRateFor("mid"), level: "mid", status: "نشطة" },
];

const LC = {
  low:  { text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500", label: "منخفض" },
  mid:  { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "متوسط" },
  high: { text: "text-red-600 dark:text-red-400",     bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",       dot: "bg-red-500",   label: "مرتفع" },
};

// الحد الأدنى للاستثمار الذكي — معلن في الواجهة، لا يُطبَّق بصمت
const MIN_SMART_INVEST = 1000;

// عقوبة المخاطرة لكل فئة (كلما ارتفع الخطر قلّ الوزن عند تساوي العائد)
const RISK_PENALTY: Record<RiskLevel, number> = { low: 1, mid: 1.6, high: 2.6 };

/**
 * أوزان ديناميكية تُحتسب لحظياً من أداء كل فئة مخاطر:
 * النتيجة = العائد المتوقّع × إقبال المساهمين (نسبة الاكتمال) ÷ عقوبة المخاطرة
 * كلما تغيّرت نسب الاكتمال (بمساهمات فعلية) تغيّرت الأوزان تلقائياً.
 */
function liveWeights(opps: Opp[]): Record<RiskLevel, number> {
  const levels: RiskLevel[] = ["low", "mid", "high"];
  const scores = {} as Record<RiskLevel, number>;
  levels.forEach(l => {
    const group = opps.filter(o => o.level === l);
    if (!group.length) { scores[l] = 0; return; }
    const avgRet = group.reduce((s, o) => s + o.retPct, 0) / group.length;
    const avgFill = group.reduce((s, o) => s + o.raised / o.goal, 0) / group.length;
    scores[l] = (avgRet * (0.5 + avgFill)) / RISK_PENALTY[l];
  });
  const sum = levels.reduce((s, l) => s + scores[l], 0) || 1;
  return { low: scores.low / sum, mid: scores.mid / sum, high: scores.high / sum };
}

interface Alloc { opp: Opp; amount: number; sharePct: number }

/**
 * توزيع بطريقة "أكبر باقٍ" (Largest Remainder) — يضمن أن مجموع
 * المبالغ الموزّعة = المبلغ المُدخل بالضبط (لا زيادة من التقريب).
 */
function smartAllocate(total: number, opps: Opp[]): Alloc[] {
  const STEP = 1;                       // دقة بالريال — لا تقريب لمضاعفات الألف
  const units = Math.floor(total / STEP);
  if (units <= 0 || !opps.length) return [];

  const W = liveWeights(opps);
  const perLevelCount = { low: 0, mid: 0, high: 0 } as Record<RiskLevel, number>;
  opps.forEach(o => perLevelCount[o.level]++);

  const weights = opps.map(o => (perLevelCount[o.level] ? W[o.level] / perLevelCount[o.level] : 0));
  const sumW = weights.reduce((s, w) => s + w, 0) || 1;

  const exact = weights.map(w => (w / sumW) * units);
  const base = exact.map(e => Math.floor(e));
  const remaining = units - base.reduce((s, u) => s + u, 0);

  // وزّع الوحدات المتبقية على الأكبر كسراً
  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remaining; k++) base[order[k % order.length].i]++;

  return opps
    .map((opp, i) => ({ opp, amount: base[i] * STEP, sharePct: Math.round((base[i] * STEP / total) * 100) }))
    .filter(a => a.amount > 0);
}

type FundingView = "mine" | "opps" | "smart";

export default function Investments() {
  const [tab, setTab] = useState<Tab>("funding");
  const [fundingView, setFundingView] = useState<FundingView>("mine");
  const { toast } = useToast();
  const { balance, withdraw } = useAccount();

  // مساهماتي الحالية (تتحدّث عند كل مساهمة)
  const [myContribs, setMyContribs] = useState<Contribution[]>(INITIAL_CONTRIBUTIONS);

  // الفرص الحيّة — نسب الاكتمال تتغيّر بالمساهمات، فتتغيّر أوزان التوزيع تلقائياً
  const [opps, setOpps] = useState<Opp[]>(OPPS);
  const liveW = liveWeights(opps);

  // الاستثمار الذكي (توزيع المخاطر)
  const [investAmt, setInvestAmt] = useState("10000");
  const [allocating, setAllocating] = useState(false);
  const [allocations, setAllocations] = useState<Alloc[] | null>(null);
  const [investError, setInvestError] = useState<string | null>(null);

  // المساهمة في فرصة محدّدة
  const [activeOpp, setActiveOpp] = useState<Opp | null>(null);
  const [contribAmt, setContribAmt] = useState(5000);

  // دمج مساهمة جديدة مع القائمة (إن وُجدت الفرصة نزيد مبلغها)
  function addContribution(prev: Contribution[], c: Contribution): Contribution[] {
    const idx = prev.findIndex(x => x.title === c.title);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = { ...next[idx], amount: next[idx].amount + c.amount };
      return next;
    }
    return [{ ...c, status: "نشطة" }, ...prev];
  }

  function openContribute(opp: Opp) {
    setActiveOpp(opp);
    setContribAmt(Math.min(5000, opp.goal - opp.raised));
  }

  function confirmContribute() {
    if (!activeOpp) return;
    const annualReturn = Math.round(contribAmt * activeOpp.retPct / 100);
    setMyContribs(prev => addContribution(prev, {
      title: activeOpp.title, amount: contribAmt, retPct: activeOpp.retPct, level: activeOpp.level, status: "نشطة",
    }));
    withdraw(contribAmt); // خصم من رصيد الحساب الجاري
    // ارفع نسبة اكتمال الفرصة — ينعكس فوراً على أوزان التوزيع الديناميكية
    setOpps(prev => prev.map(o => o.id === activeOpp.id ? { ...o, raised: Math.min(o.goal, o.raised + contribAmt) } : o));
    toast({
      title: "✅ تمت المساهمة بنجاح",
      description: `ساهمت بـ ${contribAmt.toLocaleString()} ر.س في ${activeOpp.title} · خُصمت من رصيدك · عائد سنوي متوقّع ${annualReturn.toLocaleString()} ر.س`,
    });
    setActiveOpp(null);
  }

  const totalInvested = myContribs.reduce((s, c) => s + c.amount, 0);
  const animatedTotal = useCountUp(totalInvested);   // حركة تصاعدية للمبلغ المستثمر
  const animatedBalance = useCountUp(balance);        // حركة للرصيد المتاح
  const avgRet = totalInvested ? (myContribs.reduce((s, c) => s + c.retPct * c.amount, 0) / totalInvested).toFixed(1) : "0";

  const allocAvgRet = allocations
    ? (allocations.reduce((s, a) => s + a.opp.retPct * a.sharePct, 0) / 100).toFixed(1)
    : null;

  function handleSmartInvest() {
    const total = Math.floor(+investAmt || 0);

    // نتحقّق ونشرح بدل تغيير رقم المستخدم بصمت
    if (total < MIN_SMART_INVEST) {
      setInvestError(`الحد الأدنى للاستثمار الذكي ${MIN_SMART_INVEST.toLocaleString()} ر.س — ليتوزّع على عدة فرص`);
      return;
    }
    if (total > balance) {
      setInvestError(`المبلغ يتجاوز رصيدك المتاح (${balance.toLocaleString()} ر.س)`);
      return;
    }

    setInvestError(null);
    setAllocating(true);
    setAllocations(null);
    setTimeout(() => {
      setAllocations(smartAllocate(total, opps));
      setAllocating(false);
    }, 1800);
  }

  function confirmSmartInvest() {
    const total = allocations!.reduce((s, a) => s + a.amount, 0);
    // أضف كل جزء من التوزيع إلى مساهماتي
    setMyContribs(prev => allocations!.reduce((acc, a) => addContribution(acc, {
      title: a.opp.title, amount: a.amount, retPct: a.opp.retPct, level: a.opp.level, status: "نشطة",
    }), prev));
    withdraw(total); // خصم إجمالي التوزيع من رصيد الحساب الجاري
    // ارفع نسب اكتمال الفرص الموزَّع عليها — تتغيّر الأوزان الديناميكية تبعاً لذلك
    setOpps(prev => prev.map(o => {
      const a = allocations!.find(x => x.opp.id === o.id);
      return a ? { ...o, raised: Math.min(o.goal, o.raised + a.amount) } : o;
    }));
    toast({
      title: "✅ تم توزيع استثمارك بنجاح",
      description: `وُزِّع ${total.toLocaleString()} ر.س على ${allocations!.length} فرص · خُصمت من رصيدك · عائد متوقّع ${allocAvgRet}%`,
    });
    setAllocations(null);
    setInvestAmt("10000");
  }

  return (
    <MobileContainer className="bg-background text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col w-full">

        {/* Header */}
        <div className="bg-card px-4 pt-5 pb-0 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Link href="/services">
              <ChevronRight className="w-6 h-6 text-foreground cursor-pointer" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">الاستثمار</h1>
            <div className="w-6" />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto scrollbar-none">
            {([
              { k: "portfolios", label: "المحافظ الاستثمارية" },
              { k: "namaa", label: "نماء" },
              { k: "ipos", label: "الاكتتابات" },
              { k: "funding", label: "مساهمات التمويل" },
            ] as { k: Tab; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 whitespace-nowrap px-3 py-3 text-[12px] font-bold border-b-2 transition-all ${
                  tab === k ? "text-foreground border-accent" : "text-muted-foreground border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 space-y-4">

          {/* ===== التبويبات الثلاثة الأصلية (عناصر نائبة) ===== */}
          {tab === "portfolios" && (
            <EmptyTab icon={<Briefcase className="w-8 h-8" />} title="المحافظ الاستثمارية"
              desc="كوّن محفظتك الاستثمارية المتوافقة مع الشريعة وتابع أداءها لحظياً." />
          )}
          {tab === "namaa" && (
            <EmptyTab icon={<Sprout className="w-8 h-8" />} title="صناديق نماء"
              desc="صناديق استثمارية متنوّعة يديرها خبراء الإنماء لتنمية أموالك." />
          )}
          {tab === "ipos" && (
            <EmptyTab icon={<FileSignature className="w-8 h-8" />} title="الاكتتابات"
              desc="اكتتب في أحدث الطروحات الأولية في السوق السعودي مباشرة." />
          )}

          {/* ===== التبويب الرابع: مساهمات التمويل (تجربة المموِّل) ===== */}
          {tab === "funding" && (
            <div className="space-y-4">

              {/* ===== أقسام فرعية: مساهماتي · الفرص · الاستثمار الذكي ===== */}
              <div className="grid grid-cols-3 gap-1.5 bg-muted rounded-2xl p-1">
                {([
                  { k: "mine",  label: "مساهماتي" },
                  { k: "opps",  label: "فرص التمويل" },
                  { k: "smart", label: "الاستثمار الذكي" },
                ] as { k: FundingView; label: string }[]).map(({ k, label }) => (
                  <button
                    key={k}
                    onClick={() => setFundingView(k)}
                    className={`py-2 rounded-xl text-[11px] font-bold transition-colors ${
                      fundingView === k ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ===== قسم مساهماتي ===== */}
              {fundingView === "mine" && (
              <div className="space-y-4">
                {/* رأس: ملخّص مساهماتي */}
                <div className="bg-gradient-to-l from-accent/15 to-primary/10 border border-accent/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HandCoins className="w-5 h-5 text-accent" />
                    <h3 className="font-black text-foreground text-sm">مساهماتي الحالية</h3>
                  </div>
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">إجمالي المستثمر</p>
                      <p className="text-lg font-black text-foreground tabular-nums">{animatedTotal.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground">متوسط العائد المتوقّع</p>
                      <p className="text-lg font-black text-accent">{avgRet}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" /> الرصيد المتاح في الحساب الجاري</span>
                    <span className="text-sm font-black text-foreground tabular-nums">{animatedBalance.toLocaleString()} ر.س</span>
                  </div>
                </div>

                {/* قائمة مساهماتي */}
                <div className="space-y-2">
                  {myContribs.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${LC[c.level].dot}`} />
                        <div>
                          <p className="text-xs font-bold text-foreground">{c.title}</p>
                          <p className="text-[9px] text-muted-foreground">{c.status} · عائد {c.retPct}%</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-foreground">{c.amount.toLocaleString()} ر.س</span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-[10px] text-muted-foreground leading-relaxed pt-1">
                  استكشف <button onClick={() => setFundingView("opps")} className="text-accent font-bold">فرص التمويل</button> لإضافة مساهمات جديدة.
                </p>
              </div>
              )}

              {/* ===== قسم الاستثمار الذكي ===== */}
              {fundingView === "smart" && (
              <div className="space-y-4">
              {/* ===== الاستثمار الذكي التلقائي (توزيع المخاطر) ===== */}
              <div className="bg-gradient-to-l from-accent/20 to-primary/10 border-2 border-accent/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-black text-foreground text-sm">الاستثمار الذكي التلقائي</h3>
                  <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">توزيع المخاطر</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">أدخل مبلغاً إجمالياً وسيوزّعه النظام تلقائياً على عدة فرص لتقليل المخاطرة وزيادة العائد.</p>

                {/* أوزان الفئات — تُحتسب لحظياً من أداء كل فئة */}
                <div className="bg-background/60 border border-border rounded-xl p-2.5 mb-3">
                  <p className="text-[10px] text-muted-foreground font-bold mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-accent" /> أوزان التوزيع الحالية (تتغيّر حسب أداء كل فئة لحظياً)
                  </p>
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-2">
                    {(["low", "mid", "high"] as RiskLevel[]).map(l => (
                      <div key={l} className={LC[l].bar} style={{ width: `${liveW[l] * 100}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {(["low", "mid", "high"] as RiskLevel[]).map(l => (
                      <span key={l} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${LC[l].dot}`} />
                        {LC[l].label} <span className="font-black text-foreground">{Math.round(liveW[l] * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={investAmt}
                    onChange={e => { setInvestAmt(e.target.value); setInvestError(null); }}
                    placeholder={`المبلغ (حد أدنى ${MIN_SMART_INVEST.toLocaleString()})`}
                    className={`flex-1 bg-background border rounded-xl px-3 py-2.5 text-foreground text-sm font-medium focus:outline-none ${investError ? "border-red-500" : "border-border focus:border-accent"}`}
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
                {investError && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5 mt-2">
                    {investError}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground mt-2">
                  يُوزَّع المبلغ بالضبط كما أدخلته · التسعير على أساس سايبور {SAIBOR_3M}% + هامش المخاطر
                </p>
              </div>

              {/* Skeleton أثناء حساب التوزيع */}
              {allocating && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-24 h-4 rounded" />
                    <Skeleton className="w-16 h-4 rounded" />
                  </div>
                  <Skeleton className="w-full h-2.5 rounded-full" />
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <Skeleton className="w-20 h-3 rounded" />
                      </div>
                      <Skeleton className="w-16 h-3 rounded" />
                    </div>
                  ))}
                  <Skeleton className="w-full h-10 rounded-xl" />
                </div>
              )}

              {/* ملخّص التوزيع — حركة framer-motion */}
              <AnimatePresence>
                {allocations && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -12, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-accent" />
                        <span className="font-black text-sm text-foreground">ملخّص التوزيع</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-muted-foreground">العائد الإجمالي المتوقّع </span>
                        <span className="text-accent font-black text-sm">{allocAvgRet}%</span>
                      </div>
                    </div>

                    {/* شريط التوزيع البصري — كل جزء ينمو بحركة */}
                    <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                      {allocations.map((a, i) => (
                        <motion.div
                          key={a.opp.id}
                          className={LC[a.opp.level].bar}
                          initial={{ width: 0 }}
                          animate={{ width: `${a.sharePct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                        />
                      ))}
                    </div>

                    {allocations.map((a, i) => (
                      <motion.div
                        key={a.opp.id}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${LC[a.opp.level].dot}`} />
                          <span className="text-xs text-foreground font-medium">{a.opp.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LC[a.opp.level].badge}`}>{a.sharePct}%</span>
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-black text-foreground">{a.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground"> ر.س · {a.opp.retPct}%</span>
                        </div>
                      </motion.div>
                    ))}

                    <button onClick={confirmSmartInvest} className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform mt-1">
                      تأكيد الاستثمار الذكي
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
              )}

              {/* ===== قسم فرص التمويل ===== */}
              {fundingView === "opps" && (
              <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-foreground mb-1">فرص تمويل للمساهمة</h2>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">ساهم بمالك في فرص اجتازت تقييم المخاطر · عائد حلال من ربح المرابحة</p>
              </div>

              {opps.map(opp => {
                const pct = Math.round((opp.raised / opp.goal) * 100);
                const remaining = opp.goal - opp.raised;
                return (
                  <div key={opp.id} className="bg-card rounded-2xl p-5 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-accent">
                          {opp.icon}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-foreground">{opp.title}</h3>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> ينتهي خلال {opp.deadline}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${LC[opp.level].badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${LC[opp.level].dot}`} />
                          خطر {LC[opp.level].label}
                        </span>
                        <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> {opp.retPct}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div className={`h-full rounded-full transition-all duration-700 ${LC[opp.level].bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mb-4">
                      <span className={`font-bold ${LC[opp.level].text}`}>{pct}% مكتمل</span>
                      <span className="text-muted-foreground">متبقّي {remaining.toLocaleString()} من {opp.goal.toLocaleString()} ر.س</span>
                    </div>

                    <button onClick={() => openContribute(opp)} className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform">
                      ساهم في هذه الفرصة
                    </button>
                  </div>
                );
              })}

                <p className="text-center text-[10px] text-muted-foreground leading-relaxed pt-1">
                  🔒 كل فرصة مرّت بمحرّك تقييم المخاطر · تُدار عبر مصرف الإنماء بالتوافق مع أنظمة ساما ومبادئ التمويل الإسلامي
                </p>
              </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ===== نافذة المساهمة في فرصة ===== */}
      <Dialog open={!!activeOpp} onOpenChange={(o) => !o && setActiveOpp(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl" dir="rtl">
          {activeOpp && (() => {
            const maxContrib = activeOpp.goal - activeOpp.raised;
            const annualReturn = Math.round(contribAmt * activeOpp.retPct / 100);
            return (
              <div className="text-right space-y-4 max-h-[75vh] overflow-y-auto pl-1">
                <DialogHeader>
                  <DialogTitle className="text-right flex items-center gap-2 text-foreground">
                    <span className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-accent">{activeOpp.icon}</span>
                    المساهمة في {activeOpp.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${LC[activeOpp.level].badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${LC[activeOpp.level].dot}`} />
                    خطر {LC[activeOpp.level].label}
                  </span>
                  <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> عائد {activeOpp.retPct}%
                  </span>
                </div>

                {/* اختيار المبلغ */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-muted-foreground font-bold">مبلغ المساهمة</span>
                    <span className="text-base font-black text-accent">{contribAmt.toLocaleString()} ر.س</span>
                  </div>
                  <Slider
                    min={1000} max={Math.max(1000, maxContrib)} step={500}
                    value={[contribAmt]}
                    onValueChange={([v]) => setContribAmt(v)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{Math.max(1000, maxContrib).toLocaleString()}</span>
                    <span>1,000</span>
                  </div>
                </div>

                {/* العائد المتوقّع */}
                <div className="bg-muted rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">نسبة العائد المتوقّع</p>
                    <p className="text-lg font-black text-green-600 dark:text-green-400">{activeOpp.retPct}%</p>
                  </div>
                  <div className="w-px h-9 bg-border" />
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground mb-0.5">عائدك السنوي المتوقّع</p>
                    <p className="text-lg font-black text-foreground">+{annualReturn.toLocaleString()} ر.س</p>
                  </div>
                </div>

                {/* أساس التسعير (سايبور) */}
                <div className="flex items-center justify-between bg-background border border-border rounded-xl px-3 py-2">
                  <span className="text-[10px] text-muted-foreground">أساس التسعير</span>
                  <span className="text-[10px] font-bold text-foreground">
                    سايبور {SAIBOR_3M}% + هامش مخاطر {RISK_SPREAD[activeOpp.level]}%
                  </span>
                </div>

                {/* متى يرجع العائد؟ */}
                <div className="bg-muted rounded-2xl p-3 space-y-2">
                  <p className="text-[11px] font-black text-foreground flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-accent" /> متى يرجع عائدك؟
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      أول دفعة بعد <span className="font-bold text-foreground">{FIRST_PAYOUT_AFTER_DAYS} يوماً</span> من اكتمال جمع التمويل
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      دفعات <span className="font-bold text-foreground">شهرية</span> (أصل + ربح) على مدى <span className="font-bold text-foreground">{activeOpp.months} شهراً</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      اكتمال رأس المال والعائد: <span className="font-bold text-foreground">{maturityLabel(activeOpp.months)}</span>
                      {" · "}إجمالي متوقّع <span className="font-bold text-green-600 dark:text-green-400">+{Math.round(contribAmt * activeOpp.retPct / 100 * (activeOpp.months / 12)).toLocaleString()} ر.س</span>
                    </p>
                  </div>
                </div>

                {/* جدول السداد الشهري المتراكم — يوضّح متى يعود رأس المال */}
                <RepaymentSchedule
                  amount={contribAmt}
                  months={activeOpp.months}
                  retPct={activeOpp.retPct}
                />

                <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  مساهمة متوافقة مع الشريعة (مرابحة) · تُدار عبر مصرف الإنماء وفق أنظمة ساما.
                </div>

                <button
                  onClick={confirmContribute}
                  className="w-full bg-accent text-accent-foreground font-bold text-sm py-3.5 rounded-xl active:scale-95 transition-transform"
                >
                  تأكيد المساهمة في هذه الفرصة
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}

function EmptyTab({ icon, title, desc }: { icon: JSX.Element; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-accent mb-4">
        {icon}
      </div>
      <h2 className="font-black text-lg text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{desc}</p>
      <button className="mt-5 bg-accent text-accent-foreground font-bold text-sm px-6 py-3 rounded-xl active:scale-95 transition-transform">
        استكشف
      </button>
    </div>
  );
}
