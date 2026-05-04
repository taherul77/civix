"use client";

import { useApp } from "@/store/app-store";

export type Lang = "en" | "ar";

// Reverse-lookup dictionary: English literal -> Arabic.
// Strings not present here fall back to the original English (useful for
// technical standards like "ASTM C39", "SBC 304" which are kept as-is).
const ar: Record<string, string> = {
  // Brand
  "CiviXLab": "سيفي‌إكس‌لاب",
  "ISO 17025 · SAAC": "آيزو 17025 · ساك",
  "SBC 304 Compliant": "متوافق مع SBC 304",
  "SASO · GSO · ASTM": "ساسو · GSO · ASTM",

  // Sidebar groups
  "Operations": "العمليات",
  "Visualize": "العرض المرئي",
  "Lab": "المختبر",
  "Admin": "الإدارة",

  // Nav items
  "Dashboard": "لوحة التحكم",
  "Projects": "المشاريع",
  "Samples": "العينات",
  "Tests": "الاختبارات",
  "Review queue": "قائمة المراجعة",
  "Reports": "التقارير",
  "Calendar": "التقويم",
  "Sample map": "خريطة العينات",
  "Alerts": "التنبيهات",
  "Equipment": "المعدات",
  "Field (mobile)": "الحقل (جوال)",
  "Audit log": "سجل التدقيق",
  "Users": "المستخدمون",
  "Security": "الأمن",
  "Security & MFA": "الأمن والمصادقة الثنائية",
  "White-label": "العلامة البيضاء",
  "Billing": "الفوترة",
  "Settings": "الإعدادات",

  // Common verbs / buttons
  "New": "جديد",
  "Save": "حفظ",
  "Save changes": "حفظ التغييرات",
  "Save draft": "حفظ مسودة",
  "Cancel": "إلغاء",
  "Submit": "إرسال",
  "Submit for review": "إرسال للمراجعة",
  "Approve": "اعتماد",
  "Return for correction": "إرجاع للتصحيح",
  "Reject": "رفض",
  "Continue": "متابعة",
  "Back": "رجوع",
  "Edit": "تعديل",
  "Delete": "حذف",
  "Download": "تنزيل",
  "Download PDF": "تنزيل PDF",
  "Print": "طباعة",
  "Export": "تصدير",
  "Export CSV": "تصدير CSV",
  "Import": "استيراد",
  "View all": "عرض الكل",
  "View report": "عرض التقرير",
  "View report →": "عرض التقرير ←",
  "Mark all read": "تحديد الكل كمقروء",
  "Sign in": "تسجيل الدخول",
  "Sign out": "تسجيل الخروج",
  "Verify": "تحقق",
  "Re-enrol": "إعادة التسجيل",
  "Add": "إضافة",

  // Buttons specific
  "New test": "اختبار جديد",
  "New project": "مشروع جديد",
  "New sample": "عينة جديدة",
  "New invoice": "فاتورة جديدة",
  "Add user": "إضافة مستخدم",
  "Register equipment": "تسجيل معدة",
  "Start test": "بدء الاختبار",

  // Common nouns
  "Code": "الرمز",
  "Name": "الاسم",
  "Email": "البريد الإلكتروني",
  "Phone": "الهاتف",
  "Password": "كلمة المرور",
  "Role": "الدور",
  "Department": "القسم",
  "Project": "المشروع",
  "Sample": "العينة",
  "Test": "الاختبار",
  "Standard": "المعيار",
  "Date": "التاريخ",
  "Time": "الوقت",
  "Type": "النوع",
  "Status": "الحالة",
  "Result": "النتيجة",
  "Location": "الموقع",
  "Engineer": "المهندس",
  "Client": "العميل",
  "City": "المدينة",
  "Region": "المنطقة",
  "Description": "الوصف",
  "Notes": "ملاحظات",
  "Remarks": "تعليقات",
  "Action": "الإجراء",
  "Entity": "الكيان",
  "Entity ID": "معرف الكيان",
  "User": "المستخدم",
  "Tested by": "تم الاختبار بواسطة",
  "Reviewed by": "تمت المراجعة بواسطة",
  "Approved by": "اعتمد بواسطة",
  "Sampled by": "تم أخذ العينة بواسطة",
  "By": "بواسطة",
  "Timestamp": "الطابع الزمني",
  "Diff": "الفرق",
  "IP": "عنوان IP",
  "Manufacturer": "الصانع",
  "Model": "الموديل",
  "Serial": "الرقم التسلسلي",
  "Standards": "المعايير",
  "Project / Sample": "المشروع / العينة",
  "P/F": "نجاح/فشل",
  "Contract value": "قيمة العقد",

  // Status labels
  "Active": "نشط",
  "On hold": "معلق",
  "Completed": "مكتمل",
  "Pending": "قيد الانتظار",
  "In test": "قيد الاختبار",
  "In review": "قيد المراجعة",
  "Reviewed": "تمت المراجعة",
  "Approved": "معتمد",
  "Draft": "مسودة",
  "Out of service": "خارج الخدمة",
  "Cal. due": "معايرة",
  "PASS": "ناجح",
  "FAIL": "غير ناجح",
  "Calibration due": "معايرة قريبة",

  // Categories
  "Concrete": "خرسانة",
  "Soil": "تربة",
  "Aggregate": "ركام",
  "Asphalt": "إسفلت",
  "Steel": "حديد",
  "Cement": "أسمنت",
  "Masonry": "بناء",
  "Water": "مياه",
  "All": "الكل",
  "All types": "كل الأنواع",
  "All status": "كل الحالات",
  "All categories": "كل الفئات",
  "Saudi-specific": "خاص بالسعودية",

  // Topbar / search
  "Search something...": "ابحث عن شيء...",
  "Search by name, code, or standard…": "ابحث بالاسم أو الرمز أو المعيار...",
  "Search by code, name, or standard...": "ابحث بالرمز أو الاسم أو المعيار...",
  "Search by code or location...": "ابحث بالرمز أو الموقع...",
  "Search samples, tests, projects…": "ابحث في العينات والاختبارات والمشاريع...",
  "Search samples, tests, projects...": "ابحث في العينات والاختبارات والمشاريع...",
  "Search by user, entity, action...": "ابحث بالمستخدم أو الكيان أو الإجراء...",
  "Notifications": "الإشعارات",
  "Messages": "الرسائل",
  "Quick apps": "تطبيقات سريعة",
  "Toggle sidebar": "تبديل الشريط الجانبي",
  "Toggle theme": "تبديل المظهر",
  "Toggle language": "تبديل اللغة",

  // Page headers
  "Overview of laboratory activity, compliance, and equipment status.": "نظرة عامة على نشاط المختبر والامتثال وحالة المعدات.",
  "Active and completed projects across the laboratory.": "المشاريع النشطة والمكتملة في المختبر.",
  "All samples received with chain-of-custody tracking.": "جميع العينات المستلمة مع تتبع سلسلة العهدة.",
  "All test runs across projects with full traceability.": "جميع اختبارات المشاريع مع التتبع الكامل.",
  "Choose from the curated catalog of 75 tests for the Middle East.": "اختر من كتالوج 75 اختبارًا مخصصة للشرق الأوسط.",
  "Generated reports with digital signatures and verification QR codes.": "التقارير الصادرة مع التواقيع الرقمية ورموز التحقق.",
  "Equipment register, calibration tracking, and integration endpoints.": "سجل المعدات وتتبع المعايرة ونقاط التكامل.",
  "11 RBAC roles with ISO 17025 audit trail.": "11 دور صلاحيات مع سجل تدقيق ISO 17025.",
  "Users & roles": "المستخدمون والأدوار",
  "Tenant, preferences, security and integrations.": "المستأجر والتفضيلات والأمن والتكاملات.",
  "ISO 17025 §8.4 immutable audit trail. 7-year retention.": "سجل تدقيق ISO 17025 §8.4 غير قابل للتعديل. الاحتفاظ لمدة 7 سنوات.",
  "Upcoming tests, sampling visits and calibration due dates.": "الاختبارات وزيارات أخذ العينات وتواريخ المعايرة القادمة.",
  "GPS-tagged sample collection locations across Saudi Arabia.": "مواقع جمع العينات بإحداثيات GPS عبر المملكة العربية السعودية.",
  "Field-tech preview — capture sample with GPS, barcode and photo. Works offline.": "معاينة الميدان — التقط العينة مع GPS وباركود وصورة. يعمل دون اتصال.",
  "Customize branding, colors, headers and disclaimers per tenant.": "خصص العلامة والألوان والرؤوس والتنويهات لكل مستأجر.",
  "VAT e-invoicing (Phase 2) and government procurement integration.": "الفوترة الإلكترونية الضريبية (المرحلة 2) وتكامل المشتريات الحكومية.",
  "MFA enrolment, SSO providers, and access policies.": "تسجيل المصادقة الثنائية ومزودو SSO وسياسات الوصول.",
  "Quality Manager / Approver queue. Digital signatures lock the result.": "قائمة مدير الجودة / المعتمد. التواقيع الرقمية تقفل النتيجة.",

  // Dashboard KPIs
  "Tests today": "اختبارات اليوم",
  "Pending review": "قيد المراجعة",
  "Approved this month": "اعتمدت هذا الشهر",
  "Overdue calibrations": "معايرات متأخرة",
  "Monthly test volume": "حجم الاختبارات الشهري",
  "By category": "حسب الفئة",
  "Pass / fail by category": "النجاح/الفشل حسب الفئة",
  "Active projects": "المشاريع النشطة",
  "Recent tests": "أحدث الاختبارات",
  "Last 6 months": "آخر 6 أشهر",
  "Last 30 days": "آخر 30 يومًا",
  "This month": "هذا الشهر",
  "+12% vs yesterday": "+12% مقارنة بالأمس",
  "3 new": "3 جديدة",
  "+8.6% MoM": "+8.6% شهريًا",

  // Login page
  "Welcome back": "مرحبًا بعودتك",
  "Use any credentials — this is a demo build.": "استخدم أي بيانات — هذا إصدار تجريبي.",
  "Laboratory": "المختبر",
  "Multi-tenant lab testing for Saudi Arabia & the GCC.": "اختبار مختبرات متعدد المستأجرين للمملكة العربية السعودية ودول الخليج.",
  "By signing in you agree to the SAAC accreditation scope and ISO 17025 audit policy.": "بتسجيل الدخول فإنك توافق على نطاق اعتماد SAAC وسياسة تدقيق ISO 17025.",
  "Signing in…": "جارٍ تسجيل الدخول...",

  // Settings
  "Tenant": "المستأجر",
  "Appearance": "المظهر",
  "Standards & compliance": "المعايير والامتثال",
  "Theme": "المظهر",
  "Language": "اللغة",
  "Light": "فاتح",
  "Dark": "داكن",
  "English (LTR)": "الإنجليزية (LTR)",
  "Data & integrations": "البيانات والتكاملات",
  "Equipment integrations": "تكاملات المعدات",
  "ZATCA e-invoicing": "الفوترة الإلكترونية ZATCA",
  "Etimad": "اعتماد",
  "Data residency": "موقع البيانات",
  "MFA": "المصادقة الثنائية",
  "Session timeout": "انتهاء الجلسة",
  "Audit log retention": "احتفاظ سجل التدقيق",
  "SAML SSO": "SAML SSO",
  "Building code": "كود البناء",

  // Test form section labels
  "Specimen information": "معلومات العينة",
  "Geometry and identification": "الأبعاد والتعريف",
  "Loading & conditions": "التحميل والظروف",
  "Specifications": "المواصفات",
  "Three-specimen set": "مجموعة من ثلاث عينات",
  "Live results": "نتائج مباشرة",
  "Live evaluation": "تقييم مباشر",
  "Live monitoring": "مراقبة مباشرة",
  "Specimens vs design": "العينات مقابل التصميم",
  "Sampling information": "معلومات أخذ العينة",
  "Temperature readings": "قراءات الحرارة",
  "Environmental conditions": "الظروف البيئية",
  "Cooling measures": "وسائل التبريد",
  "Pass / fail": "نجاح / فشل",
  "Conformity assessment": "تقييم المطابقة",

  // Common verbs in tables
  "Filter": "تصفية",
  "View": "عرض",

  // Workflow
  "Created": "أُنشئ",
  "Submitted for review": "أُرسل للمراجعة",
  "Workflow": "سير العمل",
  "Test summary": "ملخص الاختبار",

  // Field (mobile)
  "Step": "الخطوة",
  "of": "من",
  "Pending sync": "بانتظار المزامنة",
  "Field-tech features": "ميزات فني الميدان",
  "Search": "بحث",

  // Misc tooltips on icons
  "Apps": "التطبيقات",
  "Profile": "الملف الشخصي",
  "Profile settings": "إعدادات الملف",
  "Translating": "جارٍ الترجمة",

  // Calendar legend
  "Calibration": "معايرة",
  "Sampling": "أخذ عينة",

  // Tests catalog
  "Saudi": "السعودية",
  "Coming soon": "قريبًا",
  "No tests match your filters.": "لا توجد اختبارات مطابقة للتصفية.",
  "Locations": "المواقع",

  // Security
  "Two-factor authentication": "المصادقة الثنائية",
  "SAML 2.0 SSO": "تسجيل دخول موحد SAML 2.0",
  "Access policies": "سياسات الوصول",
  "samples": "عينات",
  "Save offline": "حفظ دون اتصال",

  // Project / sample / equipment data
  "NEOM The Line — Module 4 Foundations": "ذا لاين نيوم — أساسات الوحدة 4",
  "Red Sea Coral Bloom — Resort Substructures": "البحر الأحمر كورال بلوم — هياكل المنتجع",
  "Qiddiya Speed Park — Pavement": "قدية سبيد بارك — رصف",
  "Diriyah Gate Heritage District": "بوابة الدرعية التراثية",

  // Clients
  "NEOM Co.": "شركة نيوم",
  "Red Sea Global": "البحر الأحمر العالمية",
  "Qiddiya Investment": "قدية للاستثمار",
  "Diriyah Company": "شركة الدرعية",

  // Cities
  "Tabuk": "تبوك",
  "Umluj": "أملج",
  "Riyadh": "الرياض",
  "Jeddah": "جدة",
  "Dammam": "الدمام",
  "Tabuk (NEOM)": "تبوك (نيوم)",
  "Umluj (Red Sea)": "أملج (البحر الأحمر)",
  "Riyadh (Qiddiya)": "الرياض (قدية)",
  "Diriyah": "الدرعية",

  // Engineers (mock data names)
  "Eng. Khalid Al-Otaibi": "م. خالد العتيبي",
  "Eng. Sarah Mansour": "م. سارة منصور",
  "Eng. Faisal Al-Shehri": "م. فيصل الشهري",
  "Eng. Layla Hashem": "م. ليلى هاشم",
  "Eng. Fahad": "م. فهد",
  "Eng. Sarah": "م. سارة",
  "Eng. Mansour": "م. منصور",
  "T. Ahmed": "ف. أحمد",
  "T. Yousef": "ف. يوسف",
  "T. Mahmoud": "ف. محمود",
  "T. Ali": "ف. علي",

  // Equipment / sample mock locations
  "Pile cap PC-14": "هامة الركيزة PC-14",
  "Slab S2-B": "بلاطة S2-B",
  "Mixing plant tank 3": "خزان محطة الخلط 3",
  "Borehole BH-08 @ 4.5m": "حفرة BH-08 على عمق 4.5 م",
  "Crusher stockpile A": "مخزون الكسارة A",
  "Plant batch B-217": "دفعة المحطة B-217",
  "Rebar bundle RB-118 (Ø20)": "حزمة حديد RB-118 (Ø20)",
  "Column CL-42": "عمود CL-42",
  "Cement silo 2": "صومعة الإسمنت 2",

  // Test names (commonly shown)
  "Compressive Strength of Concrete": "مقاومة الانضغاط للخرسانة",
  "Concrete Placement Temperature": "حرارة صب الخرسانة",
  "Potable Water Analysis": "تحليل مياه الشرب",
  "California Bearing Ratio": "نسبة تحمل كاليفورنيا",
  "Sieve Analysis (Coarse Aggregate)": "تحليل المنخل (ركام خشن)",
  "Marshall Stability & Flow": "ثبات وتدفق مارشال",
  "Tensile Test (Rebar Ø20)": "اختبار الشد (حديد Ø20)",
  "Cement Compressive Strength (Mortar)": "مقاومة انضغاط الإسمنت (مونة)",

  "d overdue": "يوم متأخر",
  "d remaining": "يوم متبقي",

  // Report labels
  "Test report": "تقرير اختبار",
  "Test date": "تاريخ الاختبار",
  "Test code": "رمز الاختبار",
  "Test method": "طريقة الاختبار",
  "Test name": "اسم الاختبار",
  "Project name": "اسم المشروع",
  "Project code": "رمز المشروع",
  "Project information": "معلومات المشروع",
  "Sample code": "رمز العينة",
  "Sample date": "تاريخ العينة",
  "Sample information": "معلومات العينة",
  "Technician": "خبير تقني",
  "Conditions": "الظروف",
  "Results": "النتائج",
  "Results pending — test in progress.": "النتائج معلّقة — الاختبار قيد التنفيذ.",
  "Conforms": "مطابق",
  "Does not conform": "غير مطابق",
  "Page": "صفحة",
  "Issue": "إصدار",
  "Rev.": "مراجعة",
  "Generated reports": "التقارير الصادرة",
  "Category": "الفئة",
  "Back to projects": "العودة إلى المشاريع",
  "Back to samples": "العودة إلى العينات",
  "Back to tests": "العودة إلى الاختبارات",
  "Back to test catalog": "العودة إلى كتالوج الاختبارات",
  "Back to equipment": "العودة إلى المعدات",
  "Calibration date": "تاريخ المعايرة",
  "Calibration status": "حالة المعايرة",
  "Tracked entries": "الإدخالات المسجّلة",
  "Algorithm": "الخوارزمية",
  "Chain integrity": "سلامة السلسلة",
  "Intact": "سليم",
  "Broken": "مكسور",
  "Recent readings": "أحدث القراءات",
  "Captured": "تاريخ الالتقاط",
  "Vendor": "المورد",
  "Final result": "النتيجة النهائية",
  "Note": "ملاحظة",
  "Integration": "التكامل",
  "S/N": "ر.ت",
  "ZATCA Phase 2 — Cryptographic Stamp Identifier": "المرحلة الثانية لزاتكا — معرّف الختم التشفيري",
  "Issue CSID": "إصدار CSID",
  "Expired": "منتهي",
  "Cleared": "تمت المعالجة",
  "Cleared at": "تاريخ المعالجة",
  "Invoice hash": "تجزئة الفاتورة",
  "TLV-decoded QR fields": "حقول رمز QR (TLV) المفكّكة",
  "Seller name": "اسم البائع",
  "Total (with VAT)": "الإجمالي (شامل ض.ق.م)",
  "Public key": "المفتاح العام",
  "Stamp": "الختم",
  "Signature": "التوقيع",

  // Equipment names
  "Compression Machine 3000 kN": "آلة انضغاط 3000 ك.ن",
  "Compression Machine 2000 kN": "آلة انضغاط 2000 ك.ن",
  "Universal Testing Machine 600 kN": "آلة اختبار شاملة 600 ك.ن",
  "Ignition Oven": "فرن الاشتعال",
  "Nuclear Density Gauge": "مقياس كثافة نووي",
  "pH / TDS Meter": "جهاز قياس pH / المواد الذائبة",

  // Settings extra
  "CR number": "رقم السجل التجاري",
  "VAT number": "الرقم الضريبي",
  "Subscription": "الاشتراك",
  "Enterprise (1,000 tests/month)": "المستوى المؤسسي (1000 اختبار/شهر)",
  "Enabled (TOTP)": "مفعّلة (TOTP)",
  "30 minutes": "30 دقيقة",
  "ISO 17025: 7 years": "ISO 17025: 7 سنوات",
  "Available": "متاح",
  "Phase 2 ready": "جاهز للمرحلة 2",
  "Configured": "تم الإعداد",

  // Review
  "Reviewer comments": "تعليقات المراجع",
  "Add your review notes (visible in audit log)...": "أضف ملاحظاتك (تظهر في سجل التدقيق)...",
  "Digital signature required": "يلزم توقيع رقمي",
  "Signed & locked": "موقّع ومقفل",
  "Sign with PKCS#12 certificate": "توقيع بشهادة PKCS#12",

  // Audit
  "Tamper-evident · SHA-256 chained": "مقاوم للتلاعب · مرتبط بـ SHA-256",
  "escalations route to Quality Manager.": "التصعيدات تُحول إلى مدير الجودة.",
  "Notifications & alerts": "الإشعارات والتنبيهات",

  // Billing
  "Billing — ZATCA & Etimad": "الفوترة — ZATCA و اعتماد",
  "Invoices YTD": "الفواتير منذ بداية السنة",
  "Revenue YTD (SAR)": "الإيرادات منذ بداية السنة (ر.س)",
  "ZATCA compliance": "الامتثال لـ ZATCA",
  "Recent invoices": "أحدث الفواتير",
  "Invoice": "الفاتورة",
  "Amount": "المبلغ",
  "VAT (15%)": "ضريبة القيمة المضافة (15%)",
  "ZATCA UUID": "معرف ZATCA",

  // Equipment stats
  "Total equipment": "إجمالي المعدات",
  "Active & calibrated": "نشط ومُعاير",
  "Calibration due ≤ 30d": "المعايرة خلال 30 يومًا",
  "unread": "غير مقروء",
  "View all messages": "عرض كل الرسائل",
};

export function tr(lang: Lang, en: string): string {
  if (lang === "en") return en;
  return ar[en] ?? en;
}

import { translateSync, useTranslationTick } from "@/lib/auto-translate";

/**
 * Hook: returns a translator function bound to current language.
 *
 *   tt("Active projects")   // → static dict if mapped, else auto-translated
 *
 * The component re-renders automatically when the auto-translate cache
 * gets a new entry, so cold strings update on next render.
 */
export function useT() {
  const lang = useApp((s) => s.lang);
  useTranslationTick();
  return (en: string) => {
    const dict = tr(lang, en);
    if (dict !== en) return dict;
    return translateSync(en, lang);
  };
}

// ----- Legacy keyed dict (kept for older t(lang, key) callsites) -----
export const dict = {
  en: {
    appName: "CiviXLab",
    tagline: "Civil Engineering Lab Testing — Saudi Arabia & GCC",
    dashboard: "Dashboard",
    projects: "Projects",
    samples: "Samples",
    tests: "Tests",
    reports: "Reports",
    equipment: "Equipment",
    users: "Users",
    settings: "Settings",
    review: "Review",
    calendar: "Calendar",
    map: "Map",
    notifications: "Notifications",
    field: "Field",
    audit: "Audit",
    security: "Security",
    "white-label": "White-label",
    billing: "Billing",
  },
  ar: {
    appName: "سيفي‌إكس‌لاب",
    tagline: "اختبار مختبرات الهندسة المدنية — المملكة العربية السعودية ودول الخليج",
    dashboard: "لوحة التحكم",
    projects: "المشاريع",
    samples: "العينات",
    tests: "الاختبارات",
    reports: "التقارير",
    equipment: "المعدات",
    users: "المستخدمون",
    settings: "الإعدادات",
    review: "المراجعة",
    calendar: "التقويم",
    map: "الخريطة",
    notifications: "الإشعارات",
    field: "الميدان",
    audit: "التدقيق",
    security: "الأمن",
    "white-label": "العلامة البيضاء",
    billing: "الفوترة",
  },
} as const;

export type DictKey = keyof typeof dict.en;

export function t(lang: Lang, key: DictKey): string {
  return dict[lang][key] ?? dict.en[key];
}
