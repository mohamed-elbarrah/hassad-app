import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

// ── Existing types ────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  recentUsers: number;
  usersByRole: Array<{ role: string; count: number }>;
  activeClients: number;
  newClientsThisMonth: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  overdueTasks: number;
  monthlyRevenue: number;
  revenueChange: number;
  unpaidInvoicesCount: number;
  totalInvoices: number;
  employeesCount: number;
  pendingRequests: number;
  activeCampaigns: number;
  conversationsCount: number;
  satisfactionRate: number;
}

export interface SystemHealth {
  status: string;
  database: string;
  recentErrors: number;
  activeUsersLastHour: number;
  pendingWebhooks: number;
  uptime: number;
  memoryUsage: number;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  before: any;
  after: any;
  metadata: any;
  createdAt: string;
}

export interface AuditStats {
  total: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditFilterOptions {
  actions: string[];
  entities: string[];
  users: Array<{ id: string; name: string }>;
}

export interface AdminSettings {
  [key: string]: any;
}

// ── New admin user types ───────────────────────────────────────────────────────

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: string | null;
  phoneWhatsapp: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  activeRequestsCount: number;
  activeTasksCount: number;
  activeProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminUsers {
  items: AdminUserDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  excludeRole?: string;
  department?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

export interface BulkUserAction {
  userIds: string[];
  action:
    | "activate"
    | "deactivate"
    | "changeRole"
    | "reassignDepartment"
    | "export";
  value?: string;
}

export interface BulkUserActionResult {
  affected: number;
  failed: string[];
}

export interface ImpersonationResult {
  token: string;
  expiresAt: string;
}

export interface PasswordResetResult {
  temporaryPassword: string;
}

export interface UserActivityEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  before: any;
  after: any;
  metadata: any;
  createdAt: string;
}

export interface PaginatedUserActivity {
  items: UserActivityEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserPerformance {
  activeTasksCount: number;
  workloadStatus: "AVAILABLE" | "BUSY" | "OVERLOADED";
  avgCompletionSpeedDays: number;
  avgQualityScore: number;
}

// ── Session types ─────────────────────────────────────────────────────────────

export interface AdminSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface PaginatedSessions {
  items: AdminSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Security event types ──────────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  type: string;
  ip: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

export interface PaginatedSecurityEvents {
  items: SecurityEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SecurityStats {
  totalEvents: number;
  failedLogins24h: number;
  impersonations7d: number;
  passwordResets7d: number;
  activeSessions: number;
  twoFactorEnabled: number;
}

// ── Command Center types ───────────────────────────────────────────────────────

export interface TrendData {
  revenue: number[];
  newUsers: number[];
  newClients: number[];
  newProjects: number[];
  tasksCompleted: number[];
  labels: string[];
}

export interface FunnelData {
  leads: number;
  clients: number;
  proposals: number;
  contracts: number;
  projects: number;
  invoices: number;
  payments: number;
  conversionRates: {
    leadsToClients: number;
    clientsToProposals: number;
    proposalsToContracts: number;
    contractsToProjects: number;
    projectsToInvoices: number;
    invoicesToPayments: number;
  };
}

export interface AlertItemBase {
  count: number;
  label: string;
  link: string;
}

export interface AlertItem extends AlertItemBase {
  items?: any[];
}

export interface AlertsData {
  overdueTasks: AlertItem;
  agedInvoices: AlertItem;
  escalatedDisputes: AlertItem;
  failedWebhooks: AlertItem;
  expiringContracts: AlertItem;
  pendingRequests: AlertItem;
}

// ── Business Operations types ─────────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  name: string;
  clientName: string;
  pmId: string | null;
  pmName: string;
  status: string;
  completionPercentage: number;
  overdueTasksCount: number;
  priority: string | null;
  totalValue: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isBehindSchedule: boolean;
  remainingValue: number;
}
export interface PaginatedProjects {
  items: ProjectRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskRow {
  id: string;
  title: string;
  projectName: string;
  assigneeId: string | null;
  assigneeName: string;
  department: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  revisionCount: number;
  createdAt: string;
}
export interface PaginatedTasks {
  items: TaskRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractRow {
  id: string;
  title: string;
  clientName: string;
  type: string;
  status: string;
  monthlyValue: number;
  totalValue: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  versionNumber: number;
  eSigned: boolean;
  pendingRenewalAlerts: number;
  invoiceCount: number;
  createdAt: string;
}
export interface PaginatedContracts {
  items: ContractRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadRow {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  assigneeId: string | null;
  assigneeName: string;
  pipelineStage: string;
  source: string | null;
  businessType: string | null;
  contactAttemptCount: number;
  lastContactAt: string | null;
  createdAt: string;
  potentialValue: number | null;
  daysSinceLastContact: number | null;
  hasProposal: boolean;
}
export interface PaginatedLeads {
  items: LeadRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface LeadStats {
  byStage: { stage: string; count: number }[];
  bySource: { source: string; count: number }[];
  conversionRate: number;
}

export interface RequestRow {
  id: string;
  clientName: string;
  assigneeId: string | null;
  assigneeName: string;
  status: string;
  servicesCount: number;
  ageDays: number;
  createdAt: string;
}
export interface PaginatedRequests {
  items: RequestRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CampaignRow {
  id: string;
  name: string;
  clientName: string;
  managedById: string | null;
  managedByName: string;
  platform: string | null;
  status: string;
  budgetTotal: number;
  budgetSpent: number;
  isOverspent: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}
export interface PaginatedCampaigns {
  items: CampaignRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationRow {
  id: string;
  participants: { id: string; name: string }[];
  lastMessageAt: string | null;
  lastMessageContent: string | null;
  messageCount: number;
  isActive: boolean;
  isStale: boolean;
  createdAt: string;
}
export interface PaginatedConversations {
  items: ConversationRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PortalClientRow {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  hasPortalAccess: boolean;
  lastLoginAt: string | null;
  intakeCompleted: boolean;
  pendingApprovalsCount: number;
  createdAt: string;
}
export interface PaginatedPortalClients {
  items: PortalClientRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface PortalOverview {
  totalClients: number;
  activeClients: number;
  idleClients: number;
  pendingApprovals: number;
  pendingRevisions: number;
  unsubmittedIntakeForms: number;
  snoozedItemsCount: number;
  activeTokens: number;
}

export interface RecentActivityEntry {
  id: string;
  entityType: string;
  eventType: string;
  description: string;
  occurredAt: string;
  actorName: string | null;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: [
    "AdminStats",
    "AdminSettings",
    "AuditLog",
    "AdminUsers",
    "AdminUser",
    "AdminSessions",
    "AdminSecurity",
    "NotificationTemplates",
    "MarketingStrategies",
  ],
  endpoints: (builder) => ({
    // ── Existing endpoints ──────────────────────────────────────────────────

    getAdminStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
      providesTags: ["AdminStats"],
    }),

    getHealth: builder.query<SystemHealth, void>({
      query: () => "/admin/health",
    }),

    getAuditLog: builder.query<PaginatedAuditLog, AuditLogFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.userId) params.set("userId", filters.userId);
        if (filters.action) params.set("action", filters.action);
        if (filters.entity) params.set("entity", filters.entity);
        if (filters.entityId) params.set("entityId", filters.entityId);
        if (filters.search) params.set("search", filters.search);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/audit-log?${params.toString()}`;
      },
      providesTags: ["AuditLog"],
    }),

    getAdminAuditStats: builder.query<AuditStats, void>({
      query: () => "/admin/audit-log/stats",
    }),

    getAuditFilters: builder.query<AuditFilterOptions, void>({
      query: () => "/admin/audit-log/filters",
    }),

    getAdminSettings: builder.query<AdminSettings, void>({
      query: () => "/admin/settings",
      providesTags: ["AdminSettings"],
    }),

    updateAdminSettings: builder.mutation<AdminSettings, Record<string, any>>({
      query: (body) => ({
        url: "/admin/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminSettings"],
    }),

    // ── Admin Users ─────────────────────────────────────────────────────────

    searchAdminUsers: builder.query<PaginatedAdminUsers, AdminUserFilters>({
      query: (filters) => ({
        url: "/admin/users",
        params: filters,
      }),
      providesTags: ["AdminUsers"],
    }),

    getAdminUser: builder.query<AdminUserDetail, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    getUserActivity: builder.query<
      PaginatedUserActivity,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page, limit }) => ({
        url: `/admin/users/${id}/activity`,
        params: { page, limit },
      }),
    }),

    bulkUserAction: builder.mutation<BulkUserActionResult, BulkUserAction>({
      query: (body) => ({
        url: "/admin/users/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers"],
    }),

    resetUserPassword: builder.mutation<PasswordResetResult, string>({
      query: (id) => ({
        url: `/admin/users/${id}/reset-password`,
        method: "POST",
      }),
    }),

    impersonateUser: builder.mutation<
      ImpersonationResult,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/impersonate`,
        method: "POST",
        body: { reason },
      }),
    }),

    revokeUserSessions: builder.mutation<{ revokedCount: number }, string>({
      query: (id) => ({
        url: `/admin/users/${id}/revoke-sessions`,
        method: "POST",
      }),
      invalidatesTags: ["AdminSessions"],
    }),

    setUserPermissions: builder.mutation<
      { permissionIds: string[] },
      { id: string; permissionIds: string[] }
    >({
      query: ({ id, permissionIds }) => ({
        url: `/admin/users/${id}/permissions`,
        method: "POST",
        body: { permissionIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminUser", id }],
    }),

    createAdminUser: builder.mutation<
      { id: string; name: string; email: string; role: string },
      {
        name: string;
        email: string;
        password: string;
        role: string;
        phoneWhatsapp?: string;
        department?: string;
      }
    >({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStats"],
    }),

    updateAdminUser: builder.mutation<
      AdminUserDetail,
      { id: string; body: { name?: string; email?: string; phoneWhatsapp?: string; password?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminUser", id },
        "AdminUsers",
      ],
    }),

    // ── Admin Sessions ──────────────────────────────────────────────────────

    getAdminSessions: builder.query<
      PaginatedSessions,
      { userId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/admin/sessions",
        params,
      }),
      providesTags: ["AdminSessions"],
    }),

    revokeSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/sessions/${id}/revoke`,
        method: "POST",
      }),
      invalidatesTags: ["AdminSessions"],
    }),

    // ── Admin Security ─────────────────────────────────────────────────────

    getSecurityEvents: builder.query<
      PaginatedSecurityEvents,
      {
        userId?: string;
        type?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/admin/security/events",
        params,
      }),
      providesTags: ["AdminSecurity"],
    }),

    getSecurityStats: builder.query<SecurityStats, void>({
      query: () => "/admin/security/stats",
      providesTags: ["AdminSecurity"],
    }),

    // ── Command Center ────────────────────────────────────────────────────

    getTrendData: builder.query<TrendData, { days?: number }>({
      query: ({ days }) => ({
        url: "/admin/stats/trends",
        params: days ? { days } : undefined,
      }),
      providesTags: ["AdminStats"],
    }),

    getFunnelData: builder.query<FunnelData, void>({
      query: () => "/admin/funnel",
      providesTags: ["AdminStats"],
    }),

    getAlertsData: builder.query<AlertsData, void>({
      query: () => "/admin/alerts",
      providesTags: ["AdminStats"],
    }),

    getRecentActivity: builder.query<RecentActivityEntry[], void>({
      query: () => "/admin/recent-activity",
    }),

    // ── Dashboard v2 endpoints ────────────────────────────────────────────

    getAdminDashboardAttention: builder.query<any, void>({
      query: () => "/admin/dashboard/attention",
    }),

    getAdminDashboardRecentActivity: builder.query<any, number>({
      query: (limit) => `/admin/dashboard/recent-activity?limit=${limit}`,
    }),

    getAdminDashboardTeamWorkload: builder.query<any, void>({
      query: () => "/admin/dashboard/team-workload",
    }),

    getAdminUserWork: builder.query<any, string>({
      query: (id) => `/admin/users/${id}/work`,
    }),

    getAdminUserPerformance: builder.query<UserPerformance, string>({
      query: (id) => `/admin/users/${id}/performance`,
    }),

    // ── Projects ───────────────────────────────────────────────────────────

    getAdminProjects: builder.query<PaginatedProjects, Record<string, any>>({
      query: (params) => ({ url: "/admin/projects", params }),
      providesTags: ["AdminStats"],
    }),
    getAdminProject: builder.query<any, string>({
      query: (id) => `/admin/projects/${id}`,
    }),
    reassignProjectPm: builder.mutation<void, { id: string; pmUserId: string }>(
      {
        query: ({ id, pmUserId }) => ({
          url: `/admin/projects/${id}/reassign-pm`,
          method: "POST",
          body: { pmUserId },
        }),
        invalidatesTags: ["AdminStats"],
      },
    ),
    archiveProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/projects/${id}/archive`, method: "POST" }),
      invalidatesTags: ["AdminStats"],
    }),
    forceProjectStatus: builder.mutation<
      void,
      { id: string; status: string; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/admin/projects/${id}/force-status`,
        method: "POST",
        body: { status, reason },
      }),
      invalidatesTags: ["AdminStats"],
    }),
    createAdminProject: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/admin/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStats"],
    }),
    addProjectMember: builder.mutation<
      void,
      { id: string; userId: string; role: string }
    >({
      query: ({ id, userId, role }) => ({
        url: `/admin/projects/${id}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: ["AdminStats"],
    }),
    createProjectTask: builder.mutation<
      void,
      { id: string; title: string; assigneeId?: string; priority?: string; dueDate?: string; status?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/projects/${id}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStats"],
    }),

    // ── Tasks ──────────────────────────────────────────────────────────────

    getAdminTasks: builder.query<PaginatedTasks, Record<string, any>>({
      query: (params) => ({ url: "/admin/tasks", params }),
    }),
    getAdminTask: builder.query<any, string>({
      query: (id) => `/admin/tasks/${id}`,
    }),
    reassignTask: builder.mutation<void, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/admin/tasks/${id}/reassign`,
        method: "POST",
        body: { assigneeId },
      }),
    }),
    forceTaskTransition: builder.mutation<
      void,
      { id: string; status: string; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/admin/tasks/${id}/force-transition`,
        method: "POST",
        body: { status, reason },
      }),
    }),

    // ── Contracts ──────────────────────────────────────────────────────────

    getAdminContracts: builder.query<PaginatedContracts, Record<string, any>>({
      query: (params) => ({ url: "/admin/contracts", params }),
    }),
    getAdminContract: builder.query<any, string>({
      query: (id) => `/admin/contracts/${id}`,
    }),
    cancelContract: builder.mutation<void, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/contracts/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
    }),
    triggerRenewalAlert: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/contracts/${id}/trigger-renewal-alert`,
        method: "POST",
      }),
    }),
    convertContractToProject: builder.mutation<any, { id: string; name?: string; pmId?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/contracts/${id}/convert-to-project`,
        method: "POST",
        body,
      }),
    }),
    updateContractStatus: builder.mutation<void, { id: string; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/admin/contracts/${id}/status`,
        method: "POST",
        body: { status, reason },
      }),
    }),

    // ── Leads ──────────────────────────────────────────────────────────────

    getAdminLeads: builder.query<PaginatedLeads, Record<string, any>>({
      query: (params) => ({ url: "/admin/leads", params }),
    }),
    getAdminLead: builder.query<any, string>({
      query: (id) => `/admin/leads/${id}`,
    }),
    getAdminLeadStats: builder.query<LeadStats, void>({
      query: () => "/admin/leads/stats",
    }),
    reassignLead: builder.mutation<void, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/admin/leads/${id}/reassign`,
        method: "POST",
        body: { assigneeId },
      }),
    }),
    convertLeadToClient: builder.mutation<any, { id: string; additionalNotes?: string }>({
      query: ({ id, additionalNotes }) => ({
        url: `/admin/leads/${id}/convert-to-client`,
        method: "POST",
        body: { additionalNotes },
      }),
    }),
    addContactLog: builder.mutation<any, { id: string; type: string; result: string; notes?: string; contactedAt?: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/leads/${id}/contact-log`,
        method: "POST",
        body,
      }),
    }),

    // ── Requests ───────────────────────────────────────────────────────────

    getAdminRequests: builder.query<PaginatedRequests, Record<string, any>>({
      query: (params) => ({ url: "/admin/requests", params }),
    }),
    getAdminRequest: builder.query<any, string>({
      query: (id) => `/admin/requests/${id}`,
    }),
    reassignRequest: builder.mutation<void, { id: string; assigneeId: string }>(
      {
        query: ({ id, assigneeId }) => ({
          url: `/admin/requests/${id}/reassign`,
          method: "POST",
          body: { assigneeId },
        }),
      },
    ),
    forceRequestStatus: builder.mutation<
      void,
      { id: string; status: string; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/admin/requests/${id}/force-status`,
        method: "POST",
        body: { status, reason },
      }),
    }),
    updateRequestNotes: builder.mutation<any, { id: string; notes: string }>({
      query: ({ id, notes }) => ({
        url: `/admin/requests/${id}/notes`,
        method: "PATCH",
        body: { notes },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminStats", id },
      ],
    }),

    // ── Campaigns ──────────────────────────────────────────────────────────

    getAdminCampaigns: builder.query<PaginatedCampaigns, Record<string, any>>({
      query: (params) => ({ url: "/admin/campaigns", params }),
    }),
    getAdminCampaign: builder.query<any, string>({
      query: (id) => `/admin/campaigns/${id}`,
    }),
    createAdminCampaign: builder.mutation<any, any>({
      query: (body) => ({ url: "/admin/campaigns", method: "POST", body }),
    }),
    pauseCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/campaigns/${id}/pause`, method: "POST" }),
    }),
    endCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/campaigns/${id}/end`, method: "POST" }),
    }),
    updateAdminCampaign: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/admin/campaigns/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminStats" },
      ],
    }),

    // ── Chat ───────────────────────────────────────────────────────────────

    getAdminConversations: builder.query<
      PaginatedConversations,
      Record<string, any>
    >({
      query: (params) => ({ url: "/admin/conversations", params }),
    }),
    getAdminConversationMessages: builder.query<
      any,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page, limit }) => ({
        url: `/admin/conversations/${id}/messages`,
        params: { page, limit },
      }),
    }),
    hideConversation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/conversations/${id}/hide`,
        method: "POST",
      }),
    }),

    // ── Portal ─────────────────────────────────────────────────────────────

    getPortalOverview: builder.query<PortalOverview, void>({
      query: () => "/admin/portal/overview",
    }),
    getPortalClients: builder.query<
      PaginatedPortalClients,
      Record<string, any>
    >({
      query: (params) => ({ url: "/admin/portal/clients", params }),
    }),
    regeneratePortalToken: builder.mutation<
      { token: string; expiresAt: string },
      string
    >({
      query: (id) => ({
        url: `/admin/portal/clients/${id}/regenerate-token`,
        method: "POST",
      }),
    }),
    togglePortalAccess: builder.mutation<
      { enabled: boolean; token?: string; expiresAt?: string },
      string
    >({
      query: (id) => ({
        url: `/admin/portal/clients/${id}/toggle-access`,
        method: "POST",
      }),
    }),

    // ── Proposals ──────────────────────────────────────────────────────────
    getAdminProposals: builder.query<any, any>({
      query: (filters) => ({ url: "/admin/proposals", params: filters }),
    }),
    getAdminProposalStats: builder.query<any, void>({
      query: () => "/admin/proposals/stats",
    }),
    getAdminProposal: builder.query<any, string>({
      query: (id) => `/admin/proposals/${id}`,
    }),
    convertProposalToContract: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/proposals/${id}/convert-to-contract`,
        method: "POST",
      }),
      invalidatesTags: ["AdminStats"],
    }),

    // ── Team Workload ────────────────────────────────────────────────────
    getAdminTeamWorkload: builder.query<any, void>({
      query: () => "/admin/team/workload",
    }),

    // ── Reports ──────────────────────────────────────────────────────────
    getAdminReportSales: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/sales", params }),
    }),
    getAdminReportRevenue: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/revenue", params }),
    }),
    getAdminReportProjects: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/projects", params }),
    }),
    getAdminReportTeamPerformance: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/team-performance", params }),
    }),
    getAdminReportSatisfaction: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/satisfaction", params }),
    }),
    getAdminReportCampaigns: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: "/admin/reports/campaigns", params }),
    }),

    // ── Clients ────────────────────────────────────────────────────────────
    getAdminClients: builder.query<any, any>({
      query: (filters) => ({ url: "/admin/clients", params: filters }),
    }),
    getAdminClient: builder.query<any, string>({
      query: (id) => `/admin/clients/${id}`,
    }),
    getAdminClientsStats: builder.query<any, void>({
      query: () => "/admin/clients/stats",
    }),

    // ── Finance ────────────────────────────────────────────────────────────
    getAdminFinanceOverview: builder.query<
      any,
      { dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => {
        const url = "/admin/finance/overview";
        if (!params) return url;
        const search = new URLSearchParams();
        if (params.dateFrom) search.set("dateFrom", params.dateFrom);
        if (params.dateTo) search.set("dateTo", params.dateTo);
        const qs = search.toString();
        return qs ? `${url}?${qs}` : url;
      },
      providesTags: ["AdminStats"],
    }),
    forceAdminInvoiceStatus: builder.mutation<
      any,
      { id: string; status: string; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/finance/invoices/${id}/force-status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStats"],
    }),
    writeOffAdminInvoice: builder.mutation<any, { id: string; reason: string }>(
      {
        query: ({ id, ...body }) => ({
          url: `/admin/finance/invoices/${id}/write-off`,
          method: "POST",
          body,
        }),
        invalidatesTags: ["AdminStats"],
      },
    ),
    triggerAdminRefund: builder.mutation<
      any,
      { id: string; amount: number; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/finance/invoices/${id}/refund`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStats"],
    }),
    getAdminPaymentEvents: builder.query<any, string | void>({
      query: (paymentId) => ({
        url: "/admin/finance/payment-events",
        params: paymentId ? { paymentId } : {},
      }),
    }),
    getAdminWebhookLogs: builder.query<any, any>({
      query: (filters) => ({
        url: "/admin/finance/webhook-logs",
        params: filters,
      }),
    }),
    retryAdminWebhook: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/finance/webhook-logs/${id}/retry`,
        method: "POST",
      }),
    }),
    getAdminGatewaysHealth: builder.query<any, void>({
      query: () => "/admin/finance/gateways-health",
    }),

    // ── Notification Templates ──────────────────────────────────────────────

    getAdminNotificationTemplates: builder.query<
      any,
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "admin/notification-templates",
        params,
      }),
      providesTags: ["NotificationTemplates"],
    }),

    getAdminNotificationEventTypes: builder.query<any, void>({
      query: () => "admin/notification-templates/event-types",
    }),

    updateAdminNotificationTemplate: builder.mutation<
      any,
      { id: string; data: any }
    >({
      query: ({ id, data }) => ({
        url: `admin/notification-templates/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["NotificationTemplates"],
    }),

    getAdminTemplateLogs: builder.query<any, string>({
      query: (id) => `admin/notification-templates/${id}/logs`,
    }),

    broadcastNotification: builder.mutation<
      any,
      { title: string; body: string; role?: string; userId?: string }
    >({
      query: (body) => ({
        url: "notifications/broadcast",
        method: "POST",
        body,
      }),
    }),

    // ── Marketing Strategies ────────────────────────────────────────────────

    getAdminMarketingStrategies: builder.query<
      any,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params) => ({
        url: "admin/marketing/strategies",
        params,
      }),
      providesTags: ["MarketingStrategies"],
    }),

    updateAdminMarketingStrategyStatus: builder.mutation<
      any,
      { id: string; status: string; note?: string }
    >({
      query: ({ id, status, note }) => ({
        url: `admin/marketing/strategies/${id}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      invalidatesTags: ["MarketingStrategies"],
    }),
  }),
});

export const {
  // Existing
  useGetAdminStatsQuery,
  useGetHealthQuery,
  useGetAuditLogQuery,
  useGetAdminAuditStatsQuery,
  useGetAuditFiltersQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  // Admin Users
  useSearchAdminUsersQuery,
  useGetAdminUserQuery,
  useGetUserActivityQuery,
  useBulkUserActionMutation,
  useResetUserPasswordMutation,
  useImpersonateUserMutation,
  useRevokeUserSessionsMutation,
  useSetUserPermissionsMutation,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  // Admin Sessions
  useGetAdminSessionsQuery,
  useRevokeSessionMutation,
  // Admin Security
  useGetSecurityEventsQuery,
  useGetSecurityStatsQuery,
  // Command Center
  useGetTrendDataQuery,
  useGetFunnelDataQuery,
  useGetAlertsDataQuery,
  useGetRecentActivityQuery,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardRecentActivityQuery,
  useGetAdminDashboardTeamWorkloadQuery,
  useGetAdminUserWorkQuery,
  useGetAdminUserPerformanceQuery,
  // Projects
  useGetAdminProjectsQuery,
  useGetAdminProjectQuery,
  useReassignProjectPmMutation,
  useArchiveProjectMutation,
  useForceProjectStatusMutation,
  useCreateAdminProjectMutation,
  useAddProjectMemberMutation,
  useCreateProjectTaskMutation,
  // Tasks
  useGetAdminTasksQuery,
  useGetAdminTaskQuery,
  useReassignTaskMutation,
  useForceTaskTransitionMutation,
  // Contracts
  useGetAdminContractsQuery,
  useGetAdminContractQuery,
  useCancelContractMutation,
  useTriggerRenewalAlertMutation,
  useConvertContractToProjectMutation,
  useUpdateContractStatusMutation,
  // Leads
  useGetAdminLeadsQuery,
  useGetAdminLeadQuery,
  useGetAdminLeadStatsQuery,
  useReassignLeadMutation,
  useConvertLeadToClientMutation,
  useAddContactLogMutation,
  // Requests
  useGetAdminRequestsQuery,
  useGetAdminRequestQuery,
  useReassignRequestMutation,
  useForceRequestStatusMutation,
  useUpdateRequestNotesMutation,
  // Campaigns
  useGetAdminCampaignsQuery,
  useGetAdminCampaignQuery,
  useCreateAdminCampaignMutation,
  usePauseCampaignMutation,
  useEndCampaignMutation,
  useUpdateAdminCampaignMutation,
  // Chat
  useGetAdminConversationsQuery,
  useGetAdminConversationMessagesQuery,
  useHideConversationMutation,
  // Portal
  useGetPortalOverviewQuery,
  useGetPortalClientsQuery,
  useRegeneratePortalTokenMutation,
  useTogglePortalAccessMutation,
  // Proposals
  useGetAdminProposalsQuery,
  useGetAdminProposalStatsQuery,
  useGetAdminProposalQuery,
  useConvertProposalToContractMutation,
  // Clients
  useGetAdminClientsQuery,
  useGetAdminClientQuery,
  useGetAdminClientsStatsQuery,
  // Team Workload
  useGetAdminTeamWorkloadQuery,
  // Reports
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportTeamPerformanceQuery,
  useGetAdminReportSatisfactionQuery,
  useGetAdminReportCampaignsQuery,
  // Finance
  useGetAdminFinanceOverviewQuery,
  useForceAdminInvoiceStatusMutation,
  useWriteOffAdminInvoiceMutation,
  useTriggerAdminRefundMutation,
  useGetAdminPaymentEventsQuery,
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookMutation,
  useGetAdminGatewaysHealthQuery,
  // Notification Templates
  useGetAdminNotificationTemplatesQuery,
  useGetAdminNotificationEventTypesQuery,
  useUpdateAdminNotificationTemplateMutation,
  useGetAdminTemplateLogsQuery,
  // Marketing Strategies
  useGetAdminMarketingStrategiesQuery,
  useUpdateAdminMarketingStrategyStatusMutation,
  // Notifications
  useBroadcastNotificationMutation,
} = adminApi;
