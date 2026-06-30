import { MobileContainer } from "@/components/MobileContainer";
import { Link } from "wouter";
import { ChevronLeft, Wallet, CreditCard, Building, PiggyBank, TrendingUp, Users, Star, FileText, ClipboardList, Shield, DollarSign, ArrowLeftRight } from "lucide-react";

export default function Services() {
  return (
    <MobileContainer className="bg-background p-4 text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        <header className="flex items-center gap-3 mt-4 mb-8">
          <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center font-bold text-lg text-foreground border border-border">
            ل ا
          </div>
          <span className="font-bold text-xl text-foreground">لطيفة</span>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <ServiceIcon icon={Wallet} label="الحسابات" />
          <ServiceIcon icon={CreditCard} label="البطاقات" />
          <ServiceIcon icon={Building} label="التمويل" href="/finance-ar" />
          <ServiceIcon icon={PiggyBank} label="الادخار" />
          <ServiceIcon icon={TrendingUp} label="الاستثمار" />
          <ServiceIcon icon={Users} label="العائلة" />
          <ServiceIcon icon={Star} label="أكثر" />
          <ServiceIcon icon={FileText} label="الشهادات" />
          <ServiceIcon icon={ClipboardList} label="متابعة الطلبات" />
          <ServiceIcon icon={Shield} label="التأمين" />
        </div>

        <div className="space-y-3 mt-4">
          <ListItem label="النقد الطارئ" icon={Wallet} />
          <ListItem label="محول العملات" icon={ArrowLeftRight} />
          <ListItem label="أسعار صرف العملات" icon={DollarSign} />
        </div>
      </div>
    </MobileContainer>
  );
}

function ServiceIcon({ icon: Icon, label, href }: { icon: any, label: string, href?: string }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 bg-card rounded-2xl p-4 aspect-square cursor-pointer border border-border">
      <Icon className="w-7 h-7 text-foreground" />
      <span className="text-[11px] font-medium text-center leading-tight text-foreground">{label}</span>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function ListItem({ label, icon: Icon }: { label: string, icon: any }) {
  return (
    <div className="flex items-center justify-between p-5 bg-card rounded-2xl cursor-pointer border border-border">
      <div className="flex items-center gap-4">
        <Icon className="w-6 h-6 text-foreground" />
        <span className="font-medium text-[15px] text-foreground">{label}</span>
      </div>
      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}
