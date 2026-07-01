import { useState } from "react";
import { MobileContainer } from "@/components/MobileContainer";
import { ChevronRight, TrendingUp, Briefcase, Sprout, FileSignature, HandCoins, Clock, Car, Store, User, Wrench, Wallet } from "lucide-react";
import { Link } from "wouter";

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
const MY_CONTRIBUTIONS = [
  { title: "تمويل سيارة",        amount: 5000, retPct: 6.5, level: "low"  as const, status: "نشطة" },
  { title: "معدّات ورشة",        amount: 3000, retPct: 7.0, level: "low"  as const, status: "نشطة" },
  { title: "أجهزة إلكترونية",   amount: 2000, retPct: 7.5, level: "mid"  as const, status: "نشطة" },
];

const LC = {
  low:  { text: "text-green-600 dark:text-green-400", bar: "bg-green-500", badge: "bg-green-500/15 text-green-700 dark:text-green-400", dot: "bg-green-500", label: "منخفض" },
  mid:  { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "متوسط" },
  high: { text: "text-red-600 dark:text-red-400",     bar: "bg-red-500",   badge: "bg-red-500/15 text-red-700 dark:text-red-400",       dot: "bg-red-500",   label: "مرتفع" },
};

export default function Investments() {
  const [tab, setTab] = useState<Tab>("funding");

  const totalInvested = MY_CONTRIBUTIONS.reduce((s, c) => s + c.amount, 0);
  const avgRet = (MY_CONTRIBUTIONS.reduce((s, c) => s + c.retPct * c.amount, 0) / totalInvested).toFixed(1);

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
                {MY_CONTRIBUTIONS.map((c, i) => (
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

                    <button className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform">
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
