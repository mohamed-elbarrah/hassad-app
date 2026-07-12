import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

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
  satisfactionRate: number | null;
}

export interface AdminTrend {
  date: string;
  revenue: number;
  users: number;
  clients: number;
}

export interface AdminFunnel {
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

export interface AdminAlertOverdueTaskItem {
  id: string;
  title: string;
  dueDate: string | null;
  assignee: string | null;
}

export interface AdminAlertAgedInvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string | null;
  clientName: string | null;
}

export interface AdminAlertEscalatedDisputeItem {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
}

export interface AdminAlertExpiringContractItem {
  id: string;
  title: string;
  endDate: string | null;
  clientName: string | null;
}

export interface AdminAlertPendingRequestItem {
  id: string;
  companyName: string;
  contactName: string;
  createdAt: string;
}

export interface AdminAlertCategory {
  count: number;
  label: string;
  link: string;
  items: (
    | AdminAlertOverdueTaskItem
    | AdminAlertAgedInvoiceItem
    | AdminAlertEscalatedDisputeItem
    | AdminAlertExpiringContractItem
    | AdminAlertPendingRequestItem
  )[];
}

export interface AdminAlertsResponse {
  overdueTasks: {
    count: number;
    label: string;
    link: string;
    items: AdminAlertOverdueTaskItem[];
  };
  agedInvoices: {
    count: number;
    label: string;
    link: string;
    items: AdminAlertAgedInvoiceItem[];
  };
  escalatedDisputes: {
    count: number;
    label: string;
    link: string;
    items: AdminAlertEscalatedDisputeItem[];
  };
  failedWebhooks: {
    count: number;
    label: string;
    link: string;
    items: never[];
  };
  expiringContracts: {
    count: number;
    label: string;
    link: string;
    items: AdminAlertExpiringContractItem[];
  };
  pendingRequests: {
    count: number;
    label: string;
    link: string;
    items: AdminAlertPendingRequestItem[];
  };
}

export interface AdminRecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  before: unknown | null;
  after: unknown | null;
  metadata: unknown | null;
  createdAt: string;
}

export interface AdminRecentActivityEntry {
  id: string;
  entityType: string;
  eventType: string;
  description: string;
  occurredAt: string;
  actorName: string | null;
}

export interface AdminHealthInfo {
  status: "healthy" | "degraded";
  database: "connected" | "disconnected";
  recentErrors: number;
  activeUsersLastHour: number;
  pendingWebhooks: number;
  uptime: number;
  memoryUsage: number;
  timestamp: string;
  overallScore: number;
  services: Array<{ name: string; status: string; responseTime: number }>;
  unresolvedErrors: number;
}

export interface AdminAttentionStalledProject {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; companyName: string };
}

export interface AdminAttentionNewRequest {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  createdAt: string;
  client: { id: string; companyName: string } | null;
}

export interface AdminAttentionOpenDispute {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  escalatedAt: string | null;
  openedAt: string;
  client: { id: string; companyName: string } | null;
}

export interface AdminAttentionOverdueInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  client: { id: string; companyName: string } | null;
}

export interface AdminAttentionUnacknowledgedAlert {
  id: string;
  alertLevel: string;
  triggeredAt: string;
  task: { id: string; title: string };
  user: { id: string; name: string };
}

export interface AdminAttentionResponse {
  stalledProjects: AdminAttentionStalledProject[];
  newRequests: AdminAttentionNewRequest[];
  openDisputes: AdminAttentionOpenDispute[];
  overdueInvoices: AdminAttentionOverdueInvoice[];
  unacknowledgedAlerts: AdminAttentionUnacknowledgedAlert[];
}

export interface AdminDashboardWorkloadMember {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  activeTasksCount: number;
  workloadStatus: string;
  avgCompletionSpeedDays: number | null;
  avgQualityScore: number | null;
}

export interface AdminDashboardTeamWorkload {
  summary: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  members: AdminDashboardWorkloadMember[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actionAr: string | null;
  entity: string;
  entityAr: string | null;
  entityId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogFilters {
  actions: string[];
  entityTypes: string[];
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogSearchParams {
  action?: string;
  entity?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: [
    "AdminStats",
    "AdminTrends",
    "AdminFunnel",
    "AdminAlerts",
    "AdminActivity",
    "AdminHealth",
    "AdminAttention",
    "AdminWorkload",
    "AuditLog",
    "AuditFilters",
    "AdminSettings",
    "AdminIntegrations",
  ],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
      providesTags: ["AdminStats"],
    }),

    getAdminTrends: builder.query<AdminTrend[], void>({
      query: () => "/admin/stats/trends",
      providesTags: ["AdminTrends"],
    }),

    getAdminFunnel: builder.query<AdminFunnel, void>({
      query: () => "/admin/funnel",
      providesTags: ["AdminFunnel"],
    }),

    getAdminAlerts: builder.query<AdminAlertsResponse, void>({
      query: () => "/admin/alerts",
      providesTags: ["AdminAlerts"],
    }),

    getAdminRecentActivity: builder.query<AdminRecentActivityEntry[], void>({
      query: () => "/admin/recent-activity",
      providesTags: ["AdminActivity"],
    }),

    getAdminHealth: builder.query<AdminHealthInfo, void>({
      query: () => "/admin/health",
      providesTags: ["AdminHealth"],
    }),

    getAdminDashboardAttention: builder.query<AdminAttentionResponse, void>({
      query: () => "/admin/dashboard/attention",
      providesTags: ["AdminAttention"],
    }),

    getAdminDashboardRecentActivity: builder.query<AdminRecentActivity[], void>(
      {
        query: () => "/admin/dashboard/recent-activity",
        providesTags: ["AdminActivity"],
      },
    ),

    getAdminDashboardTeamWorkload: builder.query<
      AdminDashboardTeamWorkload,
      void
    >({
      query: () => "/admin/dashboard/team-workload",
      providesTags: ["AdminWorkload"],
    }),

    getAdminAuditLog: builder.query<
      PaginatedAuditLog,
      AuditLogSearchParams | void
    >({
      query: (params) => {
        if (!params) return "/admin/audit-log";
        const searchParams = new URLSearchParams();
        if (params.action) searchParams.set("action", params.action);
        if (params.entity) searchParams.set("entity", params.entity);
        if (params.userId) searchParams.set("userId", params.userId);
        if (params.search) searchParams.set("search", params.search);
        if (params.page) searchParams.set("page", String(params.page));
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.from) searchParams.set("from", params.from);
        if (params.to) searchParams.set("to", params.to);
        return `/admin/audit-log?${searchParams.toString()}`;
      },
      providesTags: ["AuditLog"],
    }),

    getAdminAuditLogFilters: builder.query<AuditLogFilters, void>({
      query: () => "/admin/audit-log/filters",
      providesTags: ["AuditFilters"],
    }),

    getAdminSettings: builder.query<Record<string, unknown>, void>({
      query: () => "/admin/settings",
      providesTags: ["AdminSettings"],
    }),

    updateAdminSettings: builder.mutation<
      Record<string, unknown>,
      Record<string, unknown>
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminSettings"],
    }),

    getAdminIntegrationsSyncStatus: builder.query<
      {
        summary: {
          total: number;
          healthy: number;
          degraded: number;
          down: number;
          unchecked: number;
        };
        items: Array<{
          serviceName: string;
          status: string;
          responseTime: number | null;
          lastCheckedAt: string;
          lastError: string | null;
          consecutiveFailures: number;
          timeoutThreshold: number;
          degradationThreshold: number;
        }>;
      },
      void
    >({
      query: () => "/admin/integrations/sync-status",
      providesTags: ["AdminIntegrations"],
    }),

    getAdminIntegrationsGateways: builder.query<
      Array<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>,
      void
    >({
      query: () => "/admin/integrations/gateways",
      providesTags: ["AdminIntegrations"],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminTrendsQuery,
  useGetAdminFunnelQuery,
  useGetAdminAlertsQuery,
  useGetAdminRecentActivityQuery,
  useGetAdminHealthQuery,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardRecentActivityQuery,
  useGetAdminDashboardTeamWorkloadQuery,
  useGetAdminAuditLogQuery,
  useGetAdminAuditLogFiltersQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminIntegrationsSyncStatusQuery,
  useGetAdminIntegrationsGatewaysQuery,
} = adminApi;
