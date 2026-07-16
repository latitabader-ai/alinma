import { MobileContainer } from "@/components/MobileContainer";
import { History, Bookmark, ShoppingCart, Search, Ticket, Smartphone, ShieldCheck, Laptop, Gamepad2, Shirt, Apple, ChevronRight, HandCoins, Camera, Sofa } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

// منتجات قابلة للتمويل عبر شارِك — نوع السلعة يطابق خيارات نموذج طلب التمويل
const FINANCEABLE = [
  { name: "لابتوب احترافي",   cat: "أجهزة إلكترونية", price: 6500, icon: Laptop },
  { name: "جهاز ألعاب PS5",   cat: "أجهزة إلكترونية", price: 2400, icon: Gamepad2 },
  { name: "معدّات تصوير",     cat: "معدّات مهنية",    price: 8900, icon: Camera },
  { name: "طقم أثاث منزلي",   cat: "أثاث منزلي",       price: 4200, icon: Sofa },
];

export default function Store() {
  return (
    <MobileContainer className="p-4 relative">
      <div className="absolute top-20 right-6 text-right z-0">
        <p className="text-accent text-sm font-medium">Smarter shopping</p>
        <h2 className="text-foreground text-3xl font-bold">All the products<br/>you love</h2>
      </div>

      <header className="flex justify-between items-center mt-4 mb-32 z-10 relative">
        <h1 className="text-foreground font-medium text-xl">alinma Store</h1>
        <div className="flex gap-4">
          <History className="text-foreground w-5 h-5" />
          <Bookmark className="text-foreground w-5 h-5" />
          <ShoppingCart className="text-foreground w-5 h-5" />
        </div>
      </header>

      <div className="bg-card text-card-foreground rounded-[24px] p-5 shadow-xl flex-1 relative z-10 -mt-12 border border-border">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            className="pl-10 bg-muted border-border rounded-xl h-12"
            placeholder="Search products, brands..."
          />
        </div>

        <div className="bg-primary rounded-2xl p-5 text-primary-foreground flex items-center justify-between mb-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 translate-y-10" />
          <div className="relative z-10 w-2/3">
            <h3 className="font-bold text-lg mb-2">Explore latest tech products</h3>
            <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-medium">Shop Now</div>
          </div>
          <Laptop className="w-16 h-16 opacity-80 relative z-10" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Ticket className="w-6 h-6" />, label: "Vouchers" },
            { icon: <Smartphone className="w-6 h-6" />, label: "Mobile Recharge" },
            { icon: <ShieldCheck className="w-6 h-6" />, label: "Insurance" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-muted border border-border rounded-2xl flex items-center justify-center text-primary">
                {icon}
              </div>
              <span className="text-[10px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-foreground">Shop by category</h3>
            <span className="text-xs text-primary font-medium flex items-center">View More <ChevronRight className="w-3 h-3 ml-1" /></span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { icon: <Laptop className="w-6 h-6" />, label: "Electronics" },
              { icon: <Gamepad2 className="w-6 h-6" />, label: "Gaming" },
              { icon: <Shirt className="w-6 h-6" />, label: "Fashion &\nApparel" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-primary border border-border">
                  {icon}
                </div>
                <span className="text-[10px] font-medium text-center text-foreground whitespace-pre-line leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-foreground">Featured brands</h3>
            <span className="text-xs text-primary font-medium flex items-center">View More <ChevronRight className="w-3 h-3 ml-1" /></span>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-24 bg-muted border border-border rounded-xl flex items-center justify-center">
              <Apple className="w-6 h-6 text-foreground" />
            </div>
            <div className="h-12 w-24 bg-muted border border-border rounded-xl flex items-center justify-center">
              <span className="font-bold text-foreground tracking-tighter">SAMSUNG</span>
            </div>
          </div>
        </div>

        {/* ===== مموّلة عبر شارِك — منتجات قابلة للتمويل الجماعي ===== */}
        <div dir="rtl" className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-foreground">موّلها عبر شارِك</h3>
            <span className="text-[10px] text-muted-foreground">تمويل جماعي متوافق مع الشريعة</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FINANCEABLE.map(({ name, cat, price, icon: Icon }) => (
              <div key={name} className="bg-muted border border-border rounded-2xl p-3 flex flex-col">
                <div className="w-full aspect-[3/2] bg-card rounded-xl flex items-center justify-center text-primary mb-2 border border-border">
                  <Icon className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">{name}</p>
                <p className="text-[10px] text-muted-foreground mb-1.5">{cat}</p>
                <p className="text-sm font-black text-foreground mb-2">
                  {price.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ر.س</span>
                </p>
                <Link href={`/crowd-finance?item=${encodeURIComponent(cat)}&amount=${price}&name=${encodeURIComponent(name)}`}>
                  <div className="w-full flex items-center justify-center gap-1.5 bg-accent/10 text-accent border border-accent/30 rounded-lg py-2 text-[11px] font-bold cursor-pointer active:scale-95 transition-transform">
                    <HandCoins className="w-3.5 h-3.5" />
                    موّلها عبر شارِك
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MobileContainer>
  );
}
