import { MobileContainer } from "@/components/MobileContainer";
import { LogOut, Bell, Pencil, Eye, Receipt, SendHorizontal, Smartphone, Car, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";
import { useAccount } from "@/lib/AccountProvider";

export default function HomeAr() {
  const { balance } = useAccount();
  return (
    <MobileContainer className="bg-background p-4 text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        {/* Header */}
        <header className="flex justify-between items-center mt-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center font-bold text-lg text-foreground border border-border">
              ل ا
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-foreground">لطيفة</span>
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">✨</div>
              </div>
              <span className="text-xs text-muted-foreground">10 نقطة</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Pencil className="w-5 h-5 text-muted-foreground" />
            <Bell className="w-5 h-5 text-muted-foreground" />
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </div>
        </header>

        {/* Account Section */}
        <div className="bg-card rounded-3xl p-5 mb-6 relative shadow-lg border border-border">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-muted px-3 py-1 rounded-full text-[10px] text-muted-foreground">جاري</div>
            <span className="text-sm text-muted-foreground" dir="ltr">••• 6000 حساب جاري</span>
          </div>
          <div className="flex justify-end items-center mt-4">
            <div className="flex items-center gap-2" dir="ltr">
              <Eye className="w-5 h-5 text-muted-foreground mr-2" />
              <span className="text-3xl font-bold tracking-tight text-foreground">{balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              <span className="text-lg text-muted-foreground">ر.س</span>
            </div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full"></div>
        </div>

        {/* Promo Banner — الإنماء فانتزي بخلفية السيارة */}
        <div className="rounded-3xl h-28 mb-6 relative overflow-hidden flex items-center justify-end px-5 shadow-md border border-border bg-gradient-to-l from-[#2a2f3d] via-[#3d3038] to-[#4a3b3f]">
          {/* أشكال قطرية خلفية */}
          <div className="absolute inset-0 opacity-60" aria-hidden="true">
            <svg viewBox="0 0 400 112" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 0 L120 0 L70 112 L0 112 Z" fill="#b08b8b" opacity="0.35" />
              <path d="M150 0 L260 0 L200 112 L90 112 Z" fill="#b08b8b" opacity="0.22" />
            </svg>
          </div>
          {/* ظلّ السيارة */}
          <div className="absolute left-2 bottom-1 w-[58%] opacity-90" aria-hidden="true">
            <svg viewBox="0 0 240 80" className="w-full h-auto">
              <g fill="#c9ccd4">
                <path d="M14 62 Q10 48 28 45 L58 41 Q78 22 112 20 L150 20 Q182 23 202 42 L224 48 Q236 52 232 62 Z" />
                <path d="M70 41 Q86 27 112 26 L146 26 Q170 28 188 43 Z" fill="#8b94a6" />
              </g>
              <circle cx="66" cy="62" r="13" fill="#1c1f27" />
              <circle cx="66" cy="62" r="6" fill="#c9ccd4" />
              <circle cx="188" cy="62" r="13" fill="#1c1f27" />
              <circle cx="188" cy="62" r="6" fill="#c9ccd4" />
            </svg>
          </div>
          <div className="z-10 text-right">
            <h3 className="text-white font-bold text-lg drop-shadow">الإنماء فانتزي</h3>
            <p className="text-[#e8a598] text-sm font-medium drop-shadow">توقّع واربح!</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Receipt className="w-6 h-6" />, label: "دفع الفواتير" },
            { icon: <SendHorizontal className="w-6 h-6" />, label: "الحوالات السريعة" },
            { icon: <Smartphone className="w-6 h-6" />, label: "شحن الجوال" },
            { icon: <Car className="w-6 h-6" />, label: "المخالفات المرورية" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-accent shadow-sm border border-border">
                {icon}
              </div>
              <span className="text-[10px] text-center font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Promo Card — إعلان التمويل الجماعي */}
        <Link href="/crowd-finance">
          <div className="bg-gradient-to-br from-accent to-orange-500 rounded-3xl p-5 relative overflow-hidden shadow-md cursor-pointer active:scale-[0.98] transition-transform">
            {/* خلفية: مساهمون يلتقون حول هدف واحد */}
            <div className="absolute inset-0 opacity-25" aria-hidden="true">
              <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                <circle cx="60" cy="132" r="46" fill="none" stroke="#fff" strokeWidth="1.5" />
                <circle cx="60" cy="132" r="70" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6" />
                {/* أفراد مساهمون */}
                {[
                  [24, 66], [58, 50], [92, 62], [124, 84],
                ].map(([x, y], i) => (
                  <g key={i} fill="#fff">
                    <circle cx={x} cy={y} r="7" />
                    <path d={`M${x - 11} ${y + 22} a11 13 0 0 1 22 0 Z`} />
                  </g>
                ))}
                {/* خطوط تدفّق المال نحو الهدف */}
                {[[24, 66], [58, 50], [92, 62], [124, 84]].map(([x, y], i) => (
                  <path key={i} d={`M${x} ${y + 26} Q${(x + 60) / 2} 108 60 128`} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                ))}
                <circle cx="60" cy="132" r="12" fill="#fff" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-white/25 px-2.5 py-1 rounded-full text-[10px] font-black text-white">شارِك</span>
                <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold text-white">متوافق مع الشريعة</span>
              </div>
              <h3 className="font-black text-2xl mb-2 text-white">التمويل الجماعي</h3>
              <p className="text-xs text-white/95 leading-relaxed mb-4 max-w-[85%]">
                يشترك عدة مساهمين في تمويل طلبك — تحصل على ما تريد اليوم وتسدّده بأقساط،
                وهم يربحون عائداً حلالاً من ربح المرابحة.
              </p>
              <span className="bg-white text-accent px-3 py-1.5 rounded-full inline-flex items-center gap-1 text-xs font-black">
                ابدأ الآن <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </MobileContainer>
  );
}
