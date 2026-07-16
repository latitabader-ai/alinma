import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileContainer } from "@/components/MobileContainer";
import { Plus, FileSearch, Calculator, UserSquare, Home as HomeIcon, Car, Users, GraduationCap, ChevronRight, AlertTriangle, TrendingDown, CheckCircle2, Loader2, Clock, RefreshCw, Ban } from "lucide-react";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";

const MARGIN_RATE = 0.065;

interface Contributor { name: string; amount: number; status: "مؤكّدة" | "قيد المعالجة" }
interface FinRequest {
  id: string;
  item: string;
  amount: number;
  funded: number;
  months: number;
  eta: string;
  updated: string;
  status: "نشط" | "قيد المراجعة";
  contributors: Contributor[];
}

// طلبات التمويل — تبدأ بطلب قائم، وتُضاف إليها الطلبات الجديدة
const INITIAL_REQUESTS: FinRequest[] = [
  {
    id: "REQ-1", item: "تمويل سيارة", amount: 80000, funded: 52000, months: 36,
    eta: "5 أيام", updated: "قبل ساعتين", status: "نشط",
    contributors: [
      { name: "مساهم ع. ش.", amount: 15000, status: "مؤكّدة" },
      { name: "مساهم م. د.", amount: 12000, status: "مؤكّدة" },
      { name: "مساهم ن. ع.", amount: 10000, status: "مؤكّدة" },
      { name: "مساهم س. ي.", amount: 8000, status: "قيد المعالجة" },
      { name: "مساهم ف. ة.", amount: 7000, status: "قيد المعالجة" },
    ],
  },
];

// خيارات التمويل — نفس قائمة "اكتشف خيارات التمويل"
const FINANCE_OPTIONS = [
  { key: "personal",  title: "تمويل شخصي",              desc: "خيارات متعددة لتناسب احتياجاتك.",                        amount: 60000,  months: 36 },
  { key: "realestate", title: "التمويل العقاري",         desc: "نساعدك بتحقيق حلمك من خلال التمويل العقاري.",            amount: 500000, months: 60 },
  { key: "leasing",   title: "التمويل التأجيري للسيارات", desc: "احصل على سيارة أحلامك من خلال الإنماء بسهولة.",          amount: 85000,  months: 48 },
  { key: "education", title: "تمويل التعليم",            desc: "استثمر في مستقبلك وموّل رسومك الدراسية بأقساط ميسّرة.",  amount: 40000,  months: 24 },
  { key: "crowd",     title: "تمويل جماعي",              desc: "حقق أهدافك المالية بالتعاون مع الآخرين.",                amount: 0,      months: 0 },
] as const;

const OPTION_ICON: Record<string, JSX.Element> = {
  personal:   <UserSquare className="w-5 h-5" />,
  realestate: <HomeIcon className="w-5 h-5" />,
  leasing:    <Car className="w-5 h-5" />,
  education:  <GraduationCap className="w-5 h-5" />,
  crowd:      <Users className="w-5 h-5" />,
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

export default function FinanceAr() {
  const [showCalc, setShowCalc] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showNewFinance, setShowNewFinance] = useState(false);

  // طلبات التمويل — تُضاف إليها الطلبات الجديدة وتظهر في متابعة الطلبات
  const [requests, setRequests] = useState<FinRequest[]>(INITIAL_REQUESTS);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  function addRequest(opt: typeof FINANCE_OPTIONS[number]) {
    const req: FinRequest = {
      id: `REQ-${Date.now()}`,
      item: opt.title,
      amount: opt.amount,
      funded: 0,                       // طلب جديد — لم يُموَّل بعد
      months: opt.months,
      eta: "قيد التقييم",
      updated: "الآن",
      status: "قيد المراجعة",
      contributors: [],
    };
    setRequests(prev => [req, ...prev]);
    setShowNewFinance(false);
    setShowTracking(true);             // انقل المستخدم لمتابعة الطلبات مباشرة
    setJustAdded(req.id);
    setTimeout(() => setJustAdded(null), 2600);
  }

  // نسبة التمويل المتحرّكة لكل طلب (تبدأ 0 ثم تصل للقيمة الفعلية)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (showTracking) {
      const t = setTimeout(() => setProgress(100), 100);
      return () => clearTimeout(t);
    }
    setProgress(0);
  }, [showTracking]);

  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(36);
  const [salary, setSalary] = useState(12000);
  const [oblig, setOblig] = useState(2000);

  const installment = useMemo(() => calcInstallment(amount, months), [amount, months]);
  const dbr = useMemo(() => (oblig + installment) / salary, [oblig, installment, salary]);
  const dbrPct = Math.round(dbr * 100);
  const isOver = dbr > 0.45;

  // توصية ذكية ديناميكية:
  // 1) أقصى مبلغ مسموح على نفس المدة المختارة (يتغيّر مع تغيّر المدة)
  const suggestedAmount = useMemo(() => maxAllowedAmount(salary, oblig, months), [salary, oblig, months]);
  // 2) أقصر مدة تُبقي المبلغ الحالي ضمن حد 45% (بديل: تمديد المدة بدل تخفيض المبلغ)
  const suggestedMonths = useMemo(() => {
    const terms = [12, 24, 36, 48, 60];
    for (const m of terms) {
      if (m <= months) continue; // نبحث عن مدة أطول من الحالية
      if ((oblig + calcInstallment(amount, m)) / salary <= 0.45) return m;
    }
    return null;
  }, [amount, oblig, salary, months]);

  const inputClass = "w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm font-medium focus:outline-none focus:border-accent";

  return (
    <MobileContainer className="bg-background p-4 text-right text-foreground" hasGlow={false}>
      <div dir="rtl" className="flex-1 flex flex-col h-full w-full">
        <header className="flex items-center justify-start mt-4 mb-4">
          <Link href="/services">
            <button aria-label="رجوع" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </Link>
        </header>

        <h1 className="text-foreground font-bold text-3xl mb-6">تمويلاتي</h1>

        {/* Quick Actions */}
        <div className="flex justify-between gap-3 mb-8">
          <button onClick={() => setShowCalc(v => !v)} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${showCalc ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border"}`}>
              <Calculator className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">حاسبة التمويل</span>
          </button>
          <button onClick={() => requests.length && setShowTracking(v => !v)} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors relative ${showTracking ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border"} ${!requests.length ? "opacity-50" : ""}`}>
              <FileSearch className="w-6 h-6" />
              {requests.length > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{requests.length}</span>
              )}
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">
              {requests.length ? "متابعة الطلبات" : "لا طلبات نشطة"}
            </span>
          </button>
          <button onClick={() => setShowNewFinance(v => !v)} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${showNewFinance ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border"}`}>
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-center text-foreground">تمويل جديد</span>
          </button>
        </div>

        {/* ===== تمويل جديد — خيارات التمويل ===== */}
        <AnimatePresence>
        {showNewFinance && (
          <motion.div
            key="new-finance"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-card rounded-3xl p-5 mb-8 border border-border space-y-3 overflow-hidden"
          >
            <div>
              <h2 className="font-bold text-lg text-foreground">اكتشف خيارات التمويل</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">اختر نوع التمويل المناسب — يُضاف طلبك مباشرة لمتابعة الطلبات.</p>
            </div>
            {FINANCE_OPTIONS.map(opt => {
              const icon = OPTION_ICON[opt.key];
              // التمويل الجماعي له مساره الخاص (طلب + تقييم ذكاء اصطناعي)
              if (opt.key === "crowd") {
                return (
                  <Link key={opt.key} href="/crowd-finance">
                    <div className="bg-muted rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-border active:scale-[0.98] transition-transform">
                      <div className="flex-1 ml-3">
                        <h3 className="font-bold text-foreground text-sm">{opt.title}</h3>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                      </div>
                      <div className="w-11 h-11 bg-background rounded-xl flex items-center justify-center text-accent shrink-0">{icon}</div>
                    </div>
                  </Link>
                );
              }
              return (
                <button
                  key={opt.key}
                  onClick={() => addRequest(opt)}
                  className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between border border-border active:scale-[0.98] transition-transform text-right"
                >
                  <div className="flex-1 ml-3">
                    <h3 className="font-bold text-foreground text-sm">{opt.title}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                    <p className="text-[10px] text-accent font-bold mt-1">حتى {opt.amount.toLocaleString()} ر.س · {opt.months} شهراً</p>
                  </div>
                  <div className="w-11 h-11 bg-background rounded-xl flex items-center justify-center text-foreground shrink-0">{icon}</div>
                </button>
              );
            })}
          </motion.div>
        )}
        </AnimatePresence>

        {/* ===== متابعة الطلبات — قائمة الطلبات مع تتبّع كل طلب ===== */}
        <AnimatePresence>
        {showTracking && requests.length > 0 && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8 space-y-4 overflow-hidden">

            {requests.map(req => {
              const fundedPct = req.amount ? Math.round((req.funded / req.amount) * 100) : 0;
              const isNew = justAdded === req.id;
              return (
                <div key={req.id} className={`bg-card rounded-3xl p-5 border space-y-4 transition-colors ${isNew ? "border-accent" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base text-foreground">حالة طلب التمويل</h2>
                    {req.status === "نشط" ? (
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        نشط
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        قيد المراجعة
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {req.item}{req.months ? ` · على ${req.months} شهراً` : ""}
                    {isNew && <span className="text-accent font-bold"> · أُضيف الآن</span>}
                  </p>

                  {/* بطاقة الحالة — أربع خانات */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-2xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">المبلغ المطلوب</p>
                      <p className="text-base font-black text-foreground">{req.amount.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
                    </div>
                    <div className="bg-muted rounded-2xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">المتبقّي</p>
                      <p className="text-base font-black text-accent">{(req.amount - req.funded).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span></p>
                    </div>
                    <div className="bg-muted rounded-2xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> الوقت المتوقّع</p>
                      <p className="text-base font-black text-foreground">{req.eta}</p>
                    </div>
                    <div className="bg-muted rounded-2xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> آخر تحديث</p>
                      <p className="text-base font-black text-foreground">{req.updated}</p>
                    </div>
                  </div>

                  {/* شريط التقدّم المتحرّك */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-black ${fundedPct ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>{fundedPct}% مموّل</span>
                      <span className="text-xs text-muted-foreground">{req.funded.toLocaleString()} من {req.amount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(fundedPct * progress) / 100}%` }}
                      />
                    </div>
                  </div>

                  {/* قائمة المساهمين بأسماء مقنّعة */}
                  {req.contributors.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-accent" />
                        <h3 className="font-bold text-sm text-foreground">المساهمون ({req.contributors.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const maxAmount = Math.max(...req.contributors.map(c => c.amount));
                          return req.contributors.map((c, i) => {
                            const sharePct = Math.round((c.amount / req.amount) * 100);
                            const barPct = Math.round((c.amount / maxAmount) * 100);
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
                  ) : (
                    <div className="bg-muted rounded-2xl p-4 text-center">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        طلبك قيد التقييم الائتماني — يُطرح للمساهمين فور اعتماده.
                      </p>
                    </div>
                  )}

                  {/* إلغاء الطلب */}
                  <div className="border-t border-border pt-4">
                    {confirmCancelId !== req.id ? (
                      <button
                        onClick={() => setConfirmCancelId(req.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl py-2.5 active:scale-95 transition-transform"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        إلغاء طلب التمويل
                      </button>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 space-y-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {req.funded > 0
                            ? `سيُلغى طلبك وتُعاد مبالغ المساهمين المؤكّدة (${req.funded.toLocaleString()} ر.س) إلى حساباتهم خلال 3 أيام عمل.`
                            : "سيُلغى طلبك. لم يُموَّل بعد، فلا مبالغ تُعاد."} لا يمكن التراجع بعد الإلغاء.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            className="flex-1 bg-muted text-foreground font-bold text-xs py-2.5 rounded-lg active:scale-95 transition-transform"
                          >
                            تراجع
                          </button>
                          <button
                            onClick={() => {
                              setRequests(prev => prev.filter(r => r.id !== req.id));
                              setConfirmCancelId(null);
                            }}
                            className="flex-1 bg-red-500 text-white font-bold text-xs py-2.5 rounded-lg active:scale-95 transition-transform"
                          >
                            تأكيد الإلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                <label className="block text-xs text-muted-foreground font-bold mb-1.5">الراتب الشهري</label>
                <input type="number" value={salary} onChange={e => setSalary(Math.max(1, +e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-bold mb-1.5">الالتزامات</label>
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

            {/* ===== مؤشّر التدفّق النقدي التفاعلي (Cash-Flow Visualization) ===== */}
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-foreground">توزيع الدخل الشهري</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-green-500/15 text-green-600 dark:text-green-400"}`}>
                  {isOver ? "تجاوز حد 45%" : "ضمن الحد الآمن"}
                </span>
              </div>

              {(() => {
                const obligPct = Math.min((oblig / salary) * 100, 100);
                const instPct = Math.min((installment / salary) * 100, 100 - obligPct);
                const freePct = Math.max(100 - obligPct - instPct, 0);
                const disposable = Math.max(salary - oblig - installment, 0);
                return (
                  <>
                    {/* الشريط المجزّأ + علامة حد 45% */}
                    <div dir="ltr" className="relative h-5 bg-background rounded-lg overflow-hidden flex">
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${obligPct}%` }} />
                      <div className={`h-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-accent"}`} style={{ width: `${instPct}%` }} />
                      <div className="h-full bg-green-500/40 transition-all duration-500" style={{ width: `${freePct}%` }} />
                      {/* خط حد ساما 45% */}
                      <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-red-600" style={{ left: "45%" }}>
                        <span className="absolute -top-4 -translate-x-1/2 text-[8px] font-black text-red-600 whitespace-nowrap">حد 45%</span>
                      </div>
                    </div>

                    {/* مفتاح الألوان + القيم */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[9px] text-muted-foreground">الالتزامات</span>
                        </div>
                        <p className="text-xs font-black text-foreground">{oblig.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className={`w-2 h-2 rounded-full ${isOver ? "bg-red-500" : "bg-accent"}`} />
                          <span className="text-[9px] text-muted-foreground">القسط الجديد</span>
                        </div>
                        <p className="text-xs font-black text-foreground">{Math.round(installment).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-green-500/60" />
                          <span className="text-[9px] text-muted-foreground">المتبقّي المتاح</span>
                        </div>
                        <p className="text-xs font-black text-foreground">{disposable.toLocaleString()}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* بطاقة التوصية */}
            {isOver && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-500 mb-1">تجاوز حد عبء الدين</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    وفق حد عبء الدين 45% من ساما، طلبك يتجاوز الحد. لديك خياران لإعادته للنطاق الآمن:
                  </p>

                  {/* خيار 1: تخفيض المبلغ على نفس المدة المختارة */}
                  {suggestedAmount > 0 ? (
                    <button
                      onClick={() => setAmount(suggestedAmount)}
                      className="mt-3 w-full flex items-center justify-between gap-2 bg-accent/10 border border-accent/40 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-accent">
                        <TrendingDown className="w-3.5 h-3.5" />
                        خفّض المبلغ إلى {suggestedAmount.toLocaleString()} ر.س
                      </span>
                      <span className="text-[10px] text-muted-foreground">على {months} شهراً</span>
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">الالتزامات الحالية تستنفد الحد المسموح — يُنصح بتسوية بعض الالتزامات أولاً.</p>
                  )}

                  {/* خيار 2: تمديد المدة للإبقاء على نفس المبلغ */}
                  {suggestedMonths && (
                    <button
                      onClick={() => setMonths(suggestedMonths)}
                      className="mt-2 w-full flex items-center justify-between gap-2 bg-accent/10 border border-accent/40 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-accent">
                        <Clock className="w-3.5 h-3.5" />
                        مدّد المدة إلى {suggestedMonths} شهراً
                      </span>
                      <span className="text-[10px] text-muted-foreground">بنفس المبلغ</span>
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
