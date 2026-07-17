# ============================================================
#  API تقييم مخاطر التمويل — يخدم نموذج Random Forest حقيقياً
#  مشروع: منصة "شارِك" للتمويل الجماعي | هاكاثون امد
# ============================================================
#
#  يدرّب النموذج عند الإقلاع من ml/tamweel_data.csv، ثم يوفّر
#  نقطة نهاية POST /assess تستقبل بيانات المتقدّم وتعيد مستوى
#  الخطر (منخفض/متوسط/مرتفع) وثقة التنبؤ والعوامل المؤثّرة.
#
#  التشغيل:
#     pip install -r requirements.txt
#     uvicorn main:app --reload --port 8000
# ============================================================

import os
import sys
import csv
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score

# مسار البيانات (قابل للتهيئة عبر متغيّر بيئة)
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
DATA_PATH = os.environ.get("DATA_PATH", os.path.join(ML_DIR, "tamweel_data.csv"))

# نستورد دالة ثقة الدخل من ml/ لتبقى مصدراً واحداً للحقيقة:
# نفس الدالة التي وُلِّدت بها بيانات التدريب تُستخدم وقت التنبؤ.
sys.path.insert(0, os.path.abspath(ML_DIR))
from income_confidence import calculate_income_confidence  # noqa: E402
MARGIN_RATE = 0.065  # نسبة ربح المرابحة السنوية (نفس منطق الواجهة)

NUM_FEATURES = ["العمر", "مدة_التوظيف_شهر", "الراتب_الشهري",
                "الالتزامات_الشهرية", "التصنيف_الائتماني", "مبلغ_التمويل",
                "مدة_السداد_شهر", "القسط_الشهري_الجديد", "نسبة_عبء_الدين",
                "نسبة_ثقة_الدخل"]
CAT_FEATURES = ["جهة_العمل", "نوع_السلعة"]
TARGET = "مستوى_الخطر"

# خريطة التسميات العربية → مفاتيح الواجهة
LEVEL_KEY = {"منخفض": "low", "متوسط": "mid", "مرتفع": "high"}


class Engine:
    """يحمّل البيانات، يدرّب النموذج، ويحتفظ بالمرمّزات."""

    def __init__(self, path):
        with open(path, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))

        # ترميز الأعمدة الفئوية
        self.encoders = {}
        for col in CAT_FEATURES:
            le = LabelEncoder()
            le.fit([r[col] for r in rows])
            self.encoders[col] = le

        X = []
        for r in rows:
            row = [float(r[f]) for f in NUM_FEATURES]
            row += [self.encoders[c].transform([r[c]])[0] for c in CAT_FEATURES]
            X.append(row)
        X = np.array(X)

        self.y_encoder = LabelEncoder()
        y = self.y_encoder.fit_transform([r[TARGET] for r in rows])

        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y)

        self.model = RandomForestClassifier(
            n_estimators=300, max_depth=6, min_samples_leaf=1,
            class_weight="balanced", random_state=42)
        self.model.fit(X_tr, y_tr)

        y_pred = self.model.predict(X_te)
        self.accuracy = round(accuracy_score(y_te, y_pred) * 100, 1)

        # دقة التنبؤ (precision) واكتشاف (recall) لفئة الخطر المرتفع — الأهم لحماية المساهمين
        high_idx = int(self.y_encoder.transform(["مرتفع"])[0])
        self.high_precision = round(precision_score(y_te, y_pred, labels=[high_idx], average="micro", zero_division=0) * 100)
        self.high_recall = round(recall_score(y_te, y_pred, labels=[high_idx], average="micro", zero_division=0) * 100)

        self.importances = sorted(
            [{"name": n, "value": round(v * 100, 1)}
             for n, v in zip(NUM_FEATURES + CAT_FEATURES, self.model.feature_importances_)],
            key=lambda x: -x["value"])

    def encode_cat(self, col, value):
        """يرمّز قيمة فئوية، وإن كانت غير معروفة يستخدم أول فئة (fallback آمن)."""
        le = self.encoders[col]
        if value in le.classes_:
            return int(le.transform([value])[0])
        return 0

    def predict(self, feat_row):
        pred = self.model.predict([feat_row])[0]
        proba = self.model.predict_proba([feat_row])[0]
        label_ar = self.y_encoder.classes_[pred]
        return label_ar, float(proba[pred])


engine: Engine | None = None

app = FastAPI(title="Sharik Risk API", version="1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # للعرض؛ يُضيّق في الإنتاج
    allow_methods=["*"],
    allow_headers=["*"],
)

# محرك التورق المنظم — طبقة مستقلة تستهلك حكم الذكاء الاصطناعي
# ولا تمسّه. /assess يبقى مصنّفاً محضاً لا يسعّر ولا يصرف.
from tawarruq import router as tawarruq_router  # noqa: E402
app.include_router(tawarruq_router)


@app.on_event("startup")
def _load():
    global engine
    engine = Engine(DATA_PATH)
    print(f"[API] النموذج جاهز — دقة الاختبار {engine.accuracy}%")


class AssessRequest(BaseModel):
    item: str = Field("سيارة", description="نوع السلعة")
    amount: float = Field(..., description="مبلغ التمويل")
    term: int = Field(..., description="مدة السداد بالأشهر")
    salary: float = Field(..., description="الراتب الشهري")
    oblig: float = Field(0, description="الالتزامات الشهرية")
    credit: int = Field(..., description="التصنيف الائتماني (سمة)")
    tenure: int = Field(..., description="مدة التوظيف بالأشهر")
    emp: str = Field("حكومي", description="جهة العمل")
    age: int = Field(35, description="العمر")
    # كشف الحساب من المصرفية المفتوحة — منه تُحتسب ثقة الدخل.
    # إن لم يُرسل، نستخدم incomeConfidence مباشرة أو نفترض دخلاً غير موثّق.
    transactions: list[dict] | None = Field(None, description='[{"amount":6500,"type":"credit"}]')
    incomeConfidence: int | None = Field(None, ge=0, le=100, description="0-100 إن حُسبت مسبقاً")


@app.get("/")
def root():
    return {"service": "Sharik Risk API", "model": "RandomForest",
            "accuracy": engine.accuracy if engine else None}


@app.get("/health")
def health():
    return {"ok": engine is not None, "accuracy": engine.accuracy if engine else None}


@app.post("/assess")
def assess(req: AssessRequest):
    # حساب القسط ونسبة عبء الدين بنفس منطق الواجهة
    installment = req.amount * (1 + MARGIN_RATE * (req.term / 12)) / req.term
    dbr = (req.oblig + installment) / req.salary if req.salary else 0.0

    # ثقة الدخل: تُحتسب من كشف الحساب إن توفّر، وإلا تُستخدم القيمة الممرَّرة.
    # بدون أيٍّ منهما لا نفترض دخلاً موثّقاً — الغياب ليس دليل صحة.
    if req.transactions:
        income = calculate_income_confidence(req.salary, req.transactions)
    elif req.incomeConfidence is not None:
        income = {"score": req.incomeConfidence, "label": "—", "detected_income": None,
                  "deposits_count": 0, "evidence": "أُدخلت ثقة الدخل مباشرة دون كشف حساب."}
    else:
        income = {"score": 20, "label": "دخل غير مؤكد", "detected_income": None,
                  "deposits_count": 0,
                  "evidence": "لم يُربط كشف الحساب — الدخل المُصرَّح غير موثّق."}

    # بناء متجه الخصائص بترتيب النموذج
    feat = [
        req.age, req.tenure, req.salary, req.oblig, req.credit,
        req.amount, req.term, installment, dbr, income["score"],
        engine.encode_cat("جهة_العمل", req.emp),
        engine.encode_cat("نوع_السلعة", req.item),
    ]

    label_ar, confidence = engine.predict(feat)

    return {
        "level": LEVEL_KEY.get(label_ar, "mid"),
        "levelText": label_ar,
        "confidence": round(confidence * 100),
        "installment": round(installment),
        "dbr": round(dbr, 3),
        "incomeConfidence": income,          # score + label + evidence بأرقام فعلية
        "modelAccuracy": engine.accuracy,
        "highRiskPrecision": engine.high_precision,
        "highRiskRecall": engine.high_recall,
        "importances": engine.importances,
    }
