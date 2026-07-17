# ============================================================
#  ثقة الدخل — التحقق من الراتب المُصرَّح به عبر كشف الحساب
# ============================================================
#  الفكرة: لا نصدّق الراتب المُصرَّح لمجرّد كتابته. نبحث في
#  الإيداعات عن نمط متكرّر (راتب فعلي)، ونقيس تطابقه مع المُصرَّح.
#
#  موظف حكومي: إيداعات ثابتة منتظمة → ثقة عالية.
#  صاحب عمل حر: إيداعات متفاوتة متقطّعة → ثقة منخفضة.
#  وهذه علاقة سببية حقيقية، لا رقم عشوائي.
# ============================================================

from statistics import mean

# عتبات التصنيف
STRONG, PARTIAL = 80, 50
MIN_RECURRING = 3          # أقل عدد إيداعات ليُعتبر نمطاً لا صدفة
CLUSTER_TOLERANCE = 0.08   # ±8% — إيداعات ضمنها تُعدّ من نفس المصدر


def _cluster_by_tolerance(amounts: list[float]) -> list[list[float]]:
    """
    يجمّع الإيداعات المتقاربة نسبياً (±8%).

    ملاحظة على التجميع بالسِلال الثابتة (round(amount/100)*100):
    إيداعان 6,249 و6,251 يقعان في سلّتين مختلفتين رغم تطابقهما عملياً،
    فينكسر النمط عند حدود السلّة ويُحتسب دخل منتظم كأنه غير مؤكد.
    التجميع بالتفاوت النسبي لا يعاني من هذا الأثر الحدّي.
    """
    clusters: list[list[float]] = []
    for a in sorted(amounts):
        for c in clusters:
            if abs(a - mean(c)) <= mean(c) * CLUSTER_TOLERANCE:
                c.append(a)
                break
        else:
            clusters.append([a])
    return clusters


def calculate_income_confidence(declared_salary: float, transactions: list[dict]) -> dict:
    """
    يعيد: score (0-100)، label، detected_income، deposits_count، evidence.
    كل رقم في evidence مشتقّ من الحساب — لا عبارة عامة.
    """
    credits = [t for t in transactions if t.get("type") == "credit"]
    amounts = [float(t["amount"]) for t in credits]

    if not amounts or not declared_salary:
        return {"score": 20, "label": "دخل غير مؤكد", "detected_income": None,
                "deposits_count": 0,
                "evidence": "لا توجد إيداعات كافية في كشف الحساب للتحقق من الدخل."}

    clusters = _cluster_by_tolerance(amounts)
    best = max(clusters, key=len)

    if len(best) < MIN_RECURRING:
        return {"score": 20, "label": "دخل غير مؤكد", "detected_income": None,
                "deposits_count": len(best),
                "evidence": f"لم نجد نمط إيداع متكرّر — أكبر تكرار {len(best)} إيداع فقط "
                            f"(نحتاج {MIN_RECURRING} على الأقل)."}

    detected = mean(best)
    match_ratio = min(detected, declared_salary) / max(detected, declared_salary)
    score = round(match_ratio * 100)
    label = ("دخل موثّق" if score >= STRONG
             else "دخل جزئي التحقق" if score >= PARTIAL
             else "دخل غير مؤكد")

    evidence = (f"تحققنا من {len(best)} إيداعات متكررة بمتوسط {round(detected):,} ريال شهرياً "
                f"— نسبة تطابق {score}% مع الراتب المُصرَّح به ({round(declared_salary):,} ريال).")

    return {"score": score, "label": label, "detected_income": round(detected),
            "deposits_count": len(best), "evidence": evidence}
