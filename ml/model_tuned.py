# ============================================================
#  نموذج تصنيف مخاطر طلبات التمويل — نسخة تعليمية مع ضبط المعاملات
#  مشروع: منصة التمويل الجماعي الإسلامي | هاكاثون امد
# ============================================================
#
#  هذا الملف يدرّب نموذجاً يتنبأ بمستوى خطر طلب التمويل
#  (منخفض / متوسط / مرتفع) من بيانات المتقدّم.
#
#  الجديد في هذه النسخة: نستخدم GridSearchCV لتجربة عدة
#  إعدادات للنموذج تلقائياً واختيار الأفضل (hyperparameter tuning).
#
#  طريقة التشغيل:
#     python3 model_tuned.py
#
#  المتطلبات:
#     pip install scikit-learn numpy
# ============================================================

import csv
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder

# المسار إلى ملف البيانات (عدّله إن كان في مكان آخر)
DATA_PATH = "tamweel_data.csv"


# ============================================================
#  القسم 1: قراءة البيانات
# ============================================================
def load_data(path):
    """يقرأ ملف CSV ويعيد قائمة من الصفوف (كل صف قاموس)."""
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    print(f"[1] قُرئ {len(rows)} طلب تمويل من الملف")
    return rows


# ============================================================
#  القسم 2: تجهيز الخصائص (Features)
# ============================================================
# نحدّد الأعمدة التي يتعلّم منها النموذج.
# - الأعمدة الرقمية: تُستخدم كما هي.
# - الأعمدة الفئوية (نصية): نحوّلها لأرقام عبر LabelEncoder.
# - نستبعد: رقم_الطلب (معرّف فقط)، المدينة (غير مؤثرة)،
#   ومستوى_الخطر (هو الهدف الذي نتنبأ به).

NUM_FEATURES = ["العمر", "مدة_التوظيف_شهر", "الراتب_الشهري",
                "الالتزامات_الشهرية", "التصنيف_الائتماني", "مبلغ_التمويل",
                "مدة_السداد_شهر", "القسط_الشهري_الجديد", "نسبة_عبء_الدين"]
CAT_FEATURES = ["جهة_العمل", "نوع_السلعة"]
TARGET = "مستوى_الخطر"


def prepare_features(rows):
    """يحوّل الصفوف إلى مصفوفة أرقام X وهدف y جاهزين للنموذج."""
    # ترميز الأعمدة الفئوية: كل قيمة نصية تأخذ رقماً
    encoders = {}
    for col in CAT_FEATURES:
        le = LabelEncoder()
        le.fit([r[col] for r in rows])
        encoders[col] = le

    # بناء مصفوفة الخصائص
    X = []
    for r in rows:
        row = [float(r[f]) for f in NUM_FEATURES]                       # الأرقام
        row += [encoders[c].transform([r[c]])[0] for c in CAT_FEATURES] # الفئات بعد الترميز
        X.append(row)
    X = np.array(X)

    # ترميز الهدف (مستوى الخطر) لأرقام
    y_encoder = LabelEncoder()
    y = y_encoder.fit_transform([r[TARGET] for r in rows])

    feature_names = NUM_FEATURES + CAT_FEATURES
    print(f"[2] جُهّزت {X.shape[1]} خاصية لكل طلب")
    return X, y, feature_names, encoders, y_encoder


# ============================================================
#  القسم 3: ضبط المعاملات (Hyperparameter Tuning)
# ============================================================
# بدل تخمين إعدادات النموذج، نعرّف شبكة من الاحتمالات،
# وGridSearchCV يجرّب كل التوليفات (مع تحقق متقاطع 5 طيّات)
# ويختار الأفضل تلقائياً.

def tune_model(X_train, y_train):
    """يجرّب عدة إعدادات ويعيد أفضل نموذج."""
    # الشبكة: كل مفتاح معامل، وكل قائمة قيم نجرّبها
    param_grid = {
        "n_estimators": [100, 200, 300],     # عدد الأشجار
        "max_depth": [6, 10, 14, None],      # عمق الشجرة (None = بلا حد)
        "min_samples_leaf": [1, 3, 5],       # أقل عيّنات في الورقة
    }

    base = RandomForestClassifier(
        class_weight="balanced",   # موازنة الفئات (مهم لفئة "مرتفع" القليلة)
        random_state=42
    )

    # GridSearchCV: يجرّب كل توليفة، ويقيس بمقياس f1_macro
    # (f1_macro يعطي كل فئة وزناً متساوياً — مناسب لعدم التوازن)
    grid = GridSearchCV(
        base, param_grid,
        cv=5,                  # تحقق متقاطع: يقسّم بيانات التدريب 5 مرات
        scoring="f1_macro",
        n_jobs=-1              # استخدم كل المعالجات لتسريع البحث
    )
    print("[3] جارٍ تجربة", 
          len(param_grid["n_estimators"]) * len(param_grid["max_depth"]) * len(param_grid["min_samples_leaf"]),
          "توليفة إعدادات... (قد يأخذ لحظات)")
    grid.fit(X_train, y_train)

    print("    أفضل إعدادات وُجدت:")
    for k, v in grid.best_params_.items():
        print(f"      {k} = {v}")
    return grid.best_estimator_


# ============================================================
#  القسم 4: التقييم
# ============================================================
def evaluate(model, X_test, y_test, y_encoder, feature_names):
    """يقيس أداء النموذج ويطبع تقريراً مفصّلاً."""
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    labels = list(y_encoder.classes_)

    print("\n" + "=" * 52)
    print(f"  دقّة النموذج الكلية: {acc*100:.1f}%")
    print("=" * 52)

    report = classification_report(y_test, y_pred, target_names=labels,
                                   output_dict=True, zero_division=0)
    print("\n  الأداء لكل فئة:")
    print("  (precision = دقة التنبؤ | recall = نسبة الاكتشاف)")
    for lab in labels:
        p = report[lab]
        print(f"    {lab:8s} | precision: {p['precision']*100:4.0f}% | "
              f"recall: {p['recall']*100:4.0f}% | عدد: {int(p['support'])}")

    # مصفوفة الالتباس: تُظهر أين يخطئ النموذج
    print("\n  مصفوفة الالتباس (الصفوف=الحقيقة، الأعمدة=التنبؤ):")
    cm = confusion_matrix(y_test, y_pred)
    print("    " + "  ".join(f"{l:>7s}" for l in labels))
    for i, lab in enumerate(labels):
        print(f"    {lab:>7s}  " + "  ".join(f"{cm[i][j]:7d}" for j in range(len(labels))))

    # أهم العوامل
    print("\n  أهم العوامل المؤثّرة:")
    importances = sorted(zip(feature_names, model.feature_importances_),
                         key=lambda x: -x[1])
    for name, imp in importances[:6]:
        bar = "#" * int(imp * 60)
        print(f"    {name:22s} {imp*100:4.1f}%  {bar}")

    return acc


# ============================================================
#  القسم 5: تجربة النموذج على طلبات جديدة
# ============================================================
def try_examples(model, encoders, y_encoder):
    """يجرّب النموذج على ثلاثة طلبات افتراضية لنرى قراره."""
    print("\n" + "=" * 52)
    print("  تجربة على طلبات جديدة:")
    print("=" * 52)
    # الترتيب: [عمر, توظيف, راتب, التزامات, تصنيف, مبلغ, مدة, قسط, نسبة عبء]
    examples = [
        {"وصف": "موظف حكومي مستقر، تصنيف ممتاز",
         "v": [35, 96, 18000, 2000, 780, 50000, 36, 1500, 0.19],
         "emp": "حكومي", "item": "سيارة"},
        {"وصف": "أعمال حرة، تصنيف ضعيف، عبء عالٍ",
         "v": [27, 8, 7000, 2500, 480, 60000, 24, 2700, 0.44],
         "emp": "أعمال حرة", "item": "معدّات مهنية"},
        {"وصف": "شركة كبرى، وضع متوسط",
         "v": [31, 30, 11000, 2200, 660, 35000, 36, 1100, 0.30],
         "emp": "شركة كبرى", "item": "أجهزة إلكترونية"},
    ]
    for ex in examples:
        feat = ex["v"] + [
            encoders["جهة_العمل"].transform([ex["emp"]])[0],
            encoders["نوع_السلعة"].transform([ex["item"]])[0],
        ]
        pred = model.predict([feat])[0]
        proba = model.predict_proba([feat])[0]
        conf = proba[pred] * 100
        print(f"\n  {ex['وصف']}")
        print(f"    => التصنيف: {y_encoder.classes_[pred]} (ثقة {conf:.0f}%)")


# ============================================================
#  البرنامج الرئيسي
# ============================================================
def main():
    rows = load_data(DATA_PATH)
    X, y, feature_names, encoders, y_encoder = prepare_features(rows)

    # تقسيم 80% تدريب / 20% اختبار، مع الحفاظ على نسب الفئات (stratify)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"    تدريب: {len(X_train)} | اختبار: {len(X_test)}")

    # ضبط واختيار أفضل نموذج
    model = tune_model(X_train, y_train)

    # التقييم على بيانات الاختبار (التي لم يرَها النموذج)
    evaluate(model, X_test, y_test, y_encoder, feature_names)

    # تجربة على أمثلة
    try_examples(model, encoders, y_encoder)

    print("\nانتهى. جرّب تعديل param_grid في القسم 3 ولاحظ أثر ذلك على الدقّة.")


if __name__ == "__main__":
    main()
