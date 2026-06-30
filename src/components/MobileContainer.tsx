import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  hasGlow?: boolean;
  dir?: string;
}

export function MobileContainer({ children, className, hasGlow = true, dir }: MobileContainerProps) {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-[#0a1628] dark:bg-[#060f1e]">
      <div className="relative w-full max-w-md bg-background min-h-full overflow-hidden shadow-2xl pb-20">
        {hasGlow && (
          <div className="absolute top-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <div className={cn("relative z-10 min-h-full flex flex-col", className)} dir={dir}>
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}