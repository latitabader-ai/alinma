import { MobileContainer } from "@/components/MobileContainer";
import { LogOut, Bell, Pencil, Eye, Receipt, SendHorizontal, Smartphone, Car, CreditCard } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomeAr() {
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
              <span className="text-3xl font-bold tracking-tight text-foreground">0.00</span>
              <span className="text-lg text-muted-foreground">ر.س</span>
            </div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full"></div>
        </div>

        {/* Promo Banner */}
        <div className="bg-card rounded-3xl h-24 mb-6 relative overflow-hidden flex items-center justify-end px-5 shadow-md border border-border">
          <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-muted"></div>
          <div className="z-10 text-right">
            <h3 className="text-foreground font-bold text-lg">الإنماء فانتزي</h3>
            <p className="text-accent text-sm">توقع واربح!</p>
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

        {/* Promo Card */}
        <div className="bg-gradient-to-br from-accent to-orange-200 dark:to-orange-900/50 rounded-3xl p-5 relative overflow-hidden shadow-md">
           <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-xl italic text-accent-foreground/70">airalo</div>
              <div className="bg-black/10 px-2 py-1 rounded text-[10px] font-bold text-accent-foreground">أكثـر akthr</div>
           </div>
           <h3 className="font-bold text-2xl mb-1 text-accent-foreground">بنقطتين</h3>
           <div className="bg-black/20 text-white px-3 py-1 rounded-full inline-block text-xs font-medium mb-1">خصم 20%</div>
           <p className="text-xs font-bold mb-5 text-accent-foreground">+ 10 نقاط إضافية في أكثر</p>
           <p className="text-[8px] opacity-70 text-accent-foreground">تطبق الشروط والأحكام</p>
           <div className="absolute left-0 bottom-0 opacity-20">
             <CreditCard className="w-24 h-24 -ml-4 -mb-4 text-accent-foreground" />
           </div>
        </div>
      </div>
    </MobileContainer>
  );
}
