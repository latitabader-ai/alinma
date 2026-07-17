# ============================================================
#  مولّد بيانات المحاكاة — مبني على علاقات سببية لا أرقام عشوائية
# ============================================================
#  التشغيل:  python generate_data.py
#  المخرجات: tamweel_data.csv  (بيانات التدريب + عمود ثقة الدخل)
#            transactions_sample.json (كشوف حساب لعيّنة — للعرض)
#
#  سلسلة السببية المصمَّمة:
#     جهة العمل ─┬─▶ مستوى الراتب وتذبذبه
#                ├─▶ انتظام الإيداعات ──▶ ثقة الدخل
#                └─▶ استقرار الوظيفة ──┐
#     العمر ─────▶ مدة التوظيف ────────┤
#     الالتزامات + القسط ──▶ عبء الدين ─┼─▶ خطر كامن ──▶ مستوى الخطر
#     التصنيف الائتماني ────────────────┘        (+ ضجيج)
#
#  مهم: مستوى الخطر لا يُشتقّ اشتقاقاً حتمياً من الأعمدة الظاهرة.
#  نضيف ضجيجاً وعوامل غير مرصودة، وإلا حفظ النموذج الصيغة وأعطى
#  دقة ~100% زائفة (تسريب). الهدف علاقة حقيقية لكن غير كاملة.
# ============================================================

import csv
import json
import random
from datetime import date, timedelta

from income_confidence import calculate_income_confidence

SEED = 42
N = 800
MARGIN_RATE = 0.065
random.seed(SEED)

# جهة العمل تحكم: الراتب، انتظام الإيداع، استقرار الوظيفة
EMPLOYERS = {
    #                 وزن   راتب(متوسط, انحراف)  انتظام  استقرار  سقف مدة التوظيف
    "حكومي":        dict(w=0.30, sal=(11500, 3000), reg=0.97, stab=1.00, tmax=300),
    "شركة كبرى":     dict(w=0.22, sal=(16000, 5500), reg=0.92, stab=0.88, tmax=220),
    "شركة متوسطة":   dict(w=0.22, sal=(10500, 3200), reg=0.85, stab=0.70, tmax=160),
    "قطاع خاص صغير": dict(w=0.16, sal=(7000,  2200), reg=0.70, stab=0.50, tmax=110),
    "أعمال حرة":     dict(w=0.10, sal=(12000, 6500), reg=0.35, stab=0.30, tmax=130),
}

CITIES = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "أبها", "تبوك", "حائل", "القصيم"]
CITY_COST = {"الرياض": 1.12, "جدة": 1.08, "الدمام": 1.05, "مكة": 1.0,
             "المدينة": 0.95, "أبها": 0.9, "تبوك": 0.88, "حائل": 0.86, "القصيم": 0.9}

ITEMS = {
    "سيارة":            (35_000, 140_000),
    "أجهزة إلكترونية":  (3_000,  25_000),
    "معدّات مهنية":     (10_000, 90_000),
    "أثاث منزلي":       (5_000,  40_000),
}
TERMS = [12, 24, 36, 48, 60]


def pick_employer() -> str:
    return random.choices(list(EMPLOYERS), weights=[e["w"] for e in EMPLOYERS.values()])[0]


def gen_transactions(salary: float, oblig: float, regularity: float, months: int = 6) -> list[dict]:
    """
    كشف حساب مشتقّ من الملف نفسه:
    - الانتظام العالي  → إيداع شهري ثابت المبلغ والموعد (راتب حكومي)
    - الانتظام المنخفض → مبالغ متفاوتة وشهور تُفوَّت (دخل حرّ)
    """
    txns: list[dict] = []
    today = date.today()
    for m in range(months, 0, -1):
        day = today - timedelta(days=30 * m)
        # كلما قلّ الانتظام زاد احتمال تفويت شهر
        if random.random() > regularity * 0.85 + 0.15:
            continue
        # تذبذب المبلغ عكسي مع الانتظام
        jitter = random.gauss(0, salary * (1 - regularity) * 0.35)
        amount = max(500, round(salary + jitter))
        txns.append({"date": day.isoformat(), "amount": amount, "type": "credit",
                     "desc": "إيداع راتب" if regularity > 0.6 else "إيداع"})
        # مصروفات/التزامات (خصومات) — لا تدخل حساب ثقة الدخل
        if oblig > 0:
            txns.append({"date": (day + timedelta(days=2)).isoformat(),
                         "amount": round(oblig), "type": "debit", "desc": "سداد التزام"})
    # إيداعات متفرقة (تحويلات) — ضجيج واقعي يجب ألا يُخلط بالراتب
    for _ in range(random.randint(0, 3)):
        txns.append({"date": (today - timedelta(days=random.randint(1, 180))).isoformat(),
                     "amount": round(random.uniform(200, 2500)), "type": "credit",
                     "desc": "تحويل وارد"})
    return sorted(txns, key=lambda t: t["date"])


def build_row(i: int) -> tuple[dict, list[dict]]:
    emp_name = pick_employer()
    emp = EMPLOYERS[emp_name]

    age = random.randint(22, 58)
    max_tenure = min(emp["tmax"], (age - 21) * 12)
    # الاستقرار يرفع مدة التوظيف المتوقّعة
    tenure = max(3, round(random.betavariate(1.6, 3.2) * max_tenure * (0.5 + emp["stab"] * 0.5)))

    city = random.choice(CITIES)
    # الراتب: جهة العمل + خبرة (مدة التوظيف) + غلاء المدينة
    base = random.gauss(*emp["sal"])
    experience = 1 + min(tenure / 120, 1.0) * 0.35
    salary = max(4000, round(base * experience * CITY_COST[city] / 100) * 100)

    # الالتزامات: نسبة من الدخل، أعلى لدى الأقل استقراراً
    oblig_ratio = min(0.42, max(0.0, random.betavariate(2, 5) * (1.5 - emp["stab"] * 0.5)))
    oblig = round(salary * oblig_ratio / 50) * 50

    # التصنيف الائتماني (سمة): يرتفع بالاستقرار وطول التوظيف، وينخفض بالمديونية
    credit = 300 + 350 * emp["stab"] + 180 * min(tenure / 120, 1) - 260 * oblig_ratio
    credit = int(max(300, min(900, random.gauss(credit, 45))))

    # كشف الحساب ثم ثقة الدخل — أصحاب الأعمال الحرة قد يبالغون في التصريح
    declared = salary if emp["reg"] > 0.5 else round(salary * random.uniform(1.0, 1.45) / 100) * 100
    txns = gen_transactions(salary, oblig, emp["reg"])
    conf = calculate_income_confidence(declared, txns)

    # نبدأ من القدرة على السداد لا من المبلغ:
    # المتقدّم يطلب ما يظنّ أنه يقدر عليه (اختيار ذاتي)، فمعظم الطلبات
    # تحت حد ساما وأقلية تتجاوزه. عكس هذا الترتيب يولّد أعباء خيالية.
    target_dbr = min(0.78, max(0.06, random.betavariate(2.5, 5.0) * 0.85))
    budget = max(300, target_dbr * salary - oblig)   # ما يتبقّى للقسط الجديد

    # السلعة تُختار ضمن ما يطيقه الدخل — صاحب 7 آلاف لا يطلب سيارة 140 ألفاً.
    # بدون هذا القيد يقصّ المبلغ على حدّ السلعة الأدنى فينفجر عبء الدين.
    affordable = [it for it, (lo_, _) in ITEMS.items()
                  if lo_ <= budget * 60 / (1 + MARGIN_RATE * 5)]
    item = random.choice(affordable or ["أجهزة إلكترونية"])
    lo, hi = ITEMS[item]

    # المدة: نختار أقصر مدة تجعل السلعة في المتناول (سلوك واقعي)
    term = next((t for t in TERMS
                 if lo * (1 + MARGIN_RATE * (t / 12)) / t <= budget), TERMS[-1])
    term = random.choice([t for t in TERMS if t >= term]) if term != TERMS[-1] else term

    raw_amount = budget * term / (1 + MARGIN_RATE * (term / 12))
    amount = round(min(hi, max(lo, raw_amount)) / 500) * 500
    # بعد القَصّ على حدود السلعة نعيد الحساب ليبقى الاتساق تاماً
    installment = round(amount * (1 + MARGIN_RATE * (term / 12)) / term)

    # عبء الدين كما يراه البنك: من الراتب **المُصرَّح به**.
    # من يبالغ في التصريح يبدو أقل خطراً على الورق — وثقة الدخل هي ما يكشفه.
    dbr_declared = round((oblig + installment) / declared, 3)
    dbr_true = (oblig + installment) / salary        # الحقيقة (غير مرصودة للبنك)

    # ── الخطر الكامن: يقوم على العبء **الحقيقي** لا المُصرَّح ──
    # هنا جوهر القيمة: من بالغ في تصريحه يبدو مريحاً على الورق بينما
    # عبؤه الفعلي خانق. النموذج لا يرى dbr_true، لكنه يرى ثقة الدخل —
    # فيتعلّم أن يخصم من مصداقية العبء المُصرَّح كلما ضعفت الثقة.
    latent = (
        2.6 * min(dbr_true / 0.45, 1.6)       # عبء الدين الحقيقي — الأثقل
        + 1.5 * (1 - (credit - 300) / 600)    # ضعف التصنيف الائتماني
        + 0.9 * (1 - min(tenure / 96, 1))     # قِصر مدة التوظيف
        + 0.8 * (1 - conf["score"] / 100)     # ضعف توثيق الدخل ← الإشارة الجديدة
        + 0.6 * (1 - emp["stab"])             # هشاشة جهة العمل
        + random.gauss(0, 0.55)               # عوامل غير مرصودة + ضجيج
    )
    # حد ساما: تجاوز 45% يرفع الخطر بشدّة (لكن لا يحدّده حتمياً)
    if dbr_true > 0.45:
        latent += 1.4

    return {
        "_latent": latent,                        # يُحذف بعد معايرة النطاقات
        "رقم_الطلب": f"REQ-{1000+i}",
        "العمر": age,
        "المدينة": city,
        "جهة_العمل": emp_name,
        "مدة_التوظيف_شهر": tenure,
        "الراتب_الشهري": int(declared),          # المُصرَّح به — ما يراه البنك
        "الالتزامات_الشهرية": int(oblig),
        "التصنيف_الائتماني": credit,
        "نوع_السلعة": item,
        "مبلغ_التمويل": int(amount),
        "مدة_السداد_شهر": term,
        "القسط_الشهري_الجديد": int(installment),
        "نسبة_عبء_الدين": dbr_declared,           # كما يحتسبها البنك من المُصرَّح
        "نسبة_ثقة_الدخل": conf["score"],          # ← العمود الجديد
        "مستوى_الخطر": None,                      # يُملأ بعد المعايرة
    }, txns


def main() -> None:
    rows, samples = [], {}
    for i in range(N):
        row, txns = build_row(i)
        rows.append(row)
        if len(samples) < 12:                     # عيّنة كشوف حساب للعرض
            samples[row["رقم_الطلب"]] = txns

    # ── معايرة نطاقات الخطر بالمئينات ──
    # البنوك تعاير حدود التصنيف على توزيع محفظتها، لا على أرقام مطلقة.
    # الترتيب حسب الخطر الكامن (الذي يحوي ضجيجاً وعوامل غير مرصودة)،
    # فيبقى التعلّم ممكناً لكن غير كامل — لا تسريب ولا دقة زائفة.
    latents = sorted(r["_latent"] for r in rows)
    cut_low = latents[int(0.52 * len(latents))]   # أدنى 52% → منخفض
    cut_mid = latents[int(0.82 * len(latents))]   # التالي 30% → متوسط، الأعلى 18% → مرتفع
    for r in rows:
        L = r.pop("_latent")
        r["مستوى_الخطر"] = "منخفض" if L < cut_low else "متوسط" if L < cut_mid else "مرتفع"

    with open("tamweel_data.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)

    with open("transactions_sample.json", "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=1)

    from collections import Counter
    print(f"✅ وُلِّد {len(rows)} سجلاً")
    print("   توزيع الخطر:", dict(Counter(r["مستوى_الخطر"] for r in rows)))
    print("   سجلات DBR>45%:", sum(1 for r in rows if r["نسبة_عبء_الدين"] > 0.45))
    print(f"   عيّنة كشوف حساب: {len(samples)} طلب → transactions_sample.json")


if __name__ == "__main__":
    main()
