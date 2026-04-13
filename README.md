# نظام رفع ملفات العملاء - نسخة آمنة محدثة

هذا المشروع يحتوي على:
- صفحة عميل عامة لرفع الملفات (`index.html`)
- لوحة موظفة خاصة لعرض العملاء والملفات (`admin.html`)
- حماية بحيث قراءة البيانات والملفات محصورة على بريد الموظفة فقط

## الجديد في هذه النسخة
- اختيار المؤهل الدراسي من قائمة
- رفع الهوية كملف مطلوب
- رفع شهادة المؤهل كملف اختياري
- رفع مرفقات إضافية متعددة
- يظهر المؤهل في لوحة الموظفة

## كيف يعمل الأمان
- العميل يدخل بشكل **مجهول Anonymous** فقط من صفحة الرفع، لذلك يقدر يرفع ولا يقدر يقرأ البيانات.
- الموظفة تدخل بحساب **Email/Password**.
- قواعد Firestore وStorage تسمح بالقراءة فقط للبريد المحدد داخل القواعد.

## البريد الحالي للموظفة
`ethagemployee@gmail.com`

إذا أردت تغييره، عدّل نفس البريد في:
- `firebase-config.js`
- `firestore.rules`
- `storage.rules`

## التفعيل المطلوب في Firebase Console
- Authentication
  - فعّل **Anonymous**
  - فعّل **Email/Password**
  - أنشئ حساب الموظفة يدويًا من قسم Users
- Firestore Database
- Storage

## النشر
إذا كنت تستخدم Firebase CLI:
```bash
firebase login
firebase init
firebase deploy --only firestore:rules,storage
```

## التشغيل
استخدم Live Server أو أي استضافة ثابتة.

## الملفات
- `index.html` صفحة الرفع
- `admin.html` لوحة الموظفة
- `client.js` منطق الرفع
- `admin.js` منطق لوحة الموظفة
- `firebase-config.js` إعداد Firebase
- `firestore.rules` قواعد قاعدة البيانات
- `storage.rules` قواعد التخزين
