import { useMemo } from "react";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "hassad-locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

const commonMessages = {
  en: {
    adminOverview: "Admin overview",
    adminOverviewDescription: "CRM, delivery, and finance health for the latest operating window.",
    loadingAdminOverview: "Loading admin overview",
    loadingAdminOverviewDescription: "Retrieving KPI, finance, CRM, and delivery signals from the admin API.",
    revenue: "Revenue",
    activeClients: "Active clients",
    activeProjects: "Active projects",
    overdueTasks: "Overdue tasks",
    revenueDescription: "Paid invoice revenue in the selected period.",
    activeClientsDescription: "Clients with an active relationship.",
    activeProjectsKpiDescription: "Projects still under delivery control.",
    overdueTasksDescription: "Tasks that missed their due date.",
    paidInvoicesDescription: "Paid invoice revenue in the selected period.",
    paidInvoices: "Paid invoices",
    unpaidInvoices: "Unpaid invoices",
    activeContracts: "Active contracts",
    offersSent: "Offers sent",
    activeProjectValue: "Active project value",
    activeProjectValueDescription: "Total value under active execution for the selected period.",
    currentActiveProjectAmount: "Current active project amount",
    invoiceCashPosition: "Invoice cash position across the selected reporting window.",
    contractsOffersDescription: "CRM throughput between live contracts and outbound offers.",
    leadsAndOrders: "Leads and orders",
    leadsAndOrdersDescription: "Active CRM opportunities and follow-up quality in {period}.",
    topSalesManagers: "Top sales managers",
    topSalesManagersDescription: "Best CRM closers for {period}.",
    activeProjectsDescription: "Delivery state and workload across {period}.",
    clients: "Clients",
    clientsDescription: "Client portfolio activity in {period}.",
    client: "Client",
    type: "Type",
    pipeline: "Pipeline",
    calls: "Calls",
    meetings: "Meetings",
    projects: "Projects",
    owner: "Owner",
    nextAction: "Next action",
    value: "Value",
    manager: "Manager",
    deals: "Deals",
    contracts: "Contracts",
    project: "Project",
    state: "State",
    progress: "Progress",
    pm: "PM",
    tasks: "Tasks",
    total: "Total",
    active: "Active",
    lastSeen: "Last seen",
    balance: "Balance",
    order: "Order",
    lead: "Lead",
    dateRange: "Date range",
    dateRangeDescription: "Select the reporting window for every overview card.",
    range: "Range",
    last30Days: "Last 30 days",
    last6Months: "Last 6 months",
    last12Months: "Last 12 months",
    statePlanning: "Planning",
    statePendingActivation: "Pending activation",
    stateActive: "Active",
    stateOnHold: "On hold",
    stateAwaitingReview: "Awaiting review",
    stateNeedsRevision: "Needs revision",
    stateCompleted: "Completed",
    stateCancelled: "Cancelled",
    online: "Online",
    noSession: "No session yet",
  },
  ar: {
    adminOverview: "نظرة عامة على الإدارة",
    adminOverviewDescription: "ملخص الحالة التجارية والتنفيذية والمالية للفترة التشغيلية الأخيرة.",
    loadingAdminOverview: "جارٍ تحميل نظرة الإدارة",
    loadingAdminOverviewDescription: "جارٍ جلب مؤشرات الأداء والإشارات المالية والتجارية والتنفيذية.",
    revenue: "الإيرادات",
    activeClients: "العملاء النشطون",
    activeProjects: "المشاريع النشطة",
    overdueTasks: "المهام المتأخرة",
    revenueDescription: "إيرادات الفواتير المدفوعة خلال الفترة المحددة.",
    activeClientsDescription: "العملاء الذين لديهم علاقة نشطة.",
    activeProjectsKpiDescription: "المشاريع التي لا تزال قيد التنفيذ.",
    overdueTasksDescription: "المهام التي تجاوزت تاريخ استحقاقها.",
    paidInvoicesDescription: "إيرادات الفواتير المدفوعة خلال الفترة المحددة.",
    paidInvoices: "الفواتير المدفوعة",
    unpaidInvoices: "الفواتير غير المدفوعة",
    activeContracts: "العقود النشطة",
    offersSent: "العروض المرسلة",
    activeProjectValue: "قيمة المشاريع النشطة",
    activeProjectValueDescription: "إجمالي القيمة قيد التنفيذ خلال الفترة المحددة.",
    currentActiveProjectAmount: "القيمة الحالية للمشاريع النشطة",
    invoiceCashPosition: "الحالة النقدية للفواتير خلال الفترة المحددة.",
    contractsOffersDescription: "حركة العقود الحالية والعروض المرسلة في إدارة العملاء.",
    leadsAndOrders: "العملاء المحتملون والطلبات",
    leadsAndOrdersDescription: "الفرص التجارية النشطة وجودة المتابعة خلال {period}.",
    topSalesManagers: "أفضل مديري المبيعات",
    topSalesManagersDescription: "أفضل نتائج إغلاق الصفقات خلال {period}.",
    activeProjectsDescription: "حالة التنفيذ وحجم العمل خلال {period}.",
    clients: "العملاء",
    clientsDescription: "نشاط محفظة العملاء خلال {period}.",
    client: "العميل",
    type: "النوع",
    pipeline: "مسار المبيعات",
    calls: "المكالمات",
    meetings: "الاجتماعات",
    projects: "المشاريع",
    owner: "المسؤول",
    nextAction: "الإجراء التالي",
    value: "القيمة",
    manager: "المدير",
    deals: "الصفقات",
    contracts: "العقود",
    project: "المشروع",
    state: "الحالة",
    progress: "التقدم",
    pm: "مدير المشروع",
    tasks: "المهام",
    total: "الإجمالي",
    active: "النشطة",
    lastSeen: "آخر ظهور",
    balance: "الرصيد",
    order: "طلب",
    lead: "عميل محتمل",
    dateRange: "النطاق الزمني",
    dateRangeDescription: "حدد الفترة الزمنية لجميع بطاقات النظرة العامة.",
    range: "نطاق مخصص",
    last30Days: "آخر 30 يومًا",
    last6Months: "آخر 6 أشهر",
    last12Months: "آخر 12 شهرًا",
    statePlanning: "قيد التخطيط",
    statePendingActivation: "بانتظار التفعيل",
    stateActive: "نشط",
    stateOnHold: "متوقف مؤقتًا",
    stateAwaitingReview: "بانتظار المراجعة",
    stateNeedsRevision: "بحاجة إلى تعديل",
    stateCompleted: "مكتمل",
    stateCancelled: "ملغى",
    online: "متصل",
    noSession: "لا توجد جلسة بعد",
  },
} as const;

type MessageKey = keyof typeof commonMessages.en;

const adminOverviewArabicOverrides: Record<string, string> = {
  New: "جديد",
  "New Lead": "عميل محتمل جديد",
  Contacted: "تم التواصل",
  "Follow-up Attempt": "محاولة متابعة",
  "Meeting Scheduled": "تم تحديد الاجتماع",
  "Meeting Completed": "اكتمل الاجتماع",
  "Proposal Sent": "تم إرسال العرض",
  "Negotiation / Follow-up": "تفاوض / متابعة",
  Approved: "تمت الموافقة",
  "Won (Contract Signed)": "تم الفوز (تم توقيع العقد)",
  "Proposal sent": "تم إرسال العرض",
  Negotiation: "تفاوض",
  Rejected: "مرفوض",
  "Contract sent": "تم إرسال العقد",
  Signed: "موقّع",
  Failed: "فشل",
  Done: "مكتمل",
  Scheduled: "مجدول",
  "Finalize pricing objections before approval call.": "استكمال ملاحظات التسعير قبل مكالمة الموافقة.",
  "Review proposal feedback and prepare revision scope.": "مراجعة ملاحظات العرض وتجهيز نطاق التعديل.",
};

const adminOverviewText: Record<string, MessageKey> = {
  Revenue: "revenue",
  "Active clients": "activeClients",
  "Active projects": "activeProjects",
  "Overdue tasks": "overdueTasks",
  "Paid invoices": "paidInvoices",
  "Unpaid invoices": "unpaidInvoices",
  "Active contracts": "activeContracts",
  "Offers sent": "offersSent",
  "Active project value": "activeProjectValue",
  "Current active project amount": "currentActiveProjectAmount",
  "Total value under active execution for the selected period.": "activeProjectValueDescription",
  "Paid invoice revenue in the selected period.": "revenueDescription",
  "Clients with an active relationship.": "activeClientsDescription",
  "Projects still under delivery control.": "activeProjectsKpiDescription",
  "Tasks that missed their due date.": "overdueTasksDescription",
  Planning: "statePlanning",
  "Pending activation": "statePendingActivation",
  Active: "stateActive",
  "On hold": "stateOnHold",
  "Awaiting review": "stateAwaitingReview",
  "Needs revision": "stateNeedsRevision",
  Completed: "stateCompleted",
  Cancelled: "stateCancelled",
  Online: "online",
  "No session yet": "noSession",
};

export function translateAdminOverviewText(
  locale: Locale,
  value: string,
): string {
  if (locale === "ar" && adminOverviewArabicOverrides[value]) {
    return adminOverviewArabicOverrides[value];
  }
  const key = adminOverviewText[value];
  return key ? commonMessages[locale][key] ?? commonMessages.en[key] : value;
}

const chartMonthsAr: Record<string, string> = {
  Jan: "يناير",
  Feb: "فبراير",
  Mar: "مارس",
  Apr: "أبريل",
  May: "مايو",
  Jun: "يونيو",
  Jul: "يوليو",
  Aug: "أغسطس",
  Sep: "سبتمبر",
  Oct: "أكتوبر",
  Nov: "نوفمبر",
  Dec: "ديسمبر",
};

export function localizeOverviewChartLabel(locale: Locale, label: string) {
  if (locale !== "ar") return label;
  return label.replace(/\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b/g, (month) => chartMonthsAr[month] ?? month);
}

export function useTranslations() {
  // The root layout owns the locale and reloads after switching; this keeps
  // all overview components on the same server-resolved value.
  const locale = resolveLocale(
    typeof document === "undefined"
      ? DEFAULT_LOCALE
      : document.cookie
          .split("; ")
          .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
          ?.split("=")[1],
  );

  return useMemo(
    () => ({
      locale,
      t: (key: MessageKey, values?: Record<string, string>) => {
        let message: string = commonMessages[locale][key] ?? commonMessages.en[key];
        for (const [name, value] of Object.entries(values ?? {})) {
          message = message.replace(`{${name}}`, value);
        }
        return message;
      },
    }),
    [locale],
  );
}
