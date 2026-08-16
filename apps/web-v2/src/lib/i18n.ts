import { useMemo } from "react";
import type { SupportedLocale } from "@hassad/shared";

export const LOCALES = ["en", "ar"] as const;
export type Locale = SupportedLocale;

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
    chat: "Chat",
    chatDescription:
      "Direct conversations between admin, employees, and clients.",
    chatWorkspaceDescription:
      "Direct conversations stay in one shared workspace and only create a thread after the first message is sent.",
    conversations: "Conversations",
    searchExistingOrStart:
      "Search existing conversations or start a new direct chat.",
    searchConversations: "Search conversations",
    direct: "Direct",
    groups: "Groups",
    newConversation: "New conversation",
    newDirectConversation: "New direct conversation",
    searchPeople: "Search people",
    searchPeopleDescription:
      "Search for an employee or client to start a direct conversation.",
    noPeopleFound: "No people found.",
    selectConversation: "Select a conversation",
    chooseConversationDescription:
      "Choose an existing conversation or start a new one.",
    noConversationSelected: "No conversation selected",
    selectConversationDescription:
      "Pick an existing conversation or search for a person to start one.",
    noMessagesYet: "No messages yet",
    sendFirstMessage: "Send the first message to start this conversation.",
    writeMessage: "Write a message...",
    attachFiles: "Attach files",
    sendMessage: "Send message",
    saveEdit: "Save edit",
    reply: "Reply",
    copy: "Copy",
    delete: "Delete",
    clear: "Clear",
    editingYourMessage: "Editing your message",
    backToConversations: "Back to conversations",
    previewRoute: "Preview route",
    edited: "Edited",
    deleted: "Deleted",
    noRecentActivity: "No recent activity",
    recentActivityUnavailable: "Recent activity unavailable",
    lastSeenAgo: "Last seen {time}",
    loadingConversations: "Loading conversations",
    loadingMessages: "Loading messages",
    replyingTo: "Replying to {name}",
    isTyping: "{name} is typing...",
    clientChatWillStart: "Client chat will start after the first message.",
    employeeChatWillStart: "Employee chat will start after the first message.",
    adminOverview: "Admin overview",
    adminOverviewDescription:
      "CRM, delivery, and finance health for the latest operating window.",
    loadingAdminOverview: "Loading admin overview",
    loadingAdminOverviewDescription:
      "Retrieving KPI, finance, CRM, and delivery signals from the admin API.",
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
    activeProjectValueDescription:
      "Total value under active execution for the selected period.",
    currentActiveProjectAmount: "Current active project amount",
    invoiceCashPosition:
      "Invoice cash position across the selected reporting window.",
    contractsOffersDescription:
      "CRM throughput between live contracts and outbound offers.",
    leadsAndOrders: "Leads and orders",
    leadsAndOrdersDescription:
      "Active CRM opportunities and follow-up quality in {period}.",
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
    dateRangeDescription:
      "Select the reporting window for every overview card.",
    range: "Range",
    retry: "Retry request",
    overviewErrorTitle: "Unable to load admin overview",
    overviewErrorDescription:
      "The admin overview could not be loaded. Please try again.",
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
    employeesDescription:
      "Manage staff profiles, department assignment, and account state from one operational table.",
    addEmployee: "Add employee",
    employeeDirectory: "Employee directory",
    employeeDirectoryDescription:
      "Admin-owned employee records with role, department, and access state.",
    loadingEmployees: "Loading employees",
    loadingEmployeesDescription:
      "Retrieving the staff directory, roles, and account state from the admin API.",
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
    employeeDetailDescription:
      "Performance, workload, risk, and activity for admin decisions.",
    editEmployee: "Edit employee",
    messageEmployee: "Message employee",
    about: "About",
    aboutDescription:
      "Identity, team, and admin details that stay stable across tabs.",
    team: "Team",
    startDate: "Start date",
    salary: "Salary",
    lastActivity: "Last activity",
    clientPortfolio: "Client portfolio",
    clientPortfolioDescription:
      "Revenue-bearing clients and pipeline-only leads, ordered by spend.",
    all: "All",
    leads: "Leads",
    highestSpend: "Highest spend",
    lowestSpend: "Lowest spend",
    sortClients: "Sort clients",
    totalProjects: "Total projects",
    openOrders: "Open orders",
    pendingOffers: "Pending offers",
    signedContracts: "Signed contracts",
    outstanding: "Outstanding",
    noClientsSegment: "No clients in this segment",
    adjustClientFilter:
      "Adjust the filter or sort to inspect another client segment.",
    loadingClients: "Loading clients",
    loadingClientsDescription:
      "Retrieving client portfolio health and spend data from the workspace API.",
    disputeDetail: "Dispute detail",
    disputeDetailDescription:
      "Approval state, evidence, PM handling, and client context needed to resolve the case.",
    caseDetails: "Case details",
    stableFactsReview:
      "Stable facts the admin needs while reviewing the dispute.",
    linkedRecordsDescription:
      "Jump directly to the client or project when deeper context is needed.",
    pmProfileDescription:
      "Admin context from this PM's historical dispute performance.",
    workflowDescription:
      "The actual dispute path from approval through client confirmation and closure.",
    waitingReview: "Waiting review",
    notResolved: "Not resolved",
    opened: "Opened",
    sla: "SLA",
    currentPm: "Current PM",
    reviewedBy: "Reviewed by",
    resolvedBy: "Resolved by",
    newPm: "New PM",
    linkedRecords: "Linked records",
    pmDisputeProfile: "PM dispute profile",
    caseWorkflow: "Case workflow",
    messages: "Messages",
    attachments: "Attachments",
    context: "Context",
    clientComplaint: "Client complaint",
    pmHandling: "PM handling",
    currentBlocker: "Current blocker",
    recommendedAdminAction: "Recommended admin action",
    adminActions: "Admin actions",
    disputeThreads: "Dispute threads",
    evidenceFiles: "Evidence and files",
    linkedTo: "Linked to",
    adminReadout: "Admin readout",
    adminReadoutDescription: "The shortest summary of risk, owner, and action.",
    clientExpectation: "Client expectation",
    commercialImpact: "Commercial impact",
    resolutionSummary: "Resolution summary",
    evidencePosition: "Evidence position",
    ticket: "Ticket",
    bestNextMove: "Best next move",
    disputeDetailLoading: "Loading dispute detail",
    disputeDetailLoadingDescription:
      "Loading dispute approval state, messages, and evidence.",
    disputes: "Disputes",
    resolutionQueue: "Resolution queue",
    resolutionQueueDescription:
      "Each row shows complaint ownership, dispute state, and whether admin action is needed.",
    searchDisputes: "Search ticket, client, project, PM, or category",
    searchDisputesLabel: "Search disputes",
    pendingApproval: "Pending approval",
    escalated: "Escalated",
    resolved: "Resolved",
    allCategories: "All categories",
    allPms: "All PMs",
    allActivity: "All activity",
    stale3: "Stale 3d+",
    stale7: "Stale 7d+",
    noDisputes: "No disputes match these filters",
    adjustDisputeFilters:
      "Change the filters to inspect another dispute segment.",
    loadingDisputes: "Loading disputes",
    loadingDisputesDescription:
      "Retrieving the current dispute queue from the admin API.",
    dispute: "Dispute",
    category: "Category",
    resolution: "Resolution",
    taskQueue: "Task queue",
    taskQueueDescription:
      "Every row shows workflow state, due risk, project period, and intervention signal before task detail.",
    searchTasks: "Search task, project, client, assignee, or period",
    searchTasksLabel: "Search tasks",
    allDepartments: "All departments",
    allStatuses: "All statuses",
    allPriorities: "All priorities",
    allDueDates: "All due dates",
    overdue: "Overdue",
    dueToday: "Due today",
    next7Days: "Next 7 days",
    allVisibility: "All visibility",
    clientVisible: "Client visible",
    internalOnly: "Internal only",
    noAssignee: "No assignee",
    visible: "Visible",
    internal: "Internal",
    noTasks: "No tasks match these filters",
    adjustTaskFilters:
      "Change the filters to inspect another operational segment.",
    loadingTasks: "Loading tasks",
    loadingTasksDescription:
      "Retrieving the latest task queue from the admin API.",
    openProject: "Open project",
    openClient: "Open client",
    task: "Task",
    assignee: "Assignee",
    due: "Due",
    signal: "Signal",
    taskDetail: "Task detail",
    taskDetailDescription:
      "Workflow progress, internal discussion, files, and department-specific execution context.",
    taskInfo: "Task info",
    taskInfoDescription: "Stable ownership and scheduling data for this task.",
    taskSignalDescription:
      "The main reason this task may need PM or admin attention.",
    taskWorkflowDescription:
      "Execution path from queue to approval, including revision loops",
    internalDiscussionTitle: "Internal discussion",
    clientContextTitle: "Client context",
    marketingStrategy: "Marketing strategy",
    revisionNote: "Revision note",
    campaigns: "Campaigns",
    campaignReadiness: "Campaign readiness",
    campaignInfo: "Campaign info",
    file: "File",
    clientTab: "Client",
    marketingTab: "Marketing",
    taskSignal: "Task signal",
    workflow: "Workflow",
    comments: "Comments",
    files: "Files",
    clientContext: "Client context",
    clientSignals: "Client signals",
    internalDiscussion: "Internal discussion",
    statusHistory: "Status history",
    purpose: "Purpose",
    uploaded: "Uploaded",
    by: "By",
    clientVisibility: "Client visibility",
    marketing: "Marketing",
    campaign: "Campaign",
    performance: "Performance",
    sentAt: "Sent at",
    approvedAt: "Approved at",
    budget: "Budget",
    spend: "Spend",
    wonPerformance: "Won performance",
    taskDetailLoading: "Loading task detail",
    taskDetailLoadingDescription:
      "Loading workflow, comments, files, and delivery context.",

    projectDetail: "Project detail",
    projectDetailDescription:
      "Periods, delivery load, finance checkpoints, disputes, and project administration.",
    projectsBack: "Projects",
    projectContext: "Project context",
    projectContextDescription:
      "Stable contract, ownership, and timeline details for admin decisions.",
    projectSummary: "Project summary",
    changePm: "Change PM",
    archiveProject: "Archive project",
    restoreProject: "Restore project",
    projectManager: "Project manager",
    model: "Model",
    departments: "Departments",
    contractValue: "Contract value",
    totalSignedAmount: "Total signed amount",
    remainingValue: "Remaining value",
    stillOpenFinance: "Still open in finance",
    openDisputes: "Open disputes",
    casesTiedDelivery: "Cases tied to delivery",
    overview: "Overview",
    periods: "Periods",
    finance: "Finance",
    history: "History",
    projectDetailLoading: "Loading project detail",
    projectDetailLoadingDescription:
      "Loading live project delivery, period, finance, and dispute data.",
    projectDetailErrorDescription:
      "This workspace now reads directly from the backend.",
    projectPortfolio: "Delivery portfolio",
    projectPortfolioDescription:
      "Each row shows delivery model, PM owner, active period, and workload or billing risk.",
    searchProjects: "Search project, client, PM, or team",
    searchProjectsLabel: "Search projects",
    needsAttention: "Needs attention",
    allDeliveryModels: "All delivery models",
    recurringRetainers: "Recurring retainers",
    oneOffProjects: "One-off projects",
    allTimelines: "All timelines",
    ending21: "Ending in 21 days",
    overdueBlocked: "Overdue or blocked",
    archivedOnly: "Archived only",
    sortProjects: "Sort projects",
    highestValue: "Highest value",
    newestStart: "Newest start date",
    endingSoon: "Ending soon",
    priority: "priority",
    loadingProjects: "Loading projects",
    loadingProjectsDescription:
      "Retrieving delivery portfolio, current period, and risk signals from the admin API.",
    noProjects: "No projects match these filters",
    adjustProjectFilters:
      "Change the search, status, model, or timeline filters to inspect another delivery segment.",
    projectState: "State",
    currentPeriod: "Current period",
    health: "Health",
    timeline: "Timeline",
    members: "members + PM",
    complete: "complete",
    remaining: "remaining",
    archived: "Archived",
    period: "Period",
    oneOffDelivery: "One-off delivery",
    noMonthlyPeriods: "No monthly periods",
    expired: "Expired",
    contractRegister: "Contract register",
    contractRegisterDescription:
      "Each row shows contract value, signing and activation state, renewal timing, invoice signal, and delivery linkage.",
    contractType: "Type",
    totalValue: "Total value",
    monthly: "Monthly",
    signed: "Signed",
    end: "End",
    renewal: "Renewal",
    invoices: "Invoices",
    filterContractsEndDate: "Filter contracts by end date",
    filterContractsValue: "Filter contracts by value",
    ending30: "Ending in 30 days",
    ending60: "Ending in 60 days",
    ending90: "Ending in 90 days",
    noContracts: "No contracts match these filters",
    adjustContractFilters:
      "Change the filters to inspect another contract segment.",
    loadingContracts: "Loading contracts",
    loadingContractsDescription:
      "Retrieving the contract register from the admin API.",
    clientDetail: "Client detail",
    clientDetailDescription:
      "Account identity, collected business context, and operational relationship signals.",
    requests: "Requests",
    proposals: "Proposals",
    proposalRegister: "Proposal register",
    proposalRegisterDescription:
      "Current proposal rows, status, value, validity, and contract readiness.",
    status: "Status",
    clientRequest: "Client / request",
    creator: "Creator",
    services: "Services",
    proposalSent: "Sent",
    proposalResponse: "Response",
    proposalValidity: "Validity",
    proposalContract: "Contract",
    proposalsFilterDate: "Filter proposals by date",
    proposalsFilterValue: "Filter proposals by value",
    sentLast7: "Sent in last 7 days",
    sentLast30: "Sent in last 30 days",
    sentLast90: "Sent in last 90 days",
    noProposals: "No proposals match these filters",
    adjustProposalFilters:
      "Change the filters to inspect another proposal segment.",
    loadingProposals: "Loading proposals",
    loadingProposalsDescription:
      "Retrieving proposal register data from the workspace API.",
    requestPipeline: "Request pipeline",
    requestPipelineDescription:
      "Each row shows CRM state, value, follow-up discipline, and proposal or contract signals before project handoff.",
    allTypes: "All types",
    orders: "Orders",
    waitingApproval: "Waiting approval",
    stalled: "Stalled",
    filterRequestsDate: "Filter requests by date",
    filterRequestsValue: "Filter requests by value",
    allDates: "All dates",
    openedLast7: "Opened in last 7 days",
    openedLast30: "Opened in last 30 days",
    openedLast90: "Opened in last 90 days",
    allValues: "All values",
    under15k: "Under $15k",
    from15to30k: "$15k to $30k",
    from30to50k: "$30k to $50k",
    above50k: "$50k and above",
    loadingCrmRequests: "Loading CRM requests",
    loadingCrmRequestsDescription:
      "Retrieving live pipeline stages, proposal signals, and follow-up health from the admin API.",
    noRequests: "No requests match these filters",
    adjustRequestFilters:
      "Change the filters to inspect another pipeline segment.",
    request: "Request",
    stage: "Stage",
    source: "Source",
    estimatedValue: "Estimated value",
    lastContact: "Last contact",
    nextFollowUp: "Next follow-up",
    proposal: "Proposal",
    contract: "Contract",
    aging: "Aging",
    paidCampaign: "Paid campaign",
    website: "Website",
    referral: "Referral",
    whatsapp: "WhatsApp",
    platform: "Platform",
    draft: "Draft",
    sent: "Sent",
    approved: "Approved",
    revisionRequested: "Revision requested",
    rejected: "Rejected",
    notStarted: "Not started",

    employeeFormDescription:
      "Set employee identity and access. Team employees require a department.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    passwordReset: "Password reset",
    leavePassword: "Leave blank to keep current password",
    phoneWhatsapp: "Phone / WhatsApp",
    selectRole: "Select role",
    selectDepartment: "Select department",
    teamDepartmentDescription:
      "Team employees are assigned to one delivery department.",
    notApplicable: "Not applicable for this role",
    activeAccount: "Active account",
    suspendedDescription:
      "Suspended employees remain in the directory but lose access.",
    cancel: "Cancel",
    createEmployee: "Create employee",
    saveChanges: "Save changes",
  },
  ar: {
    chat: "المحادثة",
    chatDescription: "محادثات مباشرة بين الإدارة والموظفين والعملاء.",
    chatWorkspaceDescription:
      "تبقى المحادثات المباشرة في مساحة مشتركة واحدة ولا يتم إنشاء سلسلة محادثة إلا بعد إرسال الرسالة الأولى.",
    conversations: "المحادثات",
    searchExistingOrStart:
      "ابحث في المحادثات الحالية أو ابدأ محادثة مباشرة جديدة.",
    searchConversations: "البحث في المحادثات",
    direct: "مباشرة",
    groups: "المجموعات",
    newConversation: "محادثة جديدة",
    newDirectConversation: "محادثة مباشرة جديدة",
    searchPeople: "البحث عن أشخاص",
    searchPeopleDescription: "ابحث عن موظف أو عميل لبدء محادثة مباشرة.",
    noPeopleFound: "لم يتم العثور على أشخاص.",
    selectConversation: "اختر محادثة",
    chooseConversationDescription: "اختر محادثة موجودة أو ابدأ محادثة جديدة.",
    noConversationSelected: "لم يتم اختيار محادثة",
    selectConversationDescription:
      "اختر محادثة موجودة أو ابحث عن شخص لبدء محادثة.",
    noMessagesYet: "لا توجد رسائل بعد",
    sendFirstMessage: "أرسل الرسالة الأولى لبدء هذه المحادثة.",
    writeMessage: "اكتب رسالة...",
    attachFiles: "إرفاق ملفات",
    sendMessage: "إرسال الرسالة",
    saveEdit: "حفظ التعديل",
    reply: "رد",
    copy: "نسخ",
    delete: "حذف",
    clear: "مسح",
    editingYourMessage: "تعديل رسالتك",
    backToConversations: "العودة إلى المحادثات",
    previewRoute: "مسار المعاينة",
    edited: "تم التعديل",
    deleted: "تم الحذف",
    noRecentActivity: "لا يوجد نشاط حديث",
    recentActivityUnavailable: "النشاط الأخير غير متاح",
    lastSeenAgo: "آخر ظهور {time}",
    loadingConversations: "جارٍ تحميل المحادثات",
    loadingMessages: "جارٍ تحميل الرسائل",
    replyingTo: "الرد على {name}",
    isTyping: "{name} يكتب الآن...",
    clientChatWillStart: "ستبدأ محادثة العميل بعد إرسال الرسالة الأولى.",
    employeeChatWillStart: "ستبدأ محادثة الموظف بعد إرسال الرسالة الأولى.",
    adminOverview: "نظرة عامة على الإدارة",
    adminOverviewDescription:
      "ملخص الحالة التجارية والتنفيذية والمالية للفترة التشغيلية الأخيرة.",
    loadingAdminOverview: "جارٍ تحميل نظرة الإدارة",
    loadingAdminOverviewDescription:
      "جارٍ جلب مؤشرات الأداء والإشارات المالية والتجارية والتنفيذية.",
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
    activeProjectValueDescription:
      "إجمالي القيمة قيد التنفيذ خلال الفترة المحددة.",
    currentActiveProjectAmount: "القيمة الحالية للمشاريع النشطة",
    invoiceCashPosition: "الحالة النقدية للفواتير خلال الفترة المحددة.",
    contractsOffersDescription:
      "حركة العقود الحالية والعروض المرسلة في إدارة العملاء.",
    leadsAndOrders: "العملاء المحتملون والطلبات",
    leadsAndOrdersDescription:
      "الفرص التجارية النشطة وجودة المتابعة خلال {period}.",
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
    overviewErrorDescription:
      "تعذر تحميل بيانات نظرة الإدارة. يرجى المحاولة مرة أخرى.",
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
    employeesDescription:
      "إدارة ملفات الموظفين وتوزيع الأقسام وحالة الحساب من جدول تشغيلي واحد.",
    addEmployee: "إضافة موظف",
    employeeDirectory: "دليل الموظفين",
    employeeDirectoryDescription:
      "سجلات الموظفين مع الأدوار والأقسام وحالة الوصول.",
    loadingEmployees: "جارٍ تحميل الموظفين",
    loadingEmployeesDescription:
      "جارٍ جلب دليل الموظفين والأدوار وحالة الحساب من واجهة الإدارة.",
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
    employeeDetailDescription:
      "الأداء وحجم العمل والمخاطر والنشاط المهم لقرارات الإدارة.",
    editEmployee: "تعديل الموظف",
    messageEmployee: "مراسلة الموظف",
    about: "حول الموظف",
    aboutDescription:
      "بيانات الهوية والفريق والإدارة الثابتة عبر علامات التبويب.",
    team: "الفريق",
    startDate: "تاريخ البدء",
    salary: "الراتب",
    lastActivity: "آخر نشاط",
    clientPortfolio: "محفظة العملاء",
    clientPortfolioDescription:
      "العملاء ذوو الإيرادات والعملاء المحتملون مرتبين حسب الإنفاق.",
    all: "الكل",
    leads: "عملاء محتملون",
    highestSpend: "الأعلى إنفاقًا",
    lowestSpend: "الأقل إنفاقًا",
    sortClients: "ترتيب العملاء",
    totalProjects: "إجمالي المشاريع",
    openOrders: "الطلبات المفتوحة",
    pendingOffers: "العروض المعلقة",
    signedContracts: "العقود الموقعة",
    outstanding: "المستحقات",
    noClientsSegment: "لا يوجد عملاء في هذا التصنيف",
    adjustClientFilter: "عدّل الفلتر أو الترتيب لاستعراض تصنيف آخر من العملاء.",
    loadingClients: "جارٍ تحميل العملاء",
    loadingClientsDescription:
      "جارٍ جلب حالة محفظة العملاء وبيانات الإنفاق من واجهة مساحة العمل.",
    disputeDetail: "تفاصيل النزاع",
    disputeDetailDescription:
      "حالة الموافقة والأدلة ومعالجة مدير المشروع وسياق العميل اللازم لتسوية الحالة.",
    caseDetails: "تفاصيل الحالة",
    stableFactsReview:
      "الحقائق الثابتة التي يحتاجها المسؤول أثناء مراجعة النزاع.",
    linkedRecordsDescription:
      "انتقل مباشرة إلى العميل أو المشروع عند الحاجة إلى سياق أعمق.",
    pmProfileDescription: "سياق إداري من سجل أداء مدير المشروع في النزاعات.",
    workflowDescription:
      "المسار الفعلي للنزاع من الموافقة إلى تأكيد العميل والإغلاق.",
    waitingReview: "بانتظار المراجعة",
    notResolved: "لم تتم التسوية",
    opened: "تاريخ الفتح",
    sla: "اتفاقية مستوى الخدمة",
    currentPm: "مدير المشروع الحالي",
    reviewedBy: "تمت المراجعة بواسطة",
    resolvedBy: "تمت التسوية بواسطة",
    newPm: "مدير المشروع الجديد",
    linkedRecords: "السجلات المرتبطة",
    pmDisputeProfile: "ملف نزاع مدير المشروع",
    caseWorkflow: "سير عمل الحالة",
    messages: "الرسائل",
    attachments: "المرفقات",
    context: "السياق",
    clientComplaint: "شكوى العميل",
    pmHandling: "معالجة مدير المشروع",
    currentBlocker: "العائق الحالي",
    recommendedAdminAction: "الإجراء الإداري المقترح",
    adminActions: "الإجراءات الإدارية",
    disputeThreads: "محادثات النزاع",
    evidenceFiles: "الأدلة والملفات",
    linkedTo: "مرتبط بـ",
    adminReadout: "الملخص الإداري",
    adminReadoutDescription: "أقصر ملخص للمخاطر والمسؤول والإجراء.",
    clientExpectation: "توقعات العميل",
    commercialImpact: "الأثر التجاري",
    resolutionSummary: "ملخص التسوية",
    evidencePosition: "حالة الأدلة",
    ticket: "التذكرة",
    bestNextMove: "الخطوة التالية الأفضل",
    disputeDetailLoading: "جارٍ تحميل تفاصيل النزاع",
    disputeDetailLoadingDescription:
      "جارٍ تحميل حالة الموافقة والرسائل والأدلة.",
    disputes: "النزاعات",
    resolutionQueue: "قائمة التسويات",
    resolutionQueueDescription:
      "يعرض كل صف ملكية الشكوى وحالة النزاع وما إذا كان يحتاج إلى إجراء إداري.",
    searchDisputes: "ابحث عن تذكرة أو عميل أو مشروع أو مدير مشروع أو تصنيف",
    searchDisputesLabel: "البحث في النزاعات",
    pendingApproval: "بانتظار الموافقة",
    escalated: "مصعّد",
    resolved: "تمت التسوية",
    allCategories: "كل التصنيفات",
    allPms: "كل مديري المشاريع",
    allActivity: "كل الأنشطة",
    stale3: "قديم 3 أيام فأكثر",
    stale7: "قديم 7 أيام فأكثر",
    noDisputes: "لا توجد نزاعات تطابق هذه الفلاتر",
    adjustDisputeFilters: "غيّر الفلاتر لاستعراض جزء آخر من النزاعات.",
    loadingDisputes: "جارٍ تحميل النزاعات",
    loadingDisputesDescription:
      "جارٍ جلب قائمة النزاعات الحالية من واجهة الإدارة.",
    dispute: "النزاع",
    category: "التصنيف",
    resolution: "التسوية",
    taskQueue: "قائمة المهام",
    taskQueueDescription:
      "يعرض كل صف حالة سير العمل ومخاطر الاستحقاق وفترة المشروع وإشارة التدخل.",
    searchTasks: "ابحث عن مهمة أو مشروع أو عميل أو مسؤول أو فترة",
    searchTasksLabel: "البحث في المهام",
    allDepartments: "كل الأقسام",
    allStatuses: "كل الحالات",
    allPriorities: "كل الأولويات",
    allDueDates: "كل تواريخ الاستحقاق",
    overdue: "متأخرة",
    dueToday: "مستحقة اليوم",
    next7Days: "خلال 7 أيام",
    allVisibility: "كل مستويات الظهور",
    clientVisible: "ظاهرة للعميل",
    internalOnly: "داخلية فقط",
    noAssignee: "لا يوجد مسؤول",
    visible: "ظاهرة",
    internal: "داخلية",
    noTasks: "لا توجد مهام تطابق هذه الفلاتر",
    adjustTaskFilters: "غيّر الفلاتر لاستعراض جزء آخر من المهام.",
    loadingTasks: "جارٍ تحميل المهام",
    loadingTasksDescription: "جارٍ جلب أحدث قائمة مهام من واجهة الإدارة.",
    openProject: "فتح المشروع",
    openClient: "فتح العميل",
    task: "المهمة",
    assignee: "المسؤول",
    due: "الاستحقاق",
    signal: "الإشارة",
    taskDetail: "تفاصيل المهمة",
    taskDetailDescription:
      "تقدم سير العمل والنقاش الداخلي والملفات وسياق التنفيذ الخاص بالقسم.",
    taskInfo: "معلومات المهمة",
    taskInfoDescription: "بيانات الملكية والجدولة الثابتة لهذه المهمة.",
    taskSignalDescription:
      "السبب الرئيسي الذي قد يتطلب انتباه مدير المشروع أو المسؤول.",
    taskWorkflowDescription:
      "مسار التنفيذ من القائمة إلى الاعتماد، بما في ذلك حلقات التعديل",
    internalDiscussionTitle: "النقاش الداخلي",
    clientContextTitle: "سياق العميل",
    marketingStrategy: "الاستراتيجية التسويقية",
    revisionNote: "ملاحظة التعديل",
    campaigns: "الحملات",
    campaignReadiness: "جاهزية الحملة",
    campaignInfo: "معلومات الحملة",
    file: "الملف",
    clientTab: "العميل",
    marketingTab: "التسويق",
    taskSignal: "إشارة المهمة",
    workflow: "سير العمل",
    comments: "التعليقات",
    files: "الملفات",
    clientContext: "سياق العميل",
    clientSignals: "إشارات العميل",
    internalDiscussion: "النقاش الداخلي",
    statusHistory: "سجل الحالة",
    purpose: "الغرض",
    uploaded: "تاريخ الرفع",
    by: "بواسطة",
    clientVisibility: "ظهور العميل",
    marketing: "التسويق",
    campaign: "الحملة",
    performance: "الأداء",
    sentAt: "تاريخ الإرسال",
    approvedAt: "تاريخ الاعتماد",
    budget: "الميزانية",
    spend: "الإنفاق",
    wonPerformance: "الأداء المحقق",
    taskDetailLoading: "جارٍ تحميل تفاصيل المهمة",
    taskDetailLoadingDescription:
      "جارٍ تحميل سير العمل والتعليقات والملفات وسياق التنفيذ.",

    projectDetail: "تفاصيل المشروع",
    projectDetailDescription:
      "الفترات وحجم التنفيذ ونقاط التحقق المالية والنزاعات وإدارة المشروع.",
    projectsBack: "المشاريع",
    projectContext: "سياق المشروع",
    projectContextDescription:
      "تفاصيل العقد والملكية والجدول الزمني لاتخاذ القرارات الإدارية.",
    projectSummary: "ملخص المشروع",
    changePm: "تغيير مدير المشروع",
    archiveProject: "أرشفة المشروع",
    restoreProject: "استعادة المشروع",
    projectManager: "مدير المشروع",
    model: "النموذج",
    departments: "الأقسام",
    contractValue: "قيمة العقد",
    totalSignedAmount: "إجمالي المبلغ الموقّع",
    remainingValue: "القيمة المتبقية",
    stillOpenFinance: "لا تزال مفتوحة ماليًا",
    openDisputes: "النزاعات المفتوحة",
    casesTiedDelivery: "حالات مرتبطة بالتنفيذ",
    overview: "نظرة عامة",
    periods: "الفترات",
    finance: "المالية",
    history: "السجل",
    projectDetailLoading: "جارٍ تحميل تفاصيل المشروع",
    projectDetailLoadingDescription:
      "جارٍ تحميل بيانات التنفيذ والفترات والمالية والنزاعات من الخادم.",
    projectDetailErrorDescription:
      "تقرأ مساحة العمل هذه بياناتها مباشرة من الخادم.",
    projectPortfolio: "محفظة التنفيذ",
    projectPortfolioDescription:
      "يعرض كل صف نموذج التنفيذ ومدير المشروع والفترة الحالية ومخاطر العمل أو الفوترة.",
    searchProjects: "ابحث عن مشروع أو عميل أو مدير مشروع أو فريق",
    searchProjectsLabel: "البحث في المشاريع",
    needsAttention: "بحاجة إلى انتباه",
    allDeliveryModels: "كل نماذج التنفيذ",
    recurringRetainers: "اشتراكات متكررة",
    oneOffProjects: "مشاريع لمرة واحدة",
    allTimelines: "كل الجداول الزمنية",
    ending21: "ينتهي خلال 21 يومًا",
    overdueBlocked: "متأخر أو متعطل",
    archivedOnly: "المؤرشفة فقط",
    sortProjects: "ترتيب المشاريع",
    highestValue: "الأعلى قيمة",
    newestStart: "أحدث تاريخ بدء",
    endingSoon: "ينتهي قريبًا",
    priority: "الأولوية",
    loadingProjects: "جارٍ تحميل المشاريع",
    loadingProjectsDescription:
      "جارٍ جلب محفظة التنفيذ والفترة الحالية وإشارات المخاطر من واجهة الإدارة.",
    noProjects: "لا توجد مشاريع تطابق هذه الفلاتر",
    adjustProjectFilters:
      "غيّر البحث أو الحالة أو النموذج أو الجدول الزمني لاستعراض جزء آخر من التنفيذ.",
    projectState: "الحالة",
    currentPeriod: "الفترة الحالية",
    health: "الصحة",
    timeline: "الجدول الزمني",
    members: "أعضاء + مدير المشروع",
    complete: "مكتمل",
    remaining: "متبقٍ",
    archived: "مؤرشف",
    period: "الفترة",
    oneOffDelivery: "تنفيذ لمرة واحدة",
    noMonthlyPeriods: "لا توجد فترات شهرية",
    expired: "منتهي",
    contractRegister: "سجل العقود",
    contractRegisterDescription:
      "يعرض كل صف قيمة العقد وحالة التوقيع والتفعيل والتجديد والفواتير وربط التنفيذ.",
    contractType: "النوع",
    totalValue: "إجمالي القيمة",
    monthly: "شهري",
    signed: "التوقيع",
    end: "النهاية",
    renewal: "التجديد",
    invoices: "الفواتير",
    filterContractsEndDate: "تصفية العقود حسب تاريخ الانتهاء",
    filterContractsValue: "تصفية العقود حسب القيمة",
    ending30: "ينتهي خلال 30 يومًا",
    ending60: "ينتهي خلال 60 يومًا",
    ending90: "ينتهي خلال 90 يومًا",
    noContracts: "لا توجد عقود تطابق هذه الفلاتر",
    adjustContractFilters: "غيّر الفلاتر لاستعراض جزء آخر من العقود.",
    loadingContracts: "جارٍ تحميل العقود",
    loadingContractsDescription: "جارٍ جلب سجل العقود من واجهة الإدارة.",
    clientDetail: "تفاصيل العميل",
    clientDetailDescription:
      "هوية الحساب وبيانات العمل وإشارات العلاقة التشغيلية.",
    requests: "الطلبات",
    proposals: "العروض",
    proposalRegister: "سجل العروض",
    proposalRegisterDescription:
      "العروض الحالية وحالاتها وقيمها وصلاحيتها واستعداد العقود.",
    status: "الحالة",
    clientRequest: "العميل / الطلب",
    creator: "المنشئ",
    services: "الخدمات",
    proposalSent: "تاريخ الإرسال",
    proposalResponse: "حالة الرد",
    proposalValidity: "مدة الصلاحية",
    proposalContract: "حالة العقد",
    proposalsFilterDate: "تصفية العروض حسب التاريخ",
    proposalsFilterValue: "تصفية العروض حسب القيمة",
    sentLast7: "أُرسل خلال آخر 7 أيام",
    sentLast30: "أُرسل خلال آخر 30 يومًا",
    sentLast90: "أُرسل خلال آخر 90 يومًا",
    noProposals: "لا توجد عروض تطابق هذه الفلاتر",
    adjustProposalFilters: "غيّر الفلاتر لاستعراض جزء آخر من العروض.",
    loadingProposals: "جارٍ تحميل العروض",
    loadingProposalsDescription: "جارٍ جلب سجل العروض من واجهة مساحة العمل.",
    requestPipeline: "مسار الطلبات",
    requestPipelineDescription:
      "يعرض كل صف حالة الطلب وقيمته والمتابعة وإشارات العرض أو العقد قبل تسليمه للتنفيذ.",
    allTypes: "كل الأنواع",
    orders: "الطلبات",
    waitingApproval: "بانتظار الموافقة",
    stalled: "متوقف",
    filterRequestsDate: "تصفية الطلبات حسب التاريخ",
    filterRequestsValue: "تصفية الطلبات حسب القيمة",
    allDates: "كل التواريخ",
    openedLast7: "فُتح خلال آخر 7 أيام",
    openedLast30: "فُتح خلال آخر 30 يومًا",
    openedLast90: "فُتح خلال آخر 90 يومًا",
    allValues: "كل القيم",
    under15k: "أقل من 15 ألفًا",
    from15to30k: "من 15 إلى 30 ألفًا",
    from30to50k: "من 30 إلى 50 ألفًا",
    above50k: "50 ألفًا فأكثر",
    loadingCrmRequests: "جارٍ تحميل طلبات إدارة العملاء",
    loadingCrmRequestsDescription:
      "جارٍ جلب مراحل المسار وإشارات العروض وصحة المتابعة من واجهة الإدارة.",
    noRequests: "لا توجد طلبات تطابق هذه الفلاتر",
    adjustRequestFilters: "غيّر الفلاتر لاستعراض جزء آخر من المسار.",
    request: "الطلب",
    stage: "المرحلة",
    source: "المصدر",
    estimatedValue: "القيمة التقديرية",
    lastContact: "آخر تواصل",
    nextFollowUp: "المتابعة التالية",
    proposal: "العرض",
    contract: "العقد",
    aging: "مدة الانتظار",
    paidCampaign: "حملة مدفوعة",
    website: "الموقع الإلكتروني",
    referral: "إحالة",
    whatsapp: "واتساب",
    platform: "المنصة",
    draft: "مسودة",
    sent: "مرسل",
    approved: "معتمد",
    revisionRequested: "مطلوب تعديل",
    rejected: "مرفوض",
    notStarted: "لم يبدأ",

    employeeFormDescription:
      "حدد هوية الموظف وصلاحياته. يجب تعيين قسم لموظفي الفريق.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordReset: "إعادة تعيين كلمة المرور",
    leavePassword: "اتركه فارغًا للإبقاء على كلمة المرور الحالية",
    phoneWhatsapp: "الهاتف / واتساب",
    selectRole: "اختر الدور",
    selectDepartment: "اختر القسم",
    teamDepartmentDescription: "يتم تعيين موظفي الفريق إلى قسم تنفيذ واحد.",
    notApplicable: "غير متاح لهذا الدور",
    activeAccount: "حساب نشط",
    suspendedDescription:
      "يبقى الموظفون الموقوفون في الدليل لكن يفقدون صلاحية الوصول.",
    cancel: "إلغاء",
    createEmployee: "إنشاء موظف",
    saveChanges: "حفظ التغييرات",
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
  "Finalize pricing objections before approval call.":
    "استكمال ملاحظات التسعير قبل مكالمة الموافقة.",
  "Review proposal feedback and prepare revision scope.":
    "مراجعة ملاحظات العرض وتجهيز نطاق التعديل.",
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
  "Total value under active execution for the selected period.":
    "activeProjectValueDescription",
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
  return key ? (commonMessages[locale][key] ?? commonMessages.en[key]) : value;
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
  return locale === "ar" ? (employeeArabicLabels[value] ?? value) : value;
}

const clientArabicLabels: Record<string, string> = {
  Client: "عميل",
  Lead: "عميل محتمل",
  Online: "متصل",
  "No client": "لا يوجد عميل",
};

export function translateClientLabel(locale: Locale, value: string) {
  return locale === "ar" ? (clientArabicLabels[value] ?? value) : value;
}

const requestArabicLabels: Record<string, string> = {
  Lead: "عميل محتمل",
  Order: "طلب",
  New: "جديد",
  "New Lead": "عميل محتمل جديد",
  Contacted: "تم التواصل",
  "Follow-up Attempt": "محاولة متابعة",
  "Meeting Scheduled": "تم تحديد اجتماع",
  "Meeting Completed": "تم عقد الاجتماع",
  "Proposal Sent": "تم إرسال العرض",
  "Negotiation / Follow-up": "تفاوض / متابعة",
  Negotiation: "تفاوض",
  "Proposal sent": "تم إرسال العرض",
  Approved: "معتمد",
  Rejected: "مرفوض",
  "Contract sent": "تم إرسال العقد",
  Signed: "موقّع",
  Active: "نشط",
  Cancelled: "ملغى",
  "Won (Contract Signed)": "تم الفوز (العقد موقّع)",
  "Paid campaign": "حملة مدفوعة",
  Website: "الموقع الإلكتروني",
  Referral: "إحالة",
  WhatsApp: "واتساب",
  Platform: "المنصة",
  Draft: "مسودة",
  Sent: "مرسل",
  "Revision requested": "مطلوب تعديل",
  "Not started": "لم يبدأ",
  "Waiting for CRM approval": "بانتظار موافقة إدارة العملاء",
  "Drafting contract package": "جارٍ إعداد حزمة العقد",
  "Not created": "لم يتم الإنشاء",
  "Validity not started": "لم تبدأ الصلاحية",
  "Not sent": "لم يتم الإرسال",
  SENT: "تم الإرسال",
  DRAFT: "مسودة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  "REVISION REQUESTED": "مطلوب تعديل",
  "Signed, awaiting project creation": "موقّع، بانتظار إنشاء المشروع",
  "1d in pipeline": "يوم واحد في المسار",
  "2d in current stage": "يومان في المرحلة الحالية",
  "6d in pipeline": "6 أيام في المسار",
  "Approval completed": "اكتملت الموافقة",
  "Follow-up overdue": "المتابعة متأخرة",
  "Fresh opportunity": "فرصة جديدة",
  "Proposal prep in progress": "جارٍ إعداد العرض",
  "Ready for conversion": "جاهز للتحويل",
  "Fixed Project": "مشروع ثابت",
  "Fixed project": "مشروع ثابت",
  "Monthly Retainer": "اشتراك شهري",
  "Monthly retainer": "اشتراك شهري",
  "One-time service": "خدمة لمرة واحدة",
  "On hold": "معلق",
  Completed: "مكتمل",
  Closed: "مغلق",
  SIGNED: "موقّع",
  ACTIVE: "نشط",
  ON_HOLD: "معلق",
  COMPLETED: "مكتمل",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
  "Project linked": "مرتبط بمشروع",
  "No project": "لا يوجد مشروع",
  "No invoices": "لا توجد فواتير",
  "No end date": "لا يوجد تاريخ انتهاء",
  "No renewal": "لا يوجد تجديد",
  Renewal: "تجديد",
  Created: "أُنشئ",
  Ends: "ينتهي",
  Expired: "منتهي",
  "d renewal": "تجديد بعد أيام",
  invoice: "فاتورة",
  invoices: "فواتير",
  Planning: "قيد التخطيط",
  "Pending activation": "بانتظار التفعيل",
  "Awaiting review": "بانتظار المراجعة",
  "Needs revision": "بحاجة إلى تعديل",
  Upcoming: "قادم",
  Suspended: "موقوف",
  Design: "تصميم",
  Content: "محتوى",
  Development: "تطوير",
  Marketing: "تسويق",
  Production: "إنتاج",
  high: "عالٍ",
  normal: "عادي",
  urgent: "عاجل",
  low: "منخفض",
  High: "عالٍ",
  Normal: "عادي",
  Urgent: "عاجل",
  Low: "منخفض",
  Delay: "تأخير",
  Quality: "جودة",
  Communication: "تواصل",
  Budget: "ميزانية",
  Scope: "النطاق",
  Attitude: "سلوك",
  Other: "أخرى",
  "Pending approval": "بانتظار الموافقة",
  "Waiting client": "بانتظار العميل",
  Escalated: "مصعّد",
  Resolved: "تمت التسوية",
  "To do": "للإنجاز",
  "In review": "قيد المراجعة",
  Done: "مكتملة",
  Revision: "تعديل مطلوب",
  "No assignee": "لا يوجد مسؤول",
  Watch: "تحت المراقبة",
  Blocked: "متعطل",
  Review: "مراجعة",
  Good: "جيد",
  "Waiting first payment": "بانتظار الدفعة الأولى",
  "No monthly periods": "لا توجد فترات شهرية",
  "One-off delivery": "تنفيذ لمرة واحدة",
};

export function translateRequestLabel(locale: Locale, value: string): string {
  const dateMatch = value.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/,
  );
  if (dateMatch) {
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const day = dateMatch[2].padStart(2, "0");
    const month = months[dateMatch[1]];
    return locale === "ar"
      ? `${dateMatch[3]}/${month}/${day}`
      : `${day}/${month}/${dateMatch[3]}`;
  }
  if (locale !== "ar") return value;
  if (requestArabicLabels[value]) return requestArabicLabels[value];
  if (value.startsWith("Sent "))
    return `تم الإرسال ${translateRequestLabel(locale, value.slice(5))}`;
  if (value.startsWith("Valid until "))
    return `صالح حتى ${translateRequestLabel(locale, value.slice(11))}`;
  if (value.startsWith("Signed "))
    return `تم التوقيع ${translateRequestLabel(locale, value.slice(7))}`;
  if (value.startsWith("Created ")) return `أُنشئ ${value.slice(8)}`;
  if (value.startsWith("Ends ")) return `ينتهي ${value.slice(5)}`;
  if (value.startsWith("Expired ")) return `منتهي ${value.slice(8)}`;
  if (/^\d+d renewal$/.test(value))
    return `تجديد خلال ${value.split("d")[0]} أيام`;
  if (/^\d+ invoices$/.test(value))
    return value.replace(" invoices", " فواتير");
  if (/^\d+ invoice$/.test(value)) return value.replace(" invoice", " فاتورة");
  if (value === "Linked to contract") return "مرتبط بعقد";
  if (value === "Today") return "اليوم";
  if (value === "Yesterday") return "أمس";
  const overdueMatch = value.match(/^Overdue by (\d+)d$/);
  if (overdueMatch) {
    const days = Number(overdueMatch[1]);
    return days === 1
      ? "متأخر منذ يوم واحد"
      : days === 2
        ? "متأخر منذ يومين"
        : days <= 10
          ? `متأخر منذ ${days} أيام`
          : `متأخر منذ ${days} يومًا`;
  }
  if (value === "Ends today") return "ينتهي اليوم";
  if (value.startsWith("Ended ")) return `انتهى منذ ${value.slice(7)}`;
  if (/^\d+d left · /.test(value))
    return value.replace(/^([0-9]+)d left · /, "$1 يوم متبقٍ · ");
  if (value.includes("overdue tasks"))
    return value
      .replace(/overdue tasks/g, "مهام متأخرة")
      .replace(/open revision/g, "تعديل مفتوح")
      .replace(/deliverable waiting review/g, "تسليم بانتظار المراجعة")
      .replace(/Suspended period/g, "فترة موقوفة");
  if (value.includes(", "))
    return value
      .split(", ")
      .map((part) => translateRequestLabel(locale, part))
      .join("، ");
  return value;
}

export function localizeOverviewChartLabel(locale: Locale, label: string) {
  if (locale !== "ar") return label;
  return label.replace(
    /\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b/g,
    (month) => chartMonthsAr[month] ?? month,
  );
}

export function formatLocalizedDateRange(
  from: Date,
  to: Date,
  locale: Locale,
): string {
  const formatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      numberingSystem: "latn",
    },
  );
  return `${formatter.format(from)} ${locale === "ar" ? "إلى" : "to"} ${formatter.format(to)}`;
}

export function formatPlainNumber(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? String(Math.trunc(numeric)) : "0";
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
        let message: string =
          commonMessages[locale][key] ?? commonMessages.en[key];
        for (const [name, value] of Object.entries(values ?? {})) {
          message = message.replace(`{${name}}`, value);
        }
        return message;
      },
    }),
    [locale],
  );
}
