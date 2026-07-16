# ============================================================
#  التسعير وتوجيه العقد — محرك التورق المنظم
# ============================================================
#  سايبور مؤشّر مرجعي داخلي يُستخدم مرة واحدة عند الإنشاء لاشتقاق
#  ربح ثابت بالريال. لا يظهر في العقد ولا يُعاد التسعير به لاحقاً.
# ============================================================

import re
import unicodedata
from datetime import datetime, timezone

SAIBOR_3M = 4.75          # سايبور 3 أشهر (%) — مايو 2026
SAIBOR_AS_OF = "2026-05"

# هامش المخاطر فوق سايبور (%) — يحدّده تصنيف محرك الذكاء الاصطناعي
RISK_SPREAD = {"low": 1.5, "mid": 3.0, "high": 6.0}

# النطاق المعتمد من الهيئة الشرعية (SC-11): أي هامش خارجه يُرفض
BOARD_APPROVED_SPREAD_BAND = (0.5, 8.0)

# توجيه العقد: سلعة محدّدة → مرابحة | نقد عام → تورق منظم
ASSET_PURPOSES = {"سيارة", "أجهزة إلكترونية", "معدّات مهنية", "أثاث منزلي"}
CASH_PURPOSES = {"تمويل استهلاكي"}

# أغراض ممنوعة شرعاً (SC-1)
PROHIBITED_PURPOSES = {"مقامرة", "خمور", "سداد قرض ربوي", "تبغ"}


def normalize_ar(text: str) -> str:
    """
    يوحّد صور الحروف العربية قبل المطابقة: همزات الألف، الياء المقصورة،
    التطويل، والمسافات الزائدة. يمنع الرفض الخاطئ لاختلاف إملائي بريء
    مع إبقاء الرفض قائماً على الأغراض المجهولة فعلاً.
    """
    t = unicodedata.normalize("NFKC", text or "").strip()
    t = t.replace("ـ", "")                      # تطويل
    t = re.sub(r"[أإآٱ]", "ا", t)               # صور الألف
    t = t.replace("ى", "ي").replace("ؤ", "و").replace("ئ", "ي")
    t = re.sub(r"[ً-ْ]", "", t)       # تشكيل
    return re.sub(r"\s+", " ", t)


_ASSET_N = {normalize_ar(p) for p in ASSET_PURPOSES}
_CASH_N = {normalize_ar(p) for p in CASH_PURPOSES}
_PROHIBITED_N = {normalize_ar(p) for p in PROHIBITED_PURPOSES}


def route_contract(purpose: str, merchant_id: str | None = None) -> dict:
    """يحدّد العقد المطبّق من غرض التمويل. المرابحة هي الأصل والتورق استثناء."""
    p = normalize_ar(purpose)

    if p in _PROHIBITED_N:
        return {"contract_type": None, "reason": "prohibited_purpose", "gate": {"SC1": "FAIL"}}

    # سلعة محدّدة (أو تاجر معروف من المتجر) → مرابحة، بلا حاجة لساق سلعة
    if merchant_id or p in _ASSET_N:
        return {"contract_type": "murabaha", "reason": "identified_asset", "gate": {"SC1": "PASS"}}

    if p in _CASH_N:
        return {"contract_type": "tawarruq", "reason": "general_cash", "gate": {"SC1": "PASS"}}

    # غرض غير معروف — نتحفّظ ونطلب مراجعة بدل افتراض التورق
    return {"contract_type": None, "reason": "unclassified_purpose", "gate": {"SC1": "REVIEW"}}


def rate_for(level: str) -> float:
    """العائد السنوي (%) = سايبور + هامش المخاطر."""
    return round(SAIBOR_3M + RISK_SPREAD[level], 2)


def build_quote(amount: float, tenor_months: int, level: str) -> dict:
    """
    يبني عرض سعر مرابحة: ربح **ثابت بالريال** وسعر إجمالي ثابت.
    يُثبّت عند التوقيع ولا يتغيّر لا بالسداد المبكر ولا بالتعثّر (SC-7).
    """
    spread = RISK_SPREAD[level]
    lo, hi = BOARD_APPROVED_SPREAD_BAND
    if not (lo <= spread <= hi):
        raise ValueError(f"spread {spread}% خارج النطاق المعتمد من الهيئة الشرعية")

    rate = rate_for(level)
    profit = round(amount * (rate / 100) * (tenor_months / 12), 2)
    total = round(amount + profit, 2)

    return {
        "cost_price": round(amount, 2),
        "profit_amount": profit,          # ثابت — ليس نسبة زمنية
        "total_price": total,
        "monthly": round(total / tenor_months, 2),
        "tenor_months": tenor_months,
        "benchmark": {
            "name": "SAIBOR_3M",
            "value": SAIBOR_3M,
            "as_of": SAIBOR_AS_OF,
            "role": "internal_pricing_benchmark_only",
            "snapshot_at": datetime.now(timezone.utc).isoformat(),
        },
        "spread": spread,
        "indicative_rate": rate,
        "repricing": "none",              # لا إعادة تسعير — سعر بيع ثابت
        "gate": {"SC7": "PASS"},
    }
