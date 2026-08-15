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
    retry: "Retry request",
    overviewErrorTitle: "Unable to load admin overview",
    overviewErrorDescription: "The admin overview could not be loaded. Please try again.",
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
    employees: "Employees",
    employeesDescription: "Manage staff profiles, department assignment, and account state from one operational table.",
    addEmployee: "Add employee",
    employeeDirectory: "Employee directory",
    employeeDirectoryDescription: "Admin-owned employee records with role, department, and access state.",
    loadingEmployees: "Loading employees",
    loadingEmployeesDescription: "Retrieving the staff directory, roles, and account state from the admin API.",
    profile: "Profile",
    role: "Role",
    department: "Department",
    actions: "Actions",
    edit: "Edit",
    suspend: "Suspend",
    reactivate: "Reactivate",
    activeStatus: "Active",
    suspendedStatus: "Suspended",
    employeeDetail: "Employee detail",
    employeeDetailDescription: "Performance, workload, risk, and activity for admin decisions.",
    editEmployee: "Edit employee",
    messageEmployee: "Message employee",
    about: "About",
    aboutDescription: "Identity, team, and admin details that stay stable across tabs.",
    team: "Team",
    startDate: "Start date",
    salary: "Salary",
    lastActivity: "Last activity",
    clientPortfolio: "Client portfolio",
    clientPortfolioDescription: "Revenue-bearing clients and pipeline-only leads, ordered by spend.",
    all: "All", leads: "Leads", highestSpend: "Highest spend", lowestSpend: "Lowest spend",
    sortClients: "Sort clients", totalProjects: "Total projects", openOrders: "Open orders", pendingOffers: "Pending offers",
    signedContracts: "Signed contracts", outstanding: "Outstanding", noClientsSegment: "No clients in this segment",
    adjustClientFilter: "Adjust the filter or sort to inspect another client segment.",
    loadingClients: "Loading clients", loadingClientsDescription: "Retrieving client portfolio health and spend data from the workspace API.",
    clientDetail: "Client detail", clientDetailDescription: "Account identity, collected business context, and operational relationship signals.",
    requests: "Requests", proposals: "Proposals", proposalRegister: "Proposal register", proposalRegisterDescription: "Current proposal rows, status, value, validity, and contract readiness.",
    status: "Status", clientRequest: "Client / request", creator: "Creator", services: "Services", proposalSent: "Sent", proposalResponse: "Response", proposalValidity: "Validity", proposalContract: "Contract", proposalsFilterDate: "Filter proposals by date", proposalsFilterValue: "Filter proposals by value", sentLast7: "Sent in last 7 days", sentLast30: "Sent in last 30 days", sentLast90: "Sent in last 90 days", noProposals: "No proposals match these filters", adjustProposalFilters: "Change the filters to inspect another proposal segment.", loadingProposals: "Loading proposals", loadingProposalsDescription: "Retrieving proposal register data from the workspace API.",
    requestPipeline: "Request pipeline", requestPipelineDescription: "Each row shows CRM state, value, follow-up discipline, and proposal or contract signals before project handoff.",
    allTypes: "All types", orders: "Orders", waitingApproval: "Waiting approval", stalled: "Stalled", filterRequestsDate: "Filter requests by date", filterRequestsValue: "Filter requests by value",
    allDates: "All dates", openedLast7: "Opened in last 7 days", openedLast30: "Opened in last 30 days", openedLast90: "Opened in last 90 days", allValues: "All values", under15k: "Under $15k", from15to30k: "$15k to $30k", from30to50k: "$30k to $50k", above50k: "$50k and above",
    loadingCrmRequests: "Loading CRM requests", loadingCrmRequestsDescription: "Retrieving live pipeline stages, proposal signals, and follow-up health from the admin API.", noRequests: "No requests match these filters", adjustRequestFilters: "Change the filters to inspect another pipeline segment.", request: "Request", stage: "Stage", source: "Source", estimatedValue: "Estimated value", lastContact: "Last contact", nextFollowUp: "Next follow-up", proposal: "Proposal", contract: "Contract", aging: "Aging", paidCampaign: "Paid campaign", website: "Website", referral: "Referral", whatsapp: "WhatsApp", platform: "Platform", draft: "Draft", sent: "Sent", approved: "Approved", revisionRequested: "Revision requested", rejected: "Rejected", notStarted: "Not started",

    employeeFormDescription: "Set employee identity and access. Team employees require a department.",
    fullName: "Full name", email: "Email", password: "Password", passwordReset: "Password reset",
    leavePassword: "Leave blank to keep current password", phoneWhatsapp: "Phone / WhatsApp",
    selectRole: "Select role", selectDepartment: "Select department", teamDepartmentDescription: "Team employees are assigned to one delivery department.",
    notApplicable: "Not applicable for this role", activeAccount: "Active account", suspendedDescription: "Suspended employees remain in the directory but lose access.",
    cancel: "Cancel", createEmployee: "Create employee", saveChanges: "Save changes",
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
    retry: "إعادة المحاولة",
    overviewErrorTitle: "تعذر تحميل نظرة الإدارة",
    overviewErrorDescription: "تعذر تحميل بيانات نظرة الإدارة. يرجى المحاولة مرة أخرى.",
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
    employees: "الموظفون",
    employeesDescription: "إدارة ملفات الموظفين وتوزيع الأقسام وحالة الحساب من جدول تشغيلي واحد.",
    addEmployee: "إضافة موظف",
    employeeDirectory: "دليل الموظفين",
    employeeDirectoryDescription: "سجلات الموظفين مع الأدوار والأقسام وحالة الوصول.",
    loadingEmployees: "جارٍ تحميل الموظفين",
    loadingEmployeesDescription: "جارٍ جلب دليل الموظفين والأدوار وحالة الحساب من واجهة الإدارة.",
    profile: "الملف الشخصي",
    role: "الدور",
    department: "القسم",
    actions: "الإجراءات",
    edit: "تعديل",
    suspend: "إيقاف",
    reactivate: "إعادة تفعيل",
    activeStatus: "نشط",
    suspendedStatus: "موقوف",
    employeeDetail: "تفاصيل الموظف",
    employeeDetailDescription: "الأداء وحجم العمل والمخاطر والنشاط المهم لقرارات الإدارة.",
    editEmployee: "تعديل الموظف",
    messageEmployee: "مراسلة الموظف",
    about: "حول الموظف",
    aboutDescription: "بيانات الهوية والفريق والإدارة الثابتة عبر علامات التبويب.",
    team: "الفريق",
    startDate: "تاريخ البدء",
    salary: "الراتب",
    lastActivity: "آخر نشاط",
    clientPortfolio: "محفظة العملاء",
    clientPortfolioDescription: "العملاء ذوو الإيرادات والعملاء المحتملون مرتبين حسب الإنفاق.",
    all: "الكل", leads: "عملاء محتملون", highestSpend: "الأعلى إنفاقًا", lowestSpend: "الأقل إنفاقًا",
    sortClients: "ترتيب العملاء", totalProjects: "إجمالي المشاريع", openOrders: "الطلبات المفتوحة", pendingOffers: "العروض المعلقة",
    signedContracts: "العقود الموقعة", outstanding: "المستحقات", noClientsSegment: "لا يوجد عملاء في هذا التصنيف",
    adjustClientFilter: "عدّل الفلتر أو الترتيب لاستعراض تصنيف آخر من العملاء.",
    loadingClients: "جارٍ تحميل العملاء", loadingClientsDescription: "جارٍ جلب حالة محفظة العملاء وبيانات الإنفاق من واجهة مساحة العمل.",
    clientDetail: "تفاصيل العميل", clientDetailDescription: "هوية الحساب وبيانات العمل وإشارات العلاقة التشغيلية.",
    requests: "الطلبات", proposals: "العروض", proposalRegister: "سجل العروض", proposalRegisterDescription: "العروض الحالية وحالاتها وقيمها وصلاحيتها واستعداد العقود.",
    status: "الحالة", clientRequest: "العميل / الطلب", creator: "المنشئ", services: "الخدمات", proposalSent: "تاريخ الإرسال", proposalResponse: "حالة الرد", proposalValidity: "مدة الصلاحية", proposalContract: "حالة العقد", proposalsFilterDate: "تصفية العروض حسب التاريخ", proposalsFilterValue: "تصفية العروض حسب القيمة", sentLast7: "أُرسل خلال آخر 7 أيام", sentLast30: "أُرسل خلال آخر 30 يومًا", sentLast90: "أُرسل خلال آخر 90 يومًا", noProposals: "لا توجد عروض تطابق هذه الفلاتر", adjustProposalFilters: "غيّر الفلاتر لاستعراض جزء آخر من العروض.", loadingProposals: "جارٍ تحميل العروض", loadingProposalsDescription: "جارٍ جلب سجل العروض من واجهة مساحة العمل.",
    requestPipeline: "مسار الطلبات", requestPipelineDescription: "يعرض كل صف حالة الطلب وقيمته والمتابعة وإشارات العرض أو العقد قبل تسليمه للتنفيذ.",
    allTypes: "كل الأنواع", orders: "الطلبات", waitingApproval: "بانتظار الموافقة", stalled: "متوقف", filterRequestsDate: "تصفية الطلبات حسب التاريخ", filterRequestsValue: "تصفية الطلبات حسب القيمة",
    allDates: "كل التواريخ", openedLast7: "فُتح خلال آخر 7 أيام", openedLast30: "فُتح خلال آخر 30 يومًا", openedLast90: "فُتح خلال آخر 90 يومًا", allValues: "كل القيم", under15k: "أقل من 15 ألفًا", from15to30k: "من 15 إلى 30 ألفًا", from30to50k: "من 30 إلى 50 ألفًا", above50k: "50 ألفًا فأكثر",
    loadingCrmRequests: "جارٍ تحميل طلبات إدارة العملاء", loadingCrmRequestsDescription: "جارٍ جلب مراحل المسار وإشارات العروض وصحة المتابعة من واجهة الإدارة.", noRequests: "لا توجد طلبات تطابق هذه الفلاتر", adjustRequestFilters: "غيّر الفلاتر لاستعراض جزء آخر من المسار.", request: "الطلب", stage: "المرحلة", source: "المصدر", estimatedValue: "القيمة التقديرية", lastContact: "آخر تواصل", nextFollowUp: "المتابعة التالية", proposal: "العرض", contract: "العقد", aging: "مدة الانتظار", paidCampaign: "حملة مدفوعة", website: "الموقع الإلكتروني", referral: "إحالة", whatsapp: "واتساب", platform: "المنصة", draft: "مسودة", sent: "مرسل", approved: "معتمد", revisionRequested: "مطلوب تعديل", rejected: "مرفوض", notStarted: "لم يبدأ",

    employeeFormDescription: "حدد هوية الموظف وصلاحياته. يجب تعيين قسم لموظفي الفريق.",
    fullName: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور", passwordReset: "إعادة تعيين كلمة المرور",
    leavePassword: "اتركه فارغًا للإبقاء على كلمة المرور الحالية", phoneWhatsapp: "الهاتف / واتساب",
    selectRole: "اختر الدور", selectDepartment: "اختر القسم", teamDepartmentDescription: "يتم تعيين موظفي الفريق إلى قسم تنفيذ واحد.",
    notApplicable: "غير متاح لهذا الدور", activeAccount: "حساب نشط", suspendedDescription: "يبقى الموظفون الموقوفون في الدليل لكن يفقدون صلاحية الوصول.",
    cancel: "إلغاء", createEmployee: "إنشاء موظف", saveChanges: "حفظ التغييرات",
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
  if (locale === "ar") {
    const activeProjectsMatch = value.match(/^(\d+) active projects$/);
    if (activeProjectsMatch) {
      const count = Number(activeProjectsMatch[1]);
      return `${activeProjectsMatch[1]} ${count === 1 ? "مشروع نشط" : "مشاريع نشطة"}`;
    }
    if (value === "No project yet") return "لا يوجد مشروع بعد";
    if (adminOverviewArabicOverrides[value]) {
      return adminOverviewArabicOverrides[value];
    }
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

const employeeArabicLabels: Record<string, string> = {
  Admin: "مدير النظام",
  "Project Manager": "مدير مشاريع",
  Sales: "مبيعات",
  Team: "فريق",
  Marketing: "تسويق",
  Accountant: "محاسب",
  Client: "عميل",
  Design: "تصميم",
  Content: "محتوى",
  Development: "تطوير",
  Production: "إنتاج",
  Active: "نشط",
  Suspended: "موقوف",
  "No session yet": "لا توجد جلسة بعد",
};

export function translateEmployeeLabel(locale: Locale, value: string) {
  return locale === "ar" ? employeeArabicLabels[value] ?? value : value;
}

const clientArabicLabels: Record<string, string> = {
  Client: "عميل",
  Lead: "عميل محتمل",
  Online: "متصل",
  "No client": "لا يوجد عميل",
};

export function translateClientLabel(locale: Locale, value: string) {
  return locale === "ar" ? clientArabicLabels[value] ?? value : value;
}

const requestArabicLabels: Record<string, string> = {
  Lead: "عميل محتمل", Order: "طلب", New: "جديد", "New Lead": "عميل محتمل جديد", Contacted: "تم التواصل", "Follow-up Attempt": "محاولة متابعة", "Meeting Scheduled": "تم تحديد اجتماع", "Meeting Completed": "تم عقد الاجتماع", "Proposal Sent": "تم إرسال العرض", "Negotiation / Follow-up": "تفاوض / متابعة", Negotiation: "تفاوض", "Proposal sent": "تم إرسال العرض", Approved: "معتمد", Rejected: "مرفوض", "Contract sent": "تم إرسال العقد", Signed: "موقّع", Active: "نشط", Cancelled: "ملغى", "Won (Contract Signed)": "تم الفوز (العقد موقّع)", "Paid campaign": "حملة مدفوعة", Website: "الموقع الإلكتروني", Referral: "إحالة", WhatsApp: "واتساب", Platform: "المنصة", Draft: "مسودة", Sent: "مرسل", "Revision requested": "مطلوب تعديل", "Not started": "لم يبدأ", "Waiting for CRM approval": "بانتظار موافقة إدارة العملاء", "Drafting contract package": "جارٍ إعداد حزمة العقد", "Not created": "لم يتم الإنشاء", "Validity not started": "لم تبدأ الصلاحية", "Not sent": "لم يتم الإرسال", SENT: "تم الإرسال", DRAFT: "مسودة", APPROVED: "معتمد", REJECTED: "مرفوض", "REVISION REQUESTED": "مطلوب تعديل", "Signed, awaiting project creation": "موقّع، بانتظار إنشاء المشروع", "1d in pipeline": "يوم واحد في المسار", "2d in current stage": "يومان في المرحلة الحالية", "6d in pipeline": "6 أيام في المسار", "Approval completed": "اكتملت الموافقة", "Follow-up overdue": "المتابعة متأخرة", "Fresh opportunity": "فرصة جديدة", "Proposal prep in progress": "جارٍ إعداد العرض", "Ready for conversion": "جاهز للتحويل",
};

export function translateRequestLabel(locale: Locale, value: string): string {
  if (locale !== "ar") return value;
  if (requestArabicLabels[value]) return requestArabicLabels[value];
  if (value.startsWith("Sent ")) return `تم الإرسال ${translateRequestLabel(locale, value.slice(5))}`;
  if (value.startsWith("Valid until ")) return `صالح حتى ${value.slice(11)}`;
  if (value === "Linked to contract") return "مرتبط بعقد";
  if (value === "Today") return "اليوم";
  if (value === "Yesterday") return "أمس";
  return value;
}

export function localizeOverviewChartLabel(locale: Locale, label: string) {
  if (locale !== "ar") return label;
  return label.replace(/\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b/g, (month) => chartMonthsAr[month] ?? month);
}

export function formatLocalizedDateRange(
  from: Date,
  to: Date,
  locale: Locale,
): string {
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  });
  return `${formatter.format(from)} ${locale === "ar" ? "إلى" : "to"} ${formatter.format(to)}`;
}

export function formatLocalizedNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(value);
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
