import { MobileContainer } from "@/components/MobileContainer";
import { Bell, LogOut, Edit3, Eye, Zap, Receipt, Smartphone, Car, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <MobileContainer className="p-4">
      <header className="flex items-center justify-between mt-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <div>
            <h1 className="text-white font-medium text-lg">Mohammed</h1>
            <div className="flex items-center gap-1">
              <span className="text-accent text-sm">★</span>
              <span className="text-white/80 text-sm">3,240</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-10 h-10">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-10 h-10">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-10 h-10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="bg-card text-card-foreground rounded-[24px] p-5 shadow-xl mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Primary account ••• 4726</h2>
          <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium">Current</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">₤ 21,382.12</span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground w-8 h-8 rounded-full">
            <Eye className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">Quick<br/>Transfer</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white">
              <Receipt className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">12</div>
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">My<br/>Bills</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">Mobile<br/>Recharge</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">Traffic<br/>violations</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] p-5 shadow-lg mb-6 flex items-center justify-between text-white">
        <div>
          <h3 className="font-bold text-lg mb-1">Explore New Promotions!</h3>
          <p className="text-white/80 text-xs">Discover exclusive offers just for you</p>
        </div>
        <ChevronRight className="w-6 h-6 opacity-80" />
      </div>

      <div className="bg-card text-card-foreground rounded-[24px] p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-medium">Infinite Credit Card ••• 4394</h2>
          </div>
        </div>
        <div className="bg-primary text-white rounded-xl p-4 h-32 relative overflow-hidden mb-4 shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-lg italic tracking-wider">alinma</span>
              <span className="text-xs opacity-80 uppercase tracking-widest">Infinite</span>
            </div>
            <div>
              <div className="font-mono text-sm tracking-widest opacity-80 mb-1">**** **** **** 4394</div>
              <div className="text-xs opacity-80">MOHAMMED</div>
            </div>
          </div>
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-medium">
          Pay
        </Button>
      </div>
    </MobileContainer>
  );
}
