import { useState } from "react";
import { CheckCircle2, Loader2, Building2, FileText, Wallet, ShieldCheck, Lock, Landmark, Gauge, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccount } from "@/lib/AccountProvider";

// ============================================================
//  OpenBankingConnect — تجربة المصرفية المفتوحة الكاملة (قابلة لإعادة الاستخدام)
//  الموافقة (اختيار البنوك + إذن القراءة) → خطوات ربط حيّة →
//  بطاقات البيانات المسحوبة. تستدعي onFilled عند اكتمال الربط.
// ============================================================

type ObStatus = "idle" | "consent" | "loading" | "done";

const OB_STEPS = [
  "تأمين اتصال مشفّر مع البنوك المختارة",
  "التحقق من الهوية ومنح الإذن",
  "جلب الراتب وكشف الحساب",
  "تحليل الالتزامات القائمة",
  "جلب التصنيف الائتماني (سمة)",
];

const OB_BANKS = [
  { id: "alinma", short: "الإنماء", color: "bg-accent" },
  { id: "rajhi",  short: "الراجحي", color: "bg-blue-600" },
  { id: "snb",    short: "الأهلي",  color: "bg-emerald-600" },
  { id: "riyad",  short: "الرياض",  color: "bg-indigo-600" },
];

interface Props {
  onFilled: (data: { salary: number; oblig: number; credit: number }) => void;
}

export default function OpenBankingConnect({ onFilled }: Props) {
  const { balance, salary: obSalary, oblig: obOblig, creditScore, accountMask } = useAccount();

  const [obStatus, setObStatus] = useState<ObStatus>("idle");
  const [obStep, setObStep] = useState(0);
  const [verified, setVerified] = useState({ salary: false, statement: false, oblig: false, credit: false });
  const [selectedBanks, setSelectedBanks] = useState<string[]>(["alinma"]);
  const [readConsent, setReadConsent] = useState(false);

  function toggleBank(id: string) {
    setSelectedBanks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  }

  // أسماء البنوك المختارة فعلياً (لعرضها في حالة الاتصال)
  const chosen = OB_BANKS.filter(b => selectedBanks.includes(b.id));
  const connectedLabel =
    chosen.length === 0 ? "متصل"
    : chosen.length === 1 ? `متصل بمصرف ${chosen[0].short} ${chosen[0].id === "alinma" ? accountMask : ""}`.trim()
    : `متصل بـ ${chosen.length} بنوك (${chosen.map(b => b.short).join("، ")})`;

  function handleClick() {
    if (obStatus === "loading") return;
    if (obStatus === "done") { setObStatus("idle"); setVerified({ salary: false, statement: false, oblig: false, credit: false }); return; }
    setObStatus("consent");
  }

  function startConnect() {
    setObStatus("loading");
    setObStep(0);
    const stepMs = 700;
    OB_STEPS.forEach((_, i) => {
      setTimeout(() => setObStep(i + 1), stepMs * (i + 1));
      if (i === 2) setTimeout(() => setVerified(v => ({ ...v, salary: true, statement: true })), stepMs * (i + 1));
      if (i === 3) setTimeout(() => setVerified(v => ({ ...v, oblig: true })), stepMs * (i + 1));
      if (i === 4) setTimeout(() => setVerified(v => ({ ...v, credit: true })), stepMs * (i + 1));
    });
    setTimeout(() => {
      setObStatus("done");
      onFilled({ salary: obSalary, oblig: obOblig, credit: creditScore });
    }, stepMs * (OB_STEPS.length + 1));
  }

  return (
    <>
      {/* بطاقة CTA بارزة */}
      <button
        onClick={handleClick}
        disabled={obStatus === "loading"}
        className={`w-full rounded-3xl p-5 flex items-center gap-4 text-right transition-all shadow-lg ${
          obStatus === "done"
            ? "bg-green-500/10 border-2 border-green-500/50"
            : "bg-gradient-to-br from-accent to-orange-500 border-2 border-accent active:scale-[0.98] shadow-accent/30"
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${obStatus === "done" ? "bg-green-500/20" : "bg-white/20"}`}>
          {obStatus === "loading" ? <Loader2 className="w-7 h-7 animate-spin text-white" />
            : obStatus === "done" ? <ShieldCheck className="w-7 h-7 text-green-500" />
            : <Landmark className="w-7 h-7 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-black ${obStatus === "done" ? "text-green-600 dark:text-green-400" : "text-white"}`}>
            {obStatus === "done" ? connectedLabel : "ربط سريع عبر المصرفية المفتوحة"}
          </p>
          <p className={`text-[11px] mt-1 leading-relaxed ${obStatus === "done" ? "text-muted-foreground" : "text-white/90"}`}>
            {obStatus === "loading" ? "جارٍ جلب بياناتك المالية بأمان..." :
             obStatus === "done" ? "تم ملء الحقول تلقائياً · يمكنك التعديل يدوياً" :
             "جلب الراتب والالتزامات والتصنيف الائتماني تلقائياً · بدون إدخال يدوي"}
          </p>
        </div>
        {obStatus === "idle" && (
          <span className="flex items-center gap-1 text-xs font-black text-accent bg-white px-3 py-2 rounded-xl shrink-0 shadow">
            اربط الآن<ChevronLeft className="w-4 h-4" />
          </span>
        )}
      </button>

      {/* شارة أمان (idle) */}
      {obStatus === "idle" && (
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> اتصال مشفّر</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> إطار المصرفية المفتوحة (ساما)</span>
        </div>
      )}

      {/* خطوات الربط الحيّة */}
      {obStatus === "loading" && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-accent" /> جلسة مؤمّنة</span>
            <span className="text-[10px] text-muted-foreground">{obStep}/{OB_STEPS.length}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(obStep / OB_STEPS.length) * 100}%` }} />
          </div>
          <div className="space-y-2 pt-1">
            {OB_STEPS.map((label, i) => {
              const done = obStep > i, active = obStep === i;
              return (
                <div key={i} className={`flex items-center gap-2.5 text-xs ${done || active ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : active ? <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                  <span className={done || active ? "font-medium" : ""}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* البيانات المسحوبة — 4 بطاقات */}
      {obStatus === "done" && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Wallet className="w-4 h-4" />, label: "الراتب الشهري", value: `${obSalary.toLocaleString()} ر.س` },
            { icon: <FileText className="w-4 h-4" />, label: "الرصيد الجاري", value: `${balance.toLocaleString()} ر.س` },
            { icon: <Building2 className="w-4 h-4" />, label: "الالتزامات", value: `${obOblig.toLocaleString()} ر.س` },
            { icon: <Gauge className="w-4 h-4" />, label: "التصنيف الائتماني (سمة)", value: `${creditScore}` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="rounded-xl p-3 border bg-green-500/10 border-green-500/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">{icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">{label} <CheckCircle2 className="w-2.5 h-2.5 text-green-500" /></p>
                <p className="text-sm font-black text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة الموافقة (Consent) */}
      <Dialog open={obStatus === "consent"} onOpenChange={(o) => { if (!o && obStatus === "consent") setObStatus("idle"); }}>
        <DialogContent className="max-w-[350px] rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-foreground">
              <span className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center"><Landmark className="w-5 h-5" /></span>
              الربط عبر المصرفية المفتوحة
            </DialogTitle>
          </DialogHeader>
          <div className="text-right space-y-4 max-h-[65vh] overflow-y-auto pl-1">
            <div>
              <p className="text-xs font-bold text-foreground mb-2">اختر البنوك التي تريد ربطها</p>
              <div className="grid grid-cols-2 gap-2">
                {OB_BANKS.map(bank => {
                  const on = selectedBanks.includes(bank.id);
                  return (
                    <button key={bank.id} onClick={() => toggleBank(bank.id)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 border-2 text-right transition-all ${on ? "border-accent bg-accent/10" : "border-border bg-muted"}`}>
                      <span className={`w-8 h-8 rounded-lg ${bank.color} text-white flex items-center justify-center text-xs font-black shrink-0`}>{bank.short.charAt(0)}</span>
                      <span className="text-[11px] font-bold text-foreground leading-tight flex-1">{bank.short}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${on ? "bg-accent" : "border-2 border-muted-foreground/30"}`}>
                        {on && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground mb-2">البيانات التي سيتم قراءتها (قراءة فقط)</p>
              <div className="space-y-2">
                {[
                  { icon: <Wallet className="w-4 h-4" />, label: "الراتب الشهري" },
                  { icon: <FileText className="w-4 h-4" />, label: "الرصيد وكشف الحساب" },
                  { icon: <Building2 className="w-4 h-4" />, label: "الالتزامات القائمة" },
                  { icon: <Gauge className="w-4 h-4" />, label: "التصنيف الائتماني (سمة)" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3 bg-muted rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">{icon}</span>
                    <span className="text-sm font-medium text-foreground flex-1">{label}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setReadConsent(v => !v)}
              className={`w-full flex items-center gap-3 rounded-xl p-3 border-2 transition-all text-right ${readConsent ? "border-green-500/50 bg-green-500/10" : "border-border bg-muted"}`}>
              <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${readConsent ? "bg-green-500" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${readConsent ? "left-0.5" : "left-[18px]"}`} />
              </span>
              <span className="text-[11px] text-foreground leading-relaxed flex-1">
                أوافق على منح <span className="font-bold">صلاحية قراءة</span> بياناتي المالية (قراءة فقط) لتقييم الأهلية
              </span>
            </button>

            <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <Lock className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                اتصال مشفّر عبر إطار المصرفية المفتوحة المرخّص من البنك المركزي السعودي (ساما). يمكنك سحب الإذن في أي وقت، ولا تُخزَّن بيانات الدخول.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setObStatus("idle")} className="flex-1 bg-muted text-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform">إلغاء</button>
              <button onClick={startConnect} disabled={selectedBanks.length === 0 || !readConsent}
                className="flex-[2] bg-accent text-accent-foreground font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100">
                <ShieldCheck className="w-4 h-4" />
                {selectedBanks.length > 1 ? `أوافق واربط (${selectedBanks.length} بنوك)` : "أوافق واربط الآن"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
