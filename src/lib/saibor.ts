// ============================================================
//  saibor — تسعير العائد على أساس سايبور (SAIBOR)
//  سايبور = سعر الفائدة المعروض بين البنوك السعودية، المؤشّر المرجعي
//  المعتمد لدى البنك المركزي السعودي (ساما) لتسعير التمويل.
//  المصدر: سايبور 3 أشهر ≈ 4.75% (مايو 2026)
//  https://tradingeconomics.com/saudi-arabia/interbank-rate
//
//  التسعير: العائد = سايبور + هامش مخاطر حسب تصنيف الفرصة.
//  هذا يعكس الممارسة البنكية الفعلية (Benchmark + Risk Spread)
//  بدل أرقام ثابتة اعتباطية.
// ============================================================

export type RiskLevel = "low" | "mid" | "high";

/** سايبور 3 أشهر (%) — المؤشّر المرجعي */
export const SAIBOR_3M = 4.75;
export const SAIBOR_AS_OF = "مايو 2026";

/** هامش المخاطر فوق سايبور (%) لكل تصنيف */
export const RISK_SPREAD: Record<RiskLevel, number> = {
  low: 1.5,
  mid: 3.0,
  high: 6.0,
};

/** العائد السنوي المتوقّع (%) = سايبور + هامش المخاطر */
export function returnRateFor(level: RiskLevel): number {
  return +(SAIBOR_3M + RISK_SPREAD[level]).toFixed(2);
}

/** نسبة ربح المرابحة السنوية على طالب التمويل (نفس أساس التسعير) */
export function marginRateFor(level: RiskLevel): number {
  return returnRateFor(level) / 100;
}

/** إجمالي ربح المرابحة على كامل المدة (يُوزَّع على المساهمين) */
export function totalProfit(amount: number, months: number, level: RiskLevel): number {
  return amount * marginRateFor(level) * (months / 12);
}

/** أول دفعة عائد للمساهم: بعد اكتمال الجمع بشهر، ثم شهرياً */
export const FIRST_PAYOUT_AFTER_DAYS = 30;

/** تاريخ استحقاق العائد الكامل (نهاية المدة) بصيغة عربية مختصرة */
export function maturityLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
}
