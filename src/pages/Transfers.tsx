import { MobileContainer } from "@/components/MobileContainer";
import { History, Search, UserPlus, Zap, ChevronLeft, ArrowLeftRight, MapPin, Globe, ChevronDown } from "lucide-react";

export default function Transfers() {
  return (
    <MobileContainer className="bg-background p-4 text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        <header className="flex justify-between items-center mt-4 mb-8">
          <h1 className="text-2xl font-bold text-foreground">الحوالات</h1>
          <div className="flex gap-5 text-muted-foreground">
            <Search className="w-6 h-6" />
            <History className="w-6 h-6" />
          </div>
        </header>

        <div className="mb-8">
           <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg text-foreground">المستفيدون المفضلون</span>
              <div className="flex items-center gap-1 text-accent text-sm">
                <span>إدارة</span>
                <ChevronDown className="w-4 h-4" />
              </div>
           </div>
           <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center border border-dashed border-border">
              <UserPlus className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm mb-2 text-muted-foreground font-medium">لا يوجد مستفيدون مفضلون!</p>
              <button className="text-accent text-xs underline font-medium">كيفية الإضافة؟</button>
           </div>
        </div>

        <div className="bg-card rounded-2xl p-4 mb-8 flex justify-between items-center cursor-pointer border border-border">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
               <Zap className="w-6 h-6 fill-accent" />
             </div>
             <div>
                <h3 className="font-bold text-base text-foreground">حوالة سريعة</h3>
                <p className="text-xs text-muted-foreground mt-1">بدون إضافة مستفيد</p>
             </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </div>

        <h2 className="text-xs font-bold text-muted-foreground mb-4 px-2">نوع التحويل</h2>
        <div className="space-y-3">
           {[
             { icon: <ArrowLeftRight className="w-6 h-6" />, label: "بين حساباتي" },
             { icon: <span className="font-serif font-bold text-xl italic">I</span>, label: "داخل الإنماء" },
             { icon: <MapPin className="w-6 h-6" />, label: "حوالة محلية" },
             { icon: <Globe className="w-6 h-6" />, label: "حوالة دولية" },
           ].map(({ icon, label }) => (
             <div key={label} className="bg-card rounded-2xl p-4 flex justify-between items-center cursor-pointer border border-border">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground">
                   {icon}
                 </div>
                 <span className="font-medium text-[15px] text-foreground">{label}</span>
               </div>
               <ChevronLeft className="w-5 h-5 text-muted-foreground" />
             </div>
           ))}
        </div>
      </div>
    </MobileContainer>
  );
}
