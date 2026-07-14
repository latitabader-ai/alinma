// ============================================================
//  riskApi — الاتصال بـ API تقييم المخاطر الحقيقي (FastAPI)
//  يخدم نموذج Random Forest. عند تعذّر الاتصال تعود الواجهة
//  للمنطق المحلي (fallback) حتى يعمل العرض دائماً.
// ============================================================

export interface ApiAssess {
  level: "low" | "mid" | "high";
  levelText: string;
  confidence: number;      // ثقة التنبؤ %
  installment: number;
  dbr: number;
  modelAccuracy: number;        // الدقة الإجمالية %
  highRiskPrecision?: number;   // دقة التنبؤ بالحالات المرتفعة الخطورة %
  highRiskRecall?: number;      // نسبة اكتشاف الحالات المرتفعة %
  importances: { name: string; value: number }[];
}

export interface AssessPayload {
  item: string;
  amount: number;
  term: number;
  salary: number;
  oblig: number;
  credit: number;
  tenure: number;
  emp: string;
  age?: number;
}

// عنوان الـ API — الافتراضي هو خادم Render المستضاف (يعمل على الموقع الحيّ مباشرة).
// للتطوير المحلي مقابل API محلي: اضبطي VITE_API_URL=http://localhost:8000 في ملف .env.local
const API_BASE = import.meta.env.VITE_API_URL || "https://sharik-risk-api.onrender.com";

// إيقاظ الخادم المجاني (Render يدخل سبات بعد الخمول) — نداء خفيف عند فتح الشاشة
// حتى يكون النموذج جاهزاً بحلول وقت ضغط المستخدم على "قيّم".
export function warmUpApi(): void {
  fetch(`${API_BASE}/health`, { method: "GET" }).catch(() => {});
}

export async function assessViaApi(payload: AssessPayload): Promise<ApiAssess> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000); // مهلة 8 ثوانٍ (تحمّل بدء التشغيل)
  try {
    const res = await fetch(`${API_BASE}/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as ApiAssess;
  } finally {
    clearTimeout(timer);
  }
}
