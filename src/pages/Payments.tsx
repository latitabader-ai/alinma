import { MobileContainer } from "@/components/MobileContainer";
import { History, Search, Car, CreditCard, Plus, Repeat, Landmark } from "lucide-react";

export default function Payments() {
  return (
    <MobileContainer className="bg-background p-4 text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        <header className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">المدفوعات</h1>
          <div className="flex gap-4 text-muted-foreground">
            <Search className="w-6 h-6" />
            <History className="w-6 h-6" />
          </div>
        </header>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <button className="bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap">سداد</button>
          <button className="bg-card text-muted-foreground px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border border-border">مدفوعات الإنماء</button>
          <button className="bg-card text-muted-foreground px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border border-border">شحن الجوال</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
           {[
             { icon: <Car className="w-7 h-7" />, label: "المخالفات المرورية" },
             { icon: <CreditCard className="w-7 h-7" />, label: "سداد لمرة واحدة" },
             { icon: <Plus className="w-7 h-7" />, label: "إضافة فاتورة جديدة" },
             { icon: <Repeat className="w-7 h-7" />, label: "الفواتير الدورية" },
             { icon: <span className="text-lg font-bold mb-1">سداد</span>, label: "وسطاء سداد" },
             { icon: <Landmark className="w-7 h-7" />, label: "المدفوعات الحكومية" },
           ].map(({ icon, label }) => (
             <div key={label} className="bg-card rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square text-center border border-border">
               <div className="text-foreground">{icon}</div>
               <span className="text-[11px] font-medium leading-tight text-foreground">{label}</span>
             </div>
           ))}
        </div>

        <div className="space-y-3">
           <div className="h-[72px] bg-card/60 rounded-2xl animate-pulse border border-border"></div>
           <div className="h-[72px] bg-card/60 rounded-2xl animate-pulse border border-border"></div>
           <div className="h-[72px] bg-card/60 rounded-2xl animate-pulse border border-border"></div>
        </div>

        {/* نص الثقة والامتثال */}
        <p className="text-center text-[10px] text-muted-foreground leading-relaxed mt-8 mb-4 px-2">
          🔒 تُدار أموالك بأمان عبر مصرف الإنماء بالتوافق مع أنظمة البنك المركزي السعودي (ساما) ومبادئ التمويل الإسلامي.
        </p>
      </div>
    </MobileContainer>
  );
}
