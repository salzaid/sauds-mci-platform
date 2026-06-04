import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ar";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    "nav.dashboard": "Dashboard",
    "nav.incidents": "Incidents",
    "nav.triage": "Triage",
    "nav.tracking": "Patient Tracking",
    "nav.orQueue": "OR Queue",
    "nav.resources": "Resources",
    "nav.transport": "Transport",
    "nav.icsForms": "ICS Forms",
    "nav.emtMds": "EMT MDS",
    "nav.aar": "After-Action Review",
    "nav.comms": "Communications",
    "nav.admin": "Admin",
    "nav.publicPortal": "Public Portal",
    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.submit": "Submit",
    "common.close": "Close",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.view": "View",
    "common.back": "Back",
    "common.next": "Next",
    "common.yes": "Yes",
    "common.no": "No",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.notes": "Notes",
    "common.date": "Date",
    "common.time": "Time",
    "common.name": "Name",
    "common.type": "Type",
    "common.facility": "Facility",
    "common.total": "Total",
    "common.available": "Available",
    "common.inUse": "In Use",
    "common.noData": "No data available",
    "common.required": "Required",
    "common.optional": "Optional",
    "common.confirm": "Confirm",
    "common.logout": "Logout",
    "common.profile": "Profile",
    "common.settings": "Settings",
    // Triage
    "triage.IMMEDIATE": "Immediate",
    "triage.DELAYED": "Delayed",
    "triage.MINIMAL": "Minimal",
    "triage.EXPECTANT": "Expectant",
    "triage.DECEASED": "Deceased",
    "triage.UNKNOWN": "Unknown",
    "triage.category": "Triage Category",
    "triage.algorithm": "Algorithm",
    "triage.SALT": "SALT",
    "triage.START": "START",
    "triage.JUMPSTART": "JumpSTART (Pediatric)",
    // Incident
    "incident.create": "Declare Incident",
    "incident.status.ACTIVATED": "Activated",
    "incident.status.ESCALATED": "Escalated",
    "incident.status.DEACTIVATED": "Deactivated",
    "incident.status.CLOSED": "Closed",
    "incident.severity.LOW": "Low",
    "incident.severity.MODERATE": "Moderate",
    "incident.severity.HIGH": "High",
    "incident.severity.CATASTROPHIC": "Catastrophic",
    // OR
    "or.status.PROPOSED": "Proposed",
    "or.status.SCHEDULED": "Scheduled",
    "or.status.IN_OR_PREP": "OR Prep",
    "or.status.INDUCTION": "Induction",
    "or.status.INCISION": "Incision",
    "or.status.CLOSURE": "Closure",
    "or.status.IN_PACU": "In PACU",
    "or.status.OUT_PACU": "Out of PACU",
    "or.status.COMPLETE": "Complete",
    "or.status.CANCELLED": "Cancelled",
    "or.status.ABORTED": "Aborted",
    // Roles
    "role.superadmin": "Super Admin",
    "role.admin": "Admin",
    "role.incident_commander": "Incident Commander",
    "role.clinician": "Clinician",
    "role.triage_officer": "Triage Officer",
    "role.logistics": "Logistics",
    "role.viewer": "Viewer",
    // Dashboard
    "dashboard.title": "Command Dashboard",
    "dashboard.activeIncidents": "Active Incidents",
    "dashboard.totalCasualties": "Total Casualties",
    "dashboard.immediate": "Immediate (Red)",
    "dashboard.orActive": "Active OR Cases",
    "dashboard.orPending": "Pending OR Cases",
  },
  ar: {
    // Nav
    "nav.dashboard": "لوحة القيادة",
    "nav.incidents": "الحوادث",
    "nav.triage": "الفرز",
    "nav.tracking": "تتبع المرضى",
    "nav.orQueue": "قائمة انتظار غرفة العمليات",
    "nav.resources": "الموارد",
    "nav.transport": "النقل",
    "nav.icsForms": "نماذج ICS",
    "nav.emtMds": "تقارير EMT MDS",
    "nav.aar": "مراجعة ما بعد الحادث",
    "nav.comms": "الاتصالات",
    "nav.admin": "الإدارة",
    "nav.publicPortal": "البوابة العامة",
    // Common
    "common.loading": "جارٍ التحميل...",
    "common.error": "حدث خطأ",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.create": "إنشاء",
    "common.submit": "إرسال",
    "common.close": "إغلاق",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.export": "تصدير",
    "common.view": "عرض",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.yes": "نعم",
    "common.no": "لا",
    "common.status": "الحالة",
    "common.actions": "الإجراءات",
    "common.notes": "ملاحظات",
    "common.date": "التاريخ",
    "common.time": "الوقت",
    "common.name": "الاسم",
    "common.type": "النوع",
    "common.facility": "المنشأة",
    "common.total": "الإجمالي",
    "common.available": "متاح",
    "common.inUse": "قيد الاستخدام",
    "common.noData": "لا توجد بيانات",
    "common.required": "مطلوب",
    "common.optional": "اختياري",
    "common.confirm": "تأكيد",
    "common.logout": "تسجيل الخروج",
    "common.profile": "الملف الشخصي",
    "common.settings": "الإعدادات",
    // Triage
    "triage.IMMEDIATE": "فوري (أحمر)",
    "triage.DELAYED": "مؤجل (أصفر)",
    "triage.MINIMAL": "بسيط (أخضر)",
    "triage.EXPECTANT": "محتضر (أسود)",
    "triage.DECEASED": "متوفى",
    "triage.UNKNOWN": "غير معروف",
    "triage.category": "فئة الفرز",
    "triage.algorithm": "خوارزمية الفرز",
    "triage.SALT": "SALT",
    "triage.START": "START",
    "triage.JUMPSTART": "JumpSTART (أطفال)",
    // Incident
    "incident.create": "الإعلان عن حادث",
    "incident.status.ACTIVATED": "مفعّل",
    "incident.status.ESCALATED": "متصاعد",
    "incident.status.DEACTIVATED": "معطّل",
    "incident.status.CLOSED": "مغلق",
    "incident.severity.LOW": "منخفض",
    "incident.severity.MODERATE": "متوسط",
    "incident.severity.HIGH": "عالٍ",
    "incident.severity.CATASTROPHIC": "كارثي",
    // OR
    "or.status.PROPOSED": "مقترح",
    "or.status.SCHEDULED": "مجدول",
    "or.status.IN_OR_PREP": "تحضير غرفة العمليات",
    "or.status.INDUCTION": "التخدير",
    "or.status.INCISION": "الشق الجراحي",
    "or.status.CLOSURE": "الإغلاق",
    "or.status.IN_PACU": "في غرفة الإفاقة",
    "or.status.OUT_PACU": "خارج غرفة الإفاقة",
    "or.status.COMPLETE": "مكتمل",
    "or.status.CANCELLED": "ملغى",
    "or.status.ABORTED": "موقوف",
    // Roles
    "role.superadmin": "مدير النظام",
    "role.admin": "مدير",
    "role.incident_commander": "قائد الحادث",
    "role.clinician": "طبيب سريري",
    "role.triage_officer": "ضابط الفرز",
    "role.logistics": "اللوجستيات",
    "role.viewer": "مشاهد",
    // Dashboard
    "dashboard.title": "لوحة قيادة القيادة",
    "dashboard.activeIncidents": "الحوادث النشطة",
    "dashboard.totalCasualties": "إجمالي الضحايا",
    "dashboard.immediate": "فوري (أحمر)",
    "dashboard.orActive": "عمليات جارية",
    "dashboard.orPending": "عمليات معلقة",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("mci_lang") as Lang) ?? "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("mci_lang", l);
  };

  const t = (key: string): string => {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
