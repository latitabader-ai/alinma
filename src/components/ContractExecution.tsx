import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck, Package, FileSignature, Coins, Banknote, ScrollText, Landmark } from "lucide-react";
import { tawarruq, type Contract } from "@/lib/tawarruqApi";

// ============================================================
//  ContractExecution — طبقة تكوين العقد بعد قرار الذكاء الاصطناعي
//  سلعة محدّدة → مرابحة | نقد عام → تورق منظم (شراء → قبض →
//  بيع مؤجّل → تسييل لطرف ثالث → صرف). الترتيب هو جوهر الحكم.
// ============================================================

interface Props {
  purpose: string;
  amount: number;
  tenor: number;
  ai: { level: string; dbr: number; confidence: number };
}

interface Leg { key: string; label: string; icon: JSX.Element; gates: string[] }

const LEGS: Leg[] = [
  { key: "quote",     label: "تثبيت الربح والإفصاح",          icon: <ScrollText className="w-3.5 h-3.5" />,     gates: ["SC-7"] },
  { key: "syndicate", label: "جمع رأس المال بعقد وكالة",       icon: <Coins className="w-3.5 h-3.5" />,          gates: ["SC-11"] },
  { key: "acquire",   label: "شراء السلعة وإثبات القبض",       icon: <Package className="w-3.5 h-3.5" />,        gates: ["SC-2", "SC-3", "SC-9"] },
  { key: "sign",      label: "بيع مؤجّل للعميل (مرابحة)",      icon: <FileSignature className="w-3.5 h-3.5" />,  gates: ["SC-3", "SC-6"] },
  { key: "liquidate", label: "تسييل لطرف ثالث مستقل",          icon: <Landmark className="w-3.5 h-3.5" />,       gates: ["SC-4", "SC-5"] },
  { key: "disburse",  label: "صرف حصيلة البيع",                icon: <Banknote className="w-3.5 h-3.5" />,       gates: ["SC-11"] },
];

export default function ContractExecution({ purpose, amount, tenor, ai }: Props) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);          // عدد السيقان المكتملة
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function execute() {
    setRunning(true); setError(null); setStep(0); setContract(null);
    try {
      const c0 = await tawarruq.route({ request_id: `REQ-${Date.now()}`, purpose, amount, tenor, ai });
      setContract(c0);
      const id = c0.contract_id;

      // المرابحة لا تحتاج ساق سلعة — نتوقف عند العرض والتمويل
      const isTawarruq = c0.contract_type === "tawarruq";

      const c1 = await tawarruq.quote(id);            setContract(c1); setStep(1);
      const c2 = await tawarruq.syndicate(id, [{ id: "INV-1", amount: c1.quote!.cost_price }]);
      setContract(c2); setStep(2);

      if (!isTawarruq) { setRunning(false); return; }

      const c3 = await tawarruq.acquire(id);          setContract(c3); setStep(3);
      const c4 = await tawarruq.sign(id);             setContract(c4); setStep(4);
      const c5 = await tawarruq.liquidate(id);        setContract(c5); setStep(5);
      const c6 = await tawarruq.disburse(id);         setContract(c6); setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تنفيذ العقد");
    } finally {
      setRunning(false);
    }
  }

  const isTawarruq = contract?.contract_type === "tawarruq";
  const legs = isTawarruq ? LEGS : LEGS.slice(0, 2);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-accent" /> تكوين العقد الشرعي
        </h3>
        {contract && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isTawarruq ? "bg-accent/15 text-accent" : "bg-green-500/15 text-green-600 dark:text-green-400"
          }`}>
            {isTawarruq ? "تورق منظم" : "مرابحة"}
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        بعد موافقة محرّك الذكاء الاصطناعي، يُكوَّن العقد قبل صرف أي مبلغ:
        سلعة محدّدة ← مرابحة · نقد عام ← تورق منظم.
      </p>

      {!contract && !running && (
        <button
          onClick={execute}
          className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform"
        >
          كوّن العقد ونفّذه
        </button>
      )}

      {(running || contract) && (
        <div className="space-y-2 pt-1">
          {legs.map((leg, i) => {
            const done = step > i;
            const active = running && step === i;
            return (
              <div key={leg.key} className={`flex items-start gap-2.5 text-xs transition-all ${done || active ? "text-foreground" : "text-muted-foreground/50"}`}>
                {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  : active ? <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0 mt-0.5" />
                  : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <span className={`flex items-center gap-1.5 ${done || active ? "font-medium" : ""}`}>
                    {leg.icon} {leg.label}
                  </span>
                  {done && (
                    <span className="flex flex-wrap gap-1 mt-1">
                      {leg.gates.map(g => (
                        <span key={g} className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-1 py-0.5 rounded">
                          {g} ✓
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {contract?.quote && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-muted rounded-xl p-3 space-y-1.5"
          >
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">ثمن التكلفة</span>
              <span className="font-black text-foreground">{contract.quote.cost_price.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">ربح المرابحة (ثابت ومفصح)</span>
              <span className="font-black text-green-600 dark:text-green-400">+{contract.quote.profit_amount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-[11px] border-t border-border pt-1.5">
              <span className="text-muted-foreground">إجمالي الثمن المؤجّل</span>
              <span className="font-black text-foreground">{contract.quote.total_price.toLocaleString()} ر.س</span>
            </div>
            <p className="text-[9px] text-muted-foreground pt-1">
              سايبور {contract.quote.benchmark.value}% مؤشّر تسعير داخلي فقط · الربح ثابت لا يُعاد تسعيره
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {contract?.lot && (
        <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" /> الحصة المشتراة
          </span>
          <span className="text-[11px] font-black text-foreground">
            {contract.lot.lot_id} · {contract.lot.quantity} {contract.lot.unit} {contract.lot.commodity_ar}
          </span>
        </div>
      )}

      {contract?.disbursement && (
        <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-3 space-y-1">
          <p className="text-xs font-black text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> صُرف النقد للعميل
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {contract.disbursement.amount.toLocaleString()} ر.س · مرجع {contract.disbursement.payment_ref}
            {contract.liquidation && <> · انزلاق التسييل {contract.liquidation.slippage} ر.س</>}
          </p>
          <p className="text-[9px] text-muted-foreground">
            هذه حصيلة بيع قام به العميل — ليست سحب قرض. عائد المساهمين من ربح المرابحة المفصح فقط.
          </p>
        </div>
      )}

      {contract && !isTawarruq && step >= 2 && (
        <p className="text-[10px] text-muted-foreground leading-relaxed bg-muted rounded-xl p-3">
          سلعة محدّدة — تُشترى وتُباع للعميل مباشرة بالمرابحة. لا حاجة لساق سلعة وسيطة.
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2.5">
          {error}
        </p>
      )}
    </div>
  );
}
