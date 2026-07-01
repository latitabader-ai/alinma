import { useState } from "react";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, TrendingUp, Briefcase, Sprout, FileSignature, HandCoins, Clock, Car, Store, User, Wrench, Sparkles, Loader2, PieChart, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tab = "portfolios" | "namaa" | "ipos" | "funding";

interface Opp {
  id: number;
  title: string;
  icon: JSX.Element;
  goal: number;
  raised: number;
  retPct: number;
  level: "low" | "mid" | "high";
  deadline: string;
}

// فرص تمويل للمساهمة (تجربة المموِّل)
const OPPS: Opp[] = [
  { id: 1, title: "تمويل سيارة",          icon: <Car className="w-5 h-5" />,   goal: 80000, raised: 52000, retPct: 6.5, level: "low",  deadline: "5 أيام" },
  { id: 2, title: "مشاريع منشآت صغيرة",   icon: <Store className="w-5 h-5" />, goal: 60000, raised: 22000, retPct: 8.2, level: "mid",  deadline: "8 أيام" },
  { id: 3, title: "تمويل شخصي",           icon: <User className="w-5 h-5" />,  goal: 40000, raised: 30000, retPct: 7.0, level: "low",  deadline: "3 أيام" },
  { id: 4, title: "تمويل معدّات",         icon: <Wrench className="w-5 h-5" />, goal: 35000, raised: 9000,  retPct: 11.0, level: "high", deadline: "12 يوماً" },
];

// مساهمات المموِّل الحالية
interface Contribution { title: string; amount: number; retPct: number; level: "low" | "mid" | "high"; status: string }

const INITIAL_CONTRIBUTIONS: Contribution[] = [
  { title: "تمويل سيارة",        amount: 5000, retPct: 6.5, level: "low",  status: "نشطة" },
  { title: "معدّات ورشة",        amount: 3000, retPct: 7.0, level: "low",  status: "نشطة" },
  { title: "أجهزة إلكترونية",   amount: 2000, retPct: 7.5, level: "mid",  status: "نشطة" },
];

const LC = {
  low:  { text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500", label: "منخفض" },
  mid:  { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "متوسط" },
  high: { text: "text-red-600 dark:text-red-400",     bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",       dot: "bg-red-500",   label: "مرتفع" },
};

// توزيع ذكي: أوزان المخاطر — منخفض 50%، متوسط 35%، مرتفع 15%
const RISK_WEIGHT = { low: 0.50, mid: 0.35, high: 0.15 };

interface Alloc { opp: Opp; amount: number; sharePct: number }

function smartAllocate(total: number, opps: Opp[]): Alloc[] {
  const perLevelCount = { low: 0, mid: 0, high: 0 };
  opps.forEach(o => perLevelCount[o.level]++);
  const weighted = opps.map(o => ({ opp: o, w: RISK_WEIGHT[o.level] / perLevelCount[o.level] }));
  const sumW = weighted.reduce((s, x) => s + x.w, 0);
  return weighted.map(({ opp, w }) => {
    const amount = Math.max(1000, Math.round((w / sumW) * total / 1000) * 1000);
    const sharePct = Math.round((amount / total) * 100);
    return { opp, amount, sharePct };
  });
}

export default function Investments() {
  const [tab, setTab] = useState<Tab>("funding");
  const { toast } = useToast();

  // مساهماتي الحالية (تتحدّث عند كل مساهمة)
  const [myContribs, setMyContribs] = useState<Contribution[]>(INITIAL_CONTRIBUTIONS);

  // الاستثمار الذكي (توزيع المخاطر)
  const [investAmt, setInvestAmt] = useState("10000");
  const [allocating, setAllocating] = useState(false);
  const [allocations, setAllocations] = useState<Alloc[] | null>(null);

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
    toast({
      title: "✅ تمت المساهمة بنجاح",
      description: `ساهمت بـ ${contribAmt.toLocaleString()} ر.س في ${activeOpp.title} · عائد سنوي متوقّع ${annualReturn.toLocaleString()} ر.س`,
    });
    setActiveOpp(null);
  }

  const totalInvested = myContribs.reduce((s, c) => s + c.amount, 0);
  const avgRet = totalInvested ? (myContribs.reduce((s, c) => s + c.retPct * c.amount, 0) / totalInvested).toFixed(1) : "0";

  const allocAvgRet = allocations
    ? (allocations.reduce((s, a) => s + a.opp.retPct * a.sharePct, 0) / 100).toFixed(1)
    : null;

  function handleSmartInvest() {
    const total = Math.max(5000, Math.round(+investAmt / 1000) * 1000);
    setAllocating(true);
    setAllocations(null);
    setTimeout(() => {
      setAllocations(smartAllocate(total, OPPS));
      setAllocating(false);
    }, 1800);
  }

  function confirmSmartInvest() {
    const total = allocations!.reduce((s, a) => s + a.amount, 0);
    // أضف كل جزء من التوزيع إلى مساهماتي
    setMyContribs(prev => allocations!.reduce((acc, a) => addContribution(acc, {
      title: a.opp.title, amount: a.amount, retPct: a.opp.retPct, level: a.opp.level, status: "نشطة",
    }), prev));
    toast({
      title: "✅ تم توزيع استثمارك بنجاح",
      description: `وُزِّع ${total.toLocaleString()} ر.س على ${allocations!.length} فرص بعائد متوقّع ${allocAvgRet}%`,
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
            <div className="space-y-5">

              {/* ملخّص مساهماتي */}
              <div className="bg-gradient-to-l from-accent/15 to-primary/10 border border-accent/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HandCoins className="w-5 h-5 text-accent" />
                  <h3 className="font-black text-foreground text-sm">مساهماتي الحالية</h3>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">إجمالي المستثمر</p>
                    <p className="text-lg font-black text-foreground">{totalInvested.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground">متوسط العائد المتوقّع</p>
                    <p className="text-lg font-black text-accent">{avgRet}%</p>
                  </div>
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

              {/* ===== الاستثمار الذكي التلقائي (توزيع المخاطر) ===== */}
              <div className="bg-gradient-to-l from-accent/20 to-primary/10 border-2 border-accent/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-black text-foreground text-sm">الاستثمار الذكي التلقائي</h3>
                  <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">توزيع المخاطر</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">أدخل مبلغاً إجمالياً وسيوزّعه النظام تلقائياً على عدة فرص لتقليل المخاطرة وزيادة العائد.</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={investAmt}
                    onChange={e => setInvestAmt(e.target.value)}
                    placeholder="المبلغ الإجمالي (ريال)"
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

              {/* ملخّص التوزيع */}
              {allocations && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
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

                  {/* شريط التوزيع البصري */}
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                    {allocations.map(a => (
                      <div key={a.opp.id} className={`${LC[a.opp.level].bar} transition-all duration-700`} style={{ width: `${a.sharePct}%` }} />
                    ))}
                  </div>

                  {allocations.map(a => (
                    <div key={a.opp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${LC[a.opp.level].dot}`} />
                        <span className="text-xs text-foreground font-medium">{a.opp.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LC[a.opp.level].badge}`}>{a.sharePct}%</span>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-foreground">{a.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground"> ر.س · {a.opp.retPct}%</span>
                      </div>
                    </div>
                  ))}

                  <button onClick={confirmSmartInvest} className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform mt-1">
                    تأكيد الاستثمار الذكي
                  </button>
                </div>
              )}

              {/* فرص التمويل للمساهمة */}
              <div>
                <h2 className="text-base font-black text-foreground mb-1">فرص تمويل للمساهمة</h2>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">ساهم بمالك في فرص اجتازت تقييم المخاطر · عائد حلال من ربح المرابحة</p>
              </div>

              {OPPS.map(opp => {
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

              <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
                🔒 كل فرصة مرّت بمحرّك تقييم المخاطر · تُدار عبر مصرف الإنماء بالتوافق مع أنظمة ساما ومبادئ التمويل الإسلامي
              </p>
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
              <div className="text-right space-y-4">
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
