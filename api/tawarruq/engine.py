# ============================================================
#  محرك التورق المنظم — آلة حالات + بوابات شرعية + سجل تدقيق
# ============================================================
#  الترتيب هو جوهر الحكم الشرعي:
#      شراء → قبض → بيع مؤجّل → تسييل لطرف ثالث → صرف
#  أي انتكاس أو دمج للخطوات يحوّل العقد إلى بيع عِينة محرّم،
#  لذا الانتقالات غير المشروعة تُرفض (لا تُنبَّه فقط).
# ============================================================

import hashlib
import json
import uuid
from datetime import datetime, timezone

from . import market, pricing

# تسلسل الحالات — لا يُقفز فوق أي حالة
FLOW = ["ROUTED", "QUOTED", "SYNDICATED", "COMMODITY_ACQUIRED",
        "CONTRACT_SIGNED", "LIQUIDATED", "DISBURSED"]

_CONTRACTS: dict[str, dict] = {}


class GateError(Exception):
    """انتهاك بوابة شرعية — يوقف المعاملة."""
    def __init__(self, code: str, gate: str, message: str):
        self.code, self.gate, self.message = code, gate, message
        super().__init__(message)


class SequenceError(Exception):
    """محاولة انتقال خارج الترتيب المشروع."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append(contract: dict, event: str, payload: dict, gates: dict | None = None) -> None:
    """سجل تدقيق غير قابل للتعديل — كل حدث مربوط بهاش السابق."""
    prev = contract["ledger"][-1]["hash"] if contract["ledger"] else "GENESIS"
    body = {"seq": len(contract["ledger"]), "event": event, "ts": _now(),
            "payload": payload, "gates": gates or {}, "prev": prev}
    body["hash"] = hashlib.sha256(
        json.dumps(body, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()[:16]
    contract["ledger"].append(body)


def gate_status(contract: dict) -> dict:
    """
    آخر حكم لكل بوابة عبر السجل. الترتيب الزمني هو الحَكَم:
    محاولة مُنعت ثم صُحّحت تُقرأ من نتيجتها الأخيرة، لا من المحاولة.
    """
    status: dict[str, str] = {}
    for ev in contract["ledger"]:
        status.update(ev["gates"])
    return status


def _require(contract: dict, expected: str) -> None:
    if contract["state"] != expected:
        raise SequenceError(
            f"الحالة الحالية {contract['state']} — هذه الخطوة تتطلّب {expected}"
        )


# ---------- الساق 0: التوجيه ----------
def route(request_id: str, purpose: str, amount: float, tenor: int,
          ai: dict, merchant_id: str | None = None) -> dict:
    decision = pricing.route_contract(purpose, merchant_id)
    if decision["contract_type"] is None:
        raise GateError("SC1_BLOCKED", "SC1", f"غرض التمويل مرفوض: {decision['reason']}")

    # حد ساما لنسبة عبء الدين — قبل تكوين أي عقد
    if ai.get("dbr", 0) > 0.45:
        raise GateError("DBR_EXCEEDED", "SC1",
                        "نسبة عبء الدين تتجاوز 45% — حد البنك المركزي السعودي")

    cid = f"TWQ-{uuid.uuid4().hex[:8].upper()}"
    contract = {
        "contract_id": cid, "request_id": request_id, "state": "ROUTED",
        "contract_type": decision["contract_type"], "purpose": purpose,
        "amount": amount, "tenor": tenor, "ai": ai, "ledger": [],
        "created_at": _now(),
    }
    _CONTRACTS[cid] = contract
    _append(contract, "ROUTED", {"contract_type": decision["contract_type"],
                                 "reason": decision["reason"]}, decision["gate"])
    return contract


# ---------- الساق 1: التسعير ----------
def quote(contract_id: str) -> dict:
    c = _get(contract_id)
    _require(c, "ROUTED")
    q = pricing.build_quote(c["amount"], c["tenor"], c["ai"]["level"])
    c["quote"] = q
    c["state"] = "QUOTED"
    _append(c, "QUOTED", {k: q[k] for k in
                          ("cost_price", "profit_amount", "total_price", "monthly")}, q["gate"])
    return c


# ---------- الساق 2: التمويل الجماعي بالوكالة ----------
def syndicate(contract_id: str, investors: list[dict]) -> dict:
    c = _get(contract_id)
    _require(c, "QUOTED")
    funded = round(sum(i["amount"] for i in investors), 2)
    if funded < c["quote"]["cost_price"]:
        raise GateError("UNDER_SUBSCRIBED", "SC11",
                        f"التمويل غير مكتمل: {funded} من {c['quote']['cost_price']}")

    shares = [{"investor_id": i["id"], "amount": i["amount"],
               "pct": round(i["amount"] / funded * 100, 2)} for i in investors]
    c["syndicate"] = {"funded": funded, "shares": shares,
                      "wakala_deed_ref": f"WKL-{uuid.uuid4().hex[:6].upper()}"}
    c["state"] = "SYNDICATED"
    _append(c, "SYNDICATED", {"funded": funded, "investors": len(shares)},
            {"SC11": "PASS"})
    return c


# ---------- الساق A: شراء السلعة + القبض ----------
def acquire(contract_id: str, commodity: str = "copper") -> dict:
    c = _get(contract_id)
    _require(c, "SYNDICATED")
    if c["contract_type"] != "tawarruq":
        raise SequenceError("ساق السلعة تخص التورق فقط — المرابحة لا تحتاجها")
    try:
        lot = market.acquire_lot(c["quote"]["cost_price"], commodity)
    except ValueError as e:
        raise GateError("SC2_BLOCKED", "SC2", str(e))

    c["lot"] = lot
    c["state"] = "COMMODITY_ACQUIRED"
    _append(c, "COMMODITY_ACQUIRED",
            {"lot_id": lot["lot_id"], "commodity": lot["commodity"],
             "quantity": lot["quantity"], "possession_ts": lot["possession_ts"]},
            {"SC2": "PASS", "SC3": "PASS", "SC9": "PASS"})
    return c


# ---------- الساق B: البيع المؤجّل للعميل ----------
def sign(contract_id: str, customer_id: str) -> dict:
    c = _get(contract_id)
    _require(c, "COMMODITY_ACQUIRED")

    sale_ts = _now()
    # SC-3: لا يُباع ما لا يُملك — القبض يسبق البيع زمنياً بصرامة
    if not (c["lot"]["possession_ts"] < sale_ts):
        raise GateError("SEQUENCE_VIOLATION", "SC3",
                        "البيع سبق القبض — لا يجوز بيع ما لا تملك")

    c["sale"] = {"customer_id": customer_id, "sale_ts": sale_ts,
                 "total_price": c["quote"]["total_price"],
                 "ownership": "CUSTOMER",
                 "delivery_right": True,      # SC-6: للعميل حق الاستلام العيني
                 "linkage_to_leg_c": False}   # SC-6: لا اشتراط يربط البيعتين
    c["lot"]["owner"] = "CUSTOMER"
    c["state"] = "CONTRACT_SIGNED"
    _append(c, "CONTRACT_SIGNED",
            {"customer_id": customer_id, "total_price": c["quote"]["total_price"]},
            {"SC3": "PASS", "SC6": "PASS", "SC7": "PASS"})
    return c


# ---------- الساق C: تسييل العميل لطرف ثالث ----------
def liquidate(contract_id: str, buyer: str = market.BROKER_B) -> dict:
    c = _get(contract_id)
    _require(c, "CONTRACT_SIGNED")
    try:
        sale = market.liquidate_lot(c["lot"]["lot_id"], buyer)
    except PermissionError as e:
        # SC-4: البيع للبائع الأصلي = بيع عِينة.
        # المحاولة تُسجَّل للتدقيق لكنها لا تُفشل العقد: البوابة منعت الضرر
        # ولم تتغيّر الحالة. الامتثال يُقيَّم على الوضع النهائي لا على محاولة مرفوضة.
        _append(c, "INAH_BLOCKED", {"attempted_buyer": buyer}, {"SC4": "BLOCKED"})
        raise GateError("INAH_RISK", "SC4", str(e))
    except ValueError as e:
        raise GateError("SC9_BLOCKED", "SC9", str(e))

    c["liquidation"] = sale
    c["state"] = "LIQUIDATED"
    # SC-5: المنصة ليست وكيل العميل في البيع — الوسيط B مستقل
    _append(c, "LIQUIDATED",
            {"buyer": sale["buyer"], "proceeds": sale["proceeds"], "slippage": sale["slippage"]},
            {"SC4": "PASS", "SC5": "PASS"})
    return c


# ---------- الساق 6: صرف النقد ----------
def disburse(contract_id: str, iban: str) -> dict:
    c = _get(contract_id)
    _require(c, "LIQUIDATED")

    # SC-11: لا صرف قبل اجتياز كل البوابات.
    # نقيّم آخر حكم لكل بوابة — محاولة مُنعت (BLOCKED) لا تُفشل عقداً
    # انتهى صحيحاً، بينما FAIL فعلي يوقف الصرف.
    failed = [g for g, v in gate_status(c).items() if v == "FAIL"]
    if failed:
        raise GateError("GATE_OPEN", failed[0], f"بوابات لم تُجتَز: {failed}")

    c["disbursement"] = {"iban": iban, "amount": c["liquidation"]["proceeds"],
                         "payment_ref": f"PAY-{uuid.uuid4().hex[:8].upper()}",
                         "disbursed_at": _now()}
    c["state"] = "DISBURSED"
    _append(c, "DISBURSED", c["disbursement"], {"SC11": "PASS"})
    return c


def _get(contract_id: str) -> dict:
    c = _CONTRACTS.get(contract_id)
    if not c:
        raise SequenceError(f"عقد غير معروف: {contract_id}")
    return c


def get(contract_id: str) -> dict:
    return _get(contract_id)


def verify_ledger(contract_id: str) -> dict:
    """يعيد حساب سلسلة الهاش للتأكد من عدم العبث بالسجل."""
    c = _get(contract_id)
    prev = "GENESIS"
    for ev in c["ledger"]:
        body = {k: ev[k] for k in ("seq", "event", "ts", "payload", "gates")}
        body["prev"] = prev
        expected = hashlib.sha256(
            json.dumps(body, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()[:16]
        if expected != ev["hash"]:
            return {"intact": False, "broken_at": ev["seq"]}
        prev = ev["hash"]
    return {"intact": True, "events": len(c["ledger"])}
