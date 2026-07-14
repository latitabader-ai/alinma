# Sharik Risk API — خادم تقييم المخاطر

API بلغة Python (FastAPI) يخدم نموذج **Random Forest** الحقيقي لتصنيف مخاطر طلبات التمويل (منخفض / متوسط / مرتفع). تستدعيه شاشة "طلب تمويل" في التطبيق فعلياً؛ وعند تعذّر الاتصال تعود الواجهة لمنطق تقييم محلي احتياطي.

## التشغيل
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
عند الإقلاع يُدرَّب النموذج من `../ml/tamweel_data.csv` (800 سجل) ويطبع دقّة الاختبار (~65.6%).

## نقاط النهاية
| Method | Path | الوصف |
|---|---|---|
| `GET` | `/health` | حالة الخدمة + دقّة النموذج |
| `POST` | `/assess` | تقييم طلب تمويل |

### مثال طلب
```bash
curl -X POST http://localhost:8000/assess \
  -H "Content-Type: application/json" \
  -d '{"item":"سيارة","amount":50000,"term":36,"salary":18000,"oblig":2000,"credit":780,"tenure":96,"emp":"حكومي","age":35}'
```

### مثال رد
```json
{
  "level": "low",
  "levelText": "منخفض",
  "confidence": 83,
  "installment": 1660,
  "dbr": 0.203,
  "modelAccuracy": 65.6,
  "importances": [{"name": "نسبة_عبء_الدين", "value": 29.7}, ...]
}
```

## ربط الواجهة
الواجهة تقرأ عنوان الـ API من متغيّر البيئة `VITE_API_URL` (افتراضياً `http://localhost:8000`).
عند النشر، اضبطي `VITE_API_URL` في إعدادات Netlify إلى عنوان الـ API المستضاف.
