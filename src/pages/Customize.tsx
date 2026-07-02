import { MobileContainer } from "@/components/MobileContainer";
import { ArrowLeft, GripHorizontal, Settings2 } from "lucide-react";
import { Link } from "wouter";

export default function Customize() {
  return (
    <MobileContainer className="p-4 bg-background" hasGlow={false}>
      <header className="flex items-center gap-4 mt-4 mb-6">
        <Link href="/">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground cursor-pointer hover:bg-muted/70 border border-border">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <h1 className="text-foreground font-medium text-xl">Customize Home</h1>
      </header>

      <div className="bg-card text-card-foreground rounded-[24px] p-5 shadow-xl flex-1 flex flex-col gap-6 border border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Widgets</h2>
          <Settings2 className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl">
            <GripHorizontal className="w-5 h-5 text-muted-foreground" />
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Spending this month</h3>
              <p className="text-xs text-muted-foreground">••••••••</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl">
            <GripHorizontal className="w-5 h-5 text-muted-foreground" />
            <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">Income</h3>
              <p className="text-xs text-muted-foreground">••••••••</p>
            </div>
          </div>
        </div>

        <h2 className="font-semibold text-lg pt-2">Insights</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
            <div className="text-accent text-lg">★★★★</div>
            <h3 className="font-medium text-sm">Points</h3>
            <p className="text-[10px] text-muted-foreground">1,250 points expire on 28 Mar 2027 — Akthr</p>
          </div>

          <div className="bg-muted border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
            <div className="text-primary text-lg">★★★★</div>
            <h3 className="font-medium text-sm">Total invested</h3>
            <p className="text-[10px] text-muted-foreground">3 active subscriptions — Nama</p>
          </div>
        </div>

        <h2 className="font-semibold text-lg pt-2">Cards & Investment</h2>

        <div className="flex flex-wrap gap-2">
          {["Zakaty", "Waqfy", "Sahem", "Orphans"].map(chip => (
            <div key={chip} className="px-4 py-2 bg-muted text-sm font-medium rounded-full border border-border">
              {chip}
            </div>
          ))}
        </div>
      </div>
    </MobileContainer>
  );
}
