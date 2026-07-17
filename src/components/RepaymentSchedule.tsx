import { useState } from "react";
import { Table2, ChevronDown, Flag } from "lucide-react";

// ============================================================
//  RepaymentSchedule — جدول السداد الشهري المتراكم للمستثمر
//  ربح المرابحة ثابت ويُوزَّع بالتساوي على المدة، فكل دفعة
//  = أصل + ربح بنسب ثابتة (لا استهلاك متناقص كالفائدة).
//  نُبرز شهر "استرداد رأس المال": من بعده كل ما يصل ربح صافٍ.
// ============================================================

interface Props {
  amount: number;   // مبلغ مساهمة المستثمر
  months: number;   // مدة التمويل
  retPct: number;   // العائد السنوي % (سايبور + هامش المخاطر)
}

export default function RepaymentSchedule({ amount, months, retPct }: Props) {
  const [open, setOpen] = useState(false);

  const totalProfit = amount * (retPct / 100) * (months / 12);
  const total = amount + totalProfit;
  const monthly = total / months;
  const monthlyProfit = totalProfit / months;

  // الشهر الذي يتجاوز فيه المتراكم رأس المال — نقطة التعادل
  const breakEven = Math.min(months, Math.ceil(amount / monthly));

  const rows = Array.from({ length: months }, (_, i) => {
    const m = i + 1;
    const cum = monthly * m;
    return {
      m,
      cum,
      profitCum: monthlyProfit * m,
      pct: (cum / total) * 100,
      recovered: cum >= amount,
    };
  });

  return (
    <div className="bg-muted rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-3 active:scale-[0.99] transition-transform"
      >
        <span className="text-[11px] font-black text-foreground flex items-center gap-1.5">
          <Table2 className="w-3.5 h-3.5 text-accent" /> جدول السداد الشهري المتراكم
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* ملخّص قبل الجدول */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">دفعتك الشهرية</p>
              <p className="text-[11px] font-black text-foreground tabular-nums">{monthly.toFixed(0)}</p>
            </div>
            <div className="bg-background rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">منها ربح</p>
              <p className="text-[11px] font-black text-green-600 dark:text-green-400 tabular-nums">+{monthlyProfit.toFixed(0)}</p>
            </div>
            <div className="bg-background rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">استرداد رأس المال</p>
              <p className="text-[11px] font-black text-accent tabular-nums">شهر {breakEven}</p>
            </div>
          </div>

          {/* الجدول — يمرَّر عمودياً */}
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-[10px] tabular-nums">
              <thead className="sticky top-0 bg-card">
                <tr className="text-muted-foreground">
                  <th className="text-right font-bold px-2 py-1.5">الشهر</th>
                  <th className="text-left font-bold px-2 py-1.5">المستلم</th>
                  <th className="text-left font-bold px-2 py-1.5">المتراكم</th>
                  <th className="text-left font-bold px-2 py-1.5">الربح</th>
                  <th className="text-left font-bold px-2 py-1.5">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr
                    key={r.m}
                    className={`border-t border-border ${
                      r.m === breakEven ? "bg-accent/10" : r.recovered ? "bg-green-500/5" : ""
                    }`}
                  >
                    <td className="text-right px-2 py-1 text-foreground font-medium">
                      {r.m === breakEven && <Flag className="w-2.5 h-2.5 text-accent inline ml-1" />}
                      {r.m}
                    </td>
                    <td className="text-left px-2 py-1 text-muted-foreground">{monthly.toFixed(0)}</td>
                    <td className="text-left px-2 py-1 text-foreground font-bold">{r.cum.toFixed(0)}</td>
                    <td className="text-left px-2 py-1 text-green-600 dark:text-green-400">+{r.profitCum.toFixed(0)}</td>
                    <td className="text-left px-2 py-1 text-muted-foreground">{r.pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[9px] text-muted-foreground leading-relaxed">
            <Flag className="w-2.5 h-2.5 text-accent inline ml-0.5" />
            من <span className="font-bold text-foreground">شهر {breakEven}</span> استرددتَ رأس مالك ({amount.toLocaleString()} ر.س)
            — وما بعده ربح صافٍ. الإجمالي عند الاكتمال{" "}
            <span className="font-bold text-foreground">{total.toFixed(0)} ر.س</span>
            {" "}(<span className="text-green-600 dark:text-green-400 font-bold">+{totalProfit.toFixed(0)}</span>).
          </p>
        </div>
      )}
    </div>
  );
}
