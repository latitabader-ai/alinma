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
import csv
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

# مسار البيانات (قابل للتهيئة عبر متغيّر بيئة)
DATA_PATH = os.environ.get(
    "DATA_PATH",
    os.path.join(os.path.dirname(__file__), "..", "ml", "tamweel_data.csv"),
)
MARGIN_RATE = 0.065  # نسبة ربح المرابحة السنوية (نفس منطق الواجهة)

NUM_FEATURES = ["العمر", "مدة_التوظيف_شهر", "الراتب_الشهري",
                "الالتزامات_الشهرية", "التصنيف_الائتماني", "مبلغ_التمويل",
                "مدة_السداد_شهر", "القسط_الشهري_الجديد", "نسبة_عبء_الدين"]
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

        self.accuracy = round(accuracy_score(y_te, self.model.predict(X_te)) * 100, 1)
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

app = FastAPI(title="Sharik Risk API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # للعرض؛ يُضيّق في الإنتاج
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    # بناء متجه الخصائص بترتيب النموذج
    feat = [
        req.age, req.tenure, req.salary, req.oblig, req.credit,
        req.amount, req.term, installment, dbr,
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
        "modelAccuracy": engine.accuracy,
        "importances": engine.importances,
    }
