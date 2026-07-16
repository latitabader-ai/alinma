# ============================================================
#  سوق السلع المنظّم (محاكاة) — وسيطان مستقلان
# ============================================================
#  الوسيط A يبيع السلعة للمنصة (نيابة عن المساهمين).
#  الوسيط B يشتريها من العميل عند التسييل — ويجب أن يكون
#  مستقلاً عن A وعن المنصة، وإلا صارت بيع عينة (SC-4).
# ============================================================

import uuid
from datetime import datetime, timezone

BROKER_A = "BROKER_A"          # المورّد — تُشترى منه السلعة
BROKER_B = "BROKER_B"          # المشتري النهائي — مستقل تماماً
PLATFORM_AFFILIATES = {"SHARIK_PLATFORM", "SHARIK_SPV", BROKER_A}

# سلع مسموحة: معادن أساسية (غير ربوية).
# الذهب والفضة والعملات ممنوعة — بدلها يلزم التقابض الفوري (SC-2).
COMMODITY_WHITELIST = {
    "copper":   {"ar": "نحاس",    "unit": "طن", "price_per_unit": 8_500.0},
    "aluminum": {"ar": "ألمنيوم", "unit": "طن", "price_per_unit": 2_400.0},
    "zinc":     {"ar": "زنك",     "unit": "طن", "price_per_unit": 2_800.0},
}
RIBAWI_BLOCKLIST = {"gold", "silver", "currency", "ذهب", "فضة", "عملة"}

# سجل الحصص — يمنع بيع نفس الحصة مرتين (SC-9)
_LOT_REGISTRY: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def acquire_lot(notional: float, commodity: str = "copper") -> dict:
    """الساق A: شراء حصة سلعة محدّدة من الوسيط A + إثبات القبض الحكمي."""
    if commodity in RIBAWI_BLOCKLIST:
        raise ValueError(f"سلعة ربوية ({commodity}) — يلزم التقابض الفوري، غير صالحة للتورق")
    if commodity not in COMMODITY_WHITELIST:
        raise ValueError(f"سلعة غير معتمدة: {commodity}")

    spec = COMMODITY_WHITELIST[commodity]
    qty = round(notional / spec["price_per_unit"], 4)
    lot_id = f"{commodity[:2].upper()}-{uuid.uuid4().hex[:4].upper()}"

    lot = {
        "lot_id": lot_id,
        "commodity": commodity,
        "commodity_ar": spec["ar"],
        "quantity": qty,
        "unit": spec["unit"],
        "cost_price": round(notional, 2),
        "seller": BROKER_A,
        "owner": "INVESTORS_VIA_WAKIL",
        "warrant_ref": f"WR-{uuid.uuid4().hex[:8].upper()}",
        "possession_ts": _now(),      # القبض الحكمي — قبل أي بيع لاحق
        "sold": False,
    }
    _LOT_REGISTRY[lot_id] = lot
    return lot


def liquidate_lot(lot_id: str, buyer: str = BROKER_B) -> dict:
    """الساق C: بيع العميل للسلعة نقداً لطرف ثالث مستقل."""
    lot = _LOT_REGISTRY.get(lot_id)
    if not lot:
        raise ValueError(f"حصة غير معروفة: {lot_id}")
    if lot["sold"]:
        raise ValueError(f"الحصة {lot_id} بيعت مسبقاً — بيع مزدوج (SC-9)")

    # الحارس الجوهري: لا يجوز البيع للبائع الأصلي أو لأي جهة تابعة للمنصة
    if buyer in PLATFORM_AFFILIATES:
        raise PermissionError(
            f"المشتري ({buyer}) هو البائع الأصلي أو جهة تابعة — هذه بيع عِينة محرّمة (SC-4)"
        )

    # انزلاق سعري واقعي عند التسييل الفوري (فرق العرض/الطلب + عمولة)
    proceeds = round(lot["cost_price"] * 0.9992, 2)

    lot["sold"] = True
    lot["owner"] = buyer
    return {
        "lot_id": lot_id,
        "proceeds": proceeds,
        "slippage": round(lot["cost_price"] - proceeds, 2),
        "buyer": buyer,
        "sale_ts": _now(),
    }


def get_lot(lot_id: str) -> dict | None:
    return _LOT_REGISTRY.get(lot_id)
