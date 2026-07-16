# ============================================================
#  واجهة محرك التورق المنظم — نقاط النهاية
# ============================================================
#  كل نداء يقدّم ساقاً واحدة فقط. الانتقالات غير المشروعة تُرفض
#  برموز HTTP صريحة (409 ترتيب / 422 عِينة / 428 بوابة مفتوحة).
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from . import engine, market, pricing

router = APIRouter(prefix="/tawarruq", tags=["Organized Tawarruq"])


def _handle(fn, *a, **kw):
    """يترجم أخطاء المحرك إلى رموز HTTP معبّرة."""
    try:
        return fn(*a, **kw)
    except engine.GateError as e:
        code = 422 if e.code == "INAH_RISK" else 428 if e.code == "GATE_OPEN" else 400
        raise HTTPException(status_code=code,
                            detail={"error": e.code, "gate": e.gate, "message": e.message})
    except engine.SequenceError as e:
        raise HTTPException(status_code=409,
                            detail={"error": "SEQUENCE_VIOLATION", "message": str(e)})


class AiVerdict(BaseModel):
    level: str = Field(..., description="low | mid | high")
    dbr: float = 0.0
    confidence: int = 0


class RouteReq(BaseModel):
    request_id: str = "REQ-1"
    purpose: str = Field(..., description="نوع السلعة / غرض التمويل")
    amount: float
    tenor: int = 36
    ai: AiVerdict
    merchant_id: str | None = None


class SyndicateReq(BaseModel):
    investors: list[dict] = Field(..., description='[{"id":"INV-1","amount":25000}]')


class AcquireReq(BaseModel):
    commodity: str = "copper"


class SignReq(BaseModel):
    customer_id: str = "CUST-1"


class LiquidateReq(BaseModel):
    buyer: str = market.BROKER_B


class DisburseReq(BaseModel):
    iban: str = "SA0000000000000000000000"


def _public(c: dict) -> dict:
    """يعرض العقد دون تفاصيل داخلية زائدة."""
    return {k: c[k] for k in c if k != "ledger"} | {"ledger_events": len(c["ledger"])}


@router.get("/benchmark")
def benchmark():
    """أساس التسعير المعلن — سايبور كمؤشّر مرجعي فقط."""
    return {
        "name": "SAIBOR_3M", "value": pricing.SAIBOR_3M, "as_of": pricing.SAIBOR_AS_OF,
        "role": "internal_pricing_benchmark_only",
        "spreads": pricing.RISK_SPREAD,
        "rates": {lvl: pricing.rate_for(lvl) for lvl in pricing.RISK_SPREAD},
    }


@router.post("/route")
def route(req: RouteReq):
    """الساق 0 — يحدّد العقد المطبّق من غرض التمويل بعد تقييم الذكاء الاصطناعي."""
    c = _handle(engine.route, req.request_id, req.purpose, req.amount,
                req.tenor, req.ai.model_dump(), req.merchant_id)
    return _public(c)


@router.post("/{contract_id}/quote")
def quote(contract_id: str):
    """الساق 1 — تثبيت ربح ثابت بالريال والإفصاح الكامل قبل التوقيع."""
    return _public(_handle(engine.quote, contract_id))


@router.post("/{contract_id}/syndicate")
def syndicate(contract_id: str, req: SyndicateReq):
    """الساق 2 — جمع رأس المال من المساهمين بعقد وكالة."""
    return _public(_handle(engine.syndicate, contract_id, req.investors))


@router.post("/{contract_id}/commodity/acquire")
def acquire(contract_id: str, req: AcquireReq):
    """الساق A — شراء حصة سلعة وإثبات القبض الحكمي."""
    return _public(_handle(engine.acquire, contract_id, req.commodity))


@router.post("/{contract_id}/contract/sign")
def sign(contract_id: str, req: SignReq):
    """الساق B — بيع مؤجّل للعميل بربح مفصح ثابت."""
    return _public(_handle(engine.sign, contract_id, req.customer_id))


@router.post("/{contract_id}/commodity/liquidate")
def liquidate(contract_id: str, req: LiquidateReq):
    """الساق C — بيع العميل للسلعة نقداً لطرف ثالث مستقل."""
    return _public(_handle(engine.liquidate, contract_id, req.buyer))


@router.post("/{contract_id}/disburse")
def disburse(contract_id: str, req: DisburseReq):
    """الساق 6 — صرف حصيلة البيع للعميل."""
    return _public(_handle(engine.disburse, contract_id, req.iban))


@router.get("/{contract_id}/audit")
def audit(contract_id: str):
    """سجل التدقيق الشرعي المتسلسل + التحقق من سلامة السلسلة."""
    c = _handle(engine.get, contract_id)
    return {"contract_id": contract_id, "state": c["state"],
            "gate_status": engine.gate_status(c),      # آخر حكم لكل بوابة
            "events": c["ledger"], "integrity": engine.verify_ledger(contract_id)}
