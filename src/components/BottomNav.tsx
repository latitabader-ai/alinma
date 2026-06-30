import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Grid, ClipboardList, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/services", icon: Grid, label: "الخدمات" },
  { path: "/store", icon: ShoppingBag, label: "المتجر" },
  { path: "/payments", icon: ClipboardList, label: "المدفوعات" },
  { path: "/transfers", icon: ArrowLeftRight, label: "التحويل" },
  { path: "/", icon: Home, label: "الرئيسية" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 w-full max-w-md mx-auto bg-card border-t border-border px-2 py-2 pb-6 z-50">
      <div className="flex items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn("flex flex-col items-center justify-center gap-1.5 cursor-pointer w-16", isActive ? "text-accent" : "text-muted-foreground")}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
