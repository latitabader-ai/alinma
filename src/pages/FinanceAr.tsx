import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileContainer } from "@/components/MobileContainer";
import { Plus, FileSearch, Calculator, UserSquare, Home as HomeIcon, Car, Users, GraduationCap, ChevronRight, ChevronLeft, AlertTriangle, TrendingDown, Zap, CheckCircle2, Loader2, Building2, FileText, Wallet, Clock, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/lib/AccountProvider";

const MARGIN_RATE = 0.065;

// الطلب النشط لطالب التمويل (تتبّع الطلب — الميزة 2)
const ACTIVE_REQUEST = {
  item: "تمويل سيارة",
  amount: 80000,
  funded: 52000,
  months: 36,
  eta: "5 أيام",
  updated: "قبل ساعتين",
  contributors: [
    { name: "مساهم ع. ش.", amount: 15000, status: "مؤكّدة" as const },
    { name: "مساهم م. د.", amount: 12000, status: "مؤكّدة" as const },
    { name: "مساهم ن. ع.", amount: 10000, status: "مؤكّدة" as const },
    { name: "مساهم س. ي.", amount: 8000, status: "قيد المعالجة" as const },
    { name: "مساهم ف. ة.", amount: 7000, status: "قيد المعالجة" as const },
  ],
};

function calcInstallment(amount: number, months: number) {
  const total = amount * (1 + MARGIN_RATE * (months / 12));
  return total / months;
}

function maxAllowedAmount(salary: number, oblig: number, months = 36) {
  const maxInstallment = 0.45 * salary - oblig;
  if (maxInstallment <= 0) return 0;
  const factor = (1 + MARGIN_RATE * (months / 12)) / months;
  return Math.floor(maxInstallment / factor / 1000) * 1000;
}

type ObStatus = "idle" | "loading" | "done";

export default function FinanceAr() {
  // البيانات المتّسقة تُسحب من حالة الحساب المشتركة (لا قيماً عشوائية)
  const { balance, salary: obSalary, oblig: obOblig, statement: obStatement } = useAccount();
  const OB_DATA = { salary: obSalary, oblig: obOblig, statement: obStatement };

  const [showCalc, setShowCalc] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [obStatus, setObStatus] = useState<ObStatus>("idle");
  const [verified, setVerified] = useState({ salary: false, statement: false, oblig: false });

  // نسبة التمويل المتحرّكة (تبدأ 0 ثم تتحرّك للقيمة الفعلية)
  const fundedPct = Math.round((ACTIVE_REQUEST.funded / ACTIVE_REQUEST.amount) * 100);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (showTracking) {
      const t = setTimeout(() => setProgress(fundedPct), 100);
      return () => clearTimeout(t);
    }
    setProgress(0);
  }, [showTracking, fundedPct]);

  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(36);
  const [salary, setSalary] = useState(12000);
  const [oblig, setOblig] = useState(2000);

  const installment = useMemo(() => calcInstallment(amount, months), [amount, months]);
  const dbr = useMemo(() => (oblig + installment) / salary, [oblig, installment, salary]);
  const dbrPct = Math.round(dbr * 100);
  const isOver = dbr > 0.45;
  const suggestedAmount = useMemo(() => maxAllowedAmount(salary, oblig, 36), [salary, oblig]);

  function handleOpenBanking() {
    if (obStatus !== "idle") return;
    setObStatus("loading");

    // الخطوة 1: بعد 1.5 ثانية تظهر الراتب
    setTimeout(() => {
      setSalary(OB_DATA.salary);
      setVerified(v => ({ ...v, salary: true }));
    }, 1500);

    // الخطوة 2: بعد 2.5 ثانية يظهر كشف الحساب
    setTimeout(() => {
      setVerified(v => ({ ...v, statement: true }));
    }, 2500);

    // الخطوة 3: بعد 3.5 ثانية تظهر الالتزامات
    setTimeout(() => {
      setOblig(OB_DATA.oblig);
      setVerified(v => ({ ...v, oblig: true }));
      setObStatus("done");
      setShowCalc(true); // افتح الحاسبة تلقائياً
    }, 3500);
  }

  const inputClass = "w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm font-medium focus:outline-none focus:border-accent";

  return (
    <MobileContainer className="bg-background p-4 text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        <header className="flex items-center justify-start mt-4 mb-4">
          <ChevronRight className="w-6 h-6 text-foreground cursor-pointer" />
        </header>

        <h1 className="text-foreground font-bold text-3xl mb-6">تمويلاتي</h1>

        {/* ===== بطاقة المصرفية المفتوحة — CTA أساسي بارز بملء العرض ===== */}
        <button
          onClick={handleOpenBanking}
          disabled={obStatus === "loading"}
          className={`w-full mb-6 rounded-3xl p-5 flex items-center gap-4 text-right transition-all shadow-lg ${
            obStatus === "done"
              ? "bg-green-500/10 border-2 border-green-500/50"
              : "bg-gradient-to-br from-accent to-orange-500 border-2 border-accent active:scale-[0.98] shadow-accent/30"
          }`}
        >
          {/* أيقونة داخل دائرة */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            obStatus === "done" ? "bg-green-500/20" : "bg-white/20"
          }`}>
            {obStatus === "loading" ? (
              <Loader2 className={`w-7 h-7 animate-spin ${obStatus === "loading" ? "text-white" : ""}`} />
            ) : obStatus === "done" ? (
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            ) : (
              <Zap className="w-7 h-7 text-white fill-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-base font-black ${obStatus === "done" ? "text-green-600 dark:text-green-400" : "text-white"}`}>
              {obStatus === "done" ? "تم الربط بنجاح ✓" : "ربط سريع عبر المصرفية المفتوحة"}
            </p>
            <p className={`text-[11px] mt-1 leading-relaxed ${obStatus === "done" ? "text-muted-foreground" : "text-white/90"}`}>
              {obStatus === "loading" ? "جارٍ جلب بياناتك المالية..." :
               obStatus === "done" ? "بياناتك محدّثة تلقائياً" :
               "جلب الراتب والرصيد والالتزامات تلقائياً · بدون إدخال يدوي"}
            </p>
          </div>
          {obStatus === "idle" && (
            <span className="flex items-center gap-1 text-xs font-black text-accent bg-white px-3 py-2 rounded-xl shrink-0 shadow">
              اربط الآن
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}
        </button>

        {/* بطاقات التحقق — Skeleton أثناء التحميل ثم بيانات محقّقة */}
        {obStatus !== "idle" && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { key: "salary" as const, icon: <Wallet className="w-4 h-4" />, label: "الراتب", value: `${OB_DATA.salary.toLocaleString()} ر.س` },
              { key: "statement" as const, icon: <FileText className="w-4 h-4" />, label: "الرصيد", value: `${balance.toLocaleString()} ر.س` },
              { key: "oblig" as const, icon: <Building2 className="w-4 h-4" />, label: "الالتزامات", value: `${OB_DATA.oblig.toLocaleString()} ر.س` },
            ].map(({ key, icon, label, value }) => (
              <div
                key={key}
                className={`rounded-xl p-3 border text-center transition-all duration-500 ${
                  verified[key]
                    ? "bg-green-500/10 border-green-500/40"
                    : "bg-muted border-border"
                }`}
              >
                {!verified[key] ? (
                  // Skeleton loader أثناء انتظار التحقق
                  <div className="flex flex-col items-center gap-1.5">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="w-10 h-2 rounded" />
                    <Skeleton className="w-12 h-2.5 rounded" />
                  </div>
                ) : (
                <>
                <div className="flex justify-center mb-1">
                  {verified[key]
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <div className="text-muted-foreground">{icon}</div>
                  }
                </div>
                <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
                <p className="text-[10px] font-black mt-0.5 text-foreground">{value}</p>
                </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-between gap-3 mb-8">
          <button onClick={() => setShowCalc(v => !v)} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${showCalc ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border"}`}>
              <Calculator className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">حاسبة التمويل</span>
          </button>
          <button onClick={() => setShowTracking(v => !v)} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors relative ${showTracking ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border"}`}>
              <FileSearch className="w-6 h-6" />
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">1</span>
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">متابعة الطلبات</span>
          </button>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-foreground border border-border">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">تمويل جديد</span>
          </div>
        </div>

        {/* ===== حالة طلب التمويل الحالي (تتبّع الطلب) — حركة framer-motion ===== */}
        <AnimatePresence>
        {showTracking && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-card rounded-3xl p-5 mb-8 border border-border space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">حالة طلب التمويل الحالي</h2>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                نشط
              </span>
            </div>

            <p className="text-sm text-muted-foreground">{ACTIVE_REQUEST.item} · على {ACTIVE_REQUEST.months} شهراً</p>

            {/* بطاقة الحالة — أربع خانات */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-2xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1">المبلغ المطلوب</p>
                <p className="text-base font-black text-foreground">{ACTIVE_REQUEST.amount.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
              </div>
              <div className="bg-muted rounded-2xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1">المتبقّي</p>
                <p className="text-base font-black text-accent">{(ACTIVE_REQUEST.amount - ACTIVE_REQUEST.funded).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
              </div>
              <div className="bg-muted rounded-2xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> الوقت المتوقّع</p>
                <p className="text-base font-black text-foreground">{ACTIVE_REQUEST.eta}</p>
              </div>
              <div className="bg-muted rounded-2xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> آخر تحديث</p>
                <p className="text-base font-black text-foreground">{ACTIVE_REQUEST.updated}</p>
              </div>
            </div>

            {/* شريط التقدّم المتحرّك */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black text-green-600 dark:text-green-400">{fundedPct}% مموّل</span>
                <span className="text-xs text-muted-foreground">{ACTIVE_REQUEST.funded.toLocaleString()} من {ACTIVE_REQUEST.amount.toLocaleString()} ر.س</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* قائمة المساهمين بأسماء مقنّعة */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-sm text-foreground">المساهمون ({ACTIVE_REQUEST.contributors.length})</h3>
              </div>
              <div className="space-y-2">
                {(() => {
                  const maxAmount = Math.max(...ACTIVE_REQUEST.contributors.map(c => c.amount));
                  return ACTIVE_REQUEST.contributors.map((c, i) => {
                    const sharePct = Math.round((c.amount / ACTIVE_REQUEST.amount) * 100);
                    const barPct = Math.round((c.amount / maxAmount) * 100); // الوزن النسبي (الأكبر = ممتلئ)
                    return (
                      <div key={i} className="bg-muted rounded-xl px-3 py-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-black">
                              {c.name.replace("مساهم ", "").charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{c.name}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                c.status === "مؤكّدة"
                                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              }`}>
                                {c.status === "مؤكّدة" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Loader2 className="w-2.5 h-2.5" />}
                                {c.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-foreground">{c.amount.toLocaleString()} ر.س</p>
                            <p className="text-[9px] text-muted-foreground">{sharePct}% من الطلب</p>
                          </div>
                        </div>
                        {/* شريط الوزن النسبي للمساهم */}
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-accent rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-3 leading-relaxed">
                🔒 أسماء المساهمين مقنّعة حفاظاً على الخصوصية · يُدار عبر مصرف الإنماء
              </p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ===== حاسبة التمويل الذكية ===== */}
        {showCalc && (
          <div className="bg-card rounded-3xl p-5 mb-8 border border-border space-y-5">
            <h2 className="font-bold text-lg text-foreground">حاسبة التمويل الذكية</h2>

            {/* مبلغ التمويل */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-muted-foreground font-bold">مبلغ التمويل</span>
                <span className="text-base font-black text-accent">{amount.toLocaleString()} ر.س</span>
              </div>
              <Slider min={10000} max={500000} step={5000} value={[amount]} onValueChange={([v]) => setAmount(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>500,000</span><span>10,000</span>
              </div>
            </div>

            {/* مدة السداد */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-muted-foreground font-bold">مدة السداد</span>
                <span className="text-base font-black text-accent">{months} شهراً</span>
              </div>
              <Slider min={12} max={60} step={12} value={[months]} onValueChange={([v]) => setMonths(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>60 شهراً</span><span>12 شهراً</span>
              </div>
            </div>

            {/* الراتب والالتزامات */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs text-muted-foreground font-bold">الراتب الشهري</label>
                  {verified.salary && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <input type="number" value={salary} onChange={e => setSalary(Math.max(1, +e.target.value))} className={inputClass} />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs text-muted-foreground font-bold">الالتزامات</label>
                  {verified.oblig && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <input type="number" value={oblig} onChange={e => setOblig(Math.max(0, +e.target.value))} className={inputClass} />
              </div>
            </div>

            {/* نتائج لحظية */}
            <div className="bg-muted rounded-2xl p-4 flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">القسط الشهري</p>
                <p className="text-lg font-black text-foreground">{Math.round(installment).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">ر.س</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">نسبة عبء الدين</p>
                <p className={`text-lg font-black ${isOver ? "text-red-500" : dbrPct > 33 ? "text-amber-500" : "text-green-500"}`}>{dbrPct}%</p>
                <p className="text-[10px] text-muted-foreground">الحد 45%</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">إجمالي التمويل</p>
                <p className="text-lg font-black text-foreground">{Math.round(amount * (1 + MARGIN_RATE * (months / 12)) / 1000)}k</p>
                <p className="text-[10px] text-muted-foreground">ر.س</p>
              </div>
            </div>

            {/* شريط DBR */}
            <div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : dbrPct > 33 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(dbrPct / 45 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-red-500 font-bold">حد ساما 45%</span>
              </div>
            </div>

            {/* بطاقة التوصية */}
            {isOver && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-500 mb-1">تجاوز حد عبء الدين</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    وفق حد عبء الدين 45% من ساما، طلبك يتجاوز الحد.{" "}
                    {suggestedAmount > 0 ? (
                      <>ننصح بتعديل المبلغ إلى <span className="font-black text-foreground">{suggestedAmount.toLocaleString()} ر.س</span> على <span className="font-black text-foreground">36 شهراً</span>.</>
                    ) : (
                      "الالتزامات الحالية تستنفد الحد المسموح — يُنصح بتسوية بعض الالتزامات أولاً."
                    )}
                  </p>
                  {suggestedAmount > 0 && (
                    <button onClick={() => { setAmount(suggestedAmount); setMonths(36); }} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-accent">
                      <TrendingDown className="w-3.5 h-3.5" />
                      تطبيق المبلغ المقترح
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Banner */}
        <div className="mb-8">
          <div className="h-32 bg-card rounded-2xl flex items-end justify-center overflow-hidden relative border border-border">
            <div className="absolute inset-0 flex items-end justify-center opacity-30">
               <svg viewBox="0 0 200 100" className="w-full h-full text-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M20 100 V40 H40 V100 M40 60 H70 V100 M70 20 H100 V100 M100 50 H130 V100 M130 30 H160 V100 M160 70 H180 V100" />
                 <circle cx="85" cy="40" r="3" fill="currentColor" />
                 <circle cx="115" cy="60" r="3" fill="currentColor" />
               </svg>
            </div>
            <div className="absolute bottom-4 left-6 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-xl text-foreground mb-2">اكتشف خيارات التمويل</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">هناك العديد من المنتجات المالية التي يمكنك استكشافها والاختيار من بينها.</p>
        </div>

        <div className="space-y-4">
          {[
            { icon: <UserSquare className="w-6 h-6" />, title: "تمويل شخصي", desc: "خيارات متعددة لتناسب احتياجاتك." },
            { icon: <HomeIcon className="w-6 h-6" />, title: "التمويل العقاري", desc: "نساعدك بتحقيق حلمك من خلال التمويل العقاري." },
            { icon: <Car className="w-6 h-6" />, title: "التمويل التأجيري للسيارات", desc: "احصل على سيارة أحلامك من خلال الإنماء بسهولة." },
            { icon: <GraduationCap className="w-6 h-6" />, title: "تمويل التعليم", desc: "استثمر في مستقبلك وموّل رسومك الدراسية بأقساط ميسّرة ومتوافقة مع الشريعة." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-card rounded-2xl p-5 flex items-center justify-between border border-border">
              <div className="flex-1 mr-4">
                <h3 className="font-bold text-foreground mb-1 text-base">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground">{icon}</div>
            </div>
          ))}

          <Link href="/crowd-finance">
            <div className="bg-card rounded-2xl p-5 flex items-center justify-between cursor-pointer border border-border">
              <div className="flex-1 mr-4">
                <h3 className="font-bold text-foreground mb-1 text-base">تمويل جماعي</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">حقق أهدافك المالية بالتعاون مع الآخرين.</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground"><Users className="w-6 h-6" /></div>
            </div>
          </Link>
        </div>

        {/* نص الثقة والامتثال */}
        <p className="text-center text-[10px] text-muted-foreground leading-relaxed mt-8 mb-4 px-2">
          🔒 تُدار أموالك بأمان عبر مصرف الإنماء بالتوافق مع أنظمة البنك المركزي السعودي (ساما) ومبادئ التمويل الإسلامي.
        </p>
      </div>
    </MobileContainer>
  );
}
