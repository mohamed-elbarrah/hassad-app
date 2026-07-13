import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminStatsDeltas {
  totalUsers: number | null;
  activeClients: number | null;
  newClientsThisMonth: number | null;
  activeProjects: number | null;
  completedProjects: number | null;
  totalTasks: number | null;
  overdueTasks: number | null;
  monthlyRevenue: number | null;
  unpaidInvoicesCount: number | null;
  totalInvoices: number | null;
  pendingRequests: number | null;
  retentionRate: number | null;
  churnRate: number | null;
}

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
  retentionRate: number;
  churnRate: number;
  deltas: AdminStatsDeltas;
}

export interface AdminTrendsResponse {
  labels: string[];
  revenue: number[];
  newUsers: number[];
  newClients: number[];
  newProjects: number[];
  tasksCompleted: number[];
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
  contractStatusDistribution: Record<string, number>;
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

export interface AiProvider {
  id: string;
  name: string;
  displayName: string | null;
  baseUrl: string | null;
  apiKey: string;
  models: string[];
  priority: number;
  isActive: boolean;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  maxTokens: number | null;
  temperature: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiProviderDto {
  name: string;
  displayName?: string;
  baseUrl?: string;
  apiKey: string;
  models?: string[];
  priority?: number;
  isActive?: boolean;
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface FetchModelsDto {
  name: string;
  apiKey: string;
  baseUrl?: string;
}

export interface UpdateAiProviderDto {
  displayName?: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  priority?: number;
  isActive?: boolean;
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface AdminBusinessGoal {
  id: string;
  metric: string;
  target: number;
  current: number;
  period: string;
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessGoalDto {
  metric: string;
  target: number;
  current?: number;
  period?: string;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateBusinessGoalDto {
  metric?: string;
  target?: number;
  current?: number;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  isActive?: boolean;
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

export interface AdminAiInsightEntry {
  id: string;
  entityType: string;
  entityId: string;
  analysisType: string;
  summary: string;
  score: number | null;
  recommendations: string[];
  triggeredBy: string | null;
  createdAt: string;
}

export interface AdminAiInsights {
  recentAnalyses: AdminAiInsightEntry[];
  pendingSuggestions: number;
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
    "AdminBusinessGoals",
    "AdminAiInsights",
    "AiProviders",
  ],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, { from?: string; to?: string } | void>({
      query: (params) => {
        if (!params) return "/admin/stats";
        const sp = new URLSearchParams();
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
        return `/admin/stats?${sp.toString()}`;
      },
      providesTags: ["AdminStats"],
    }),

    getAdminTrends: builder.query<AdminTrendsResponse, { from?: string; to?: string; days?: number } | void>({
      query: (params) => {
        if (!params) return "/admin/stats/trends";
        const sp = new URLSearchParams();
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
        if (params.days) sp.set("days", String(params.days));
        return `/admin/stats/trends?${sp.toString()}`;
      },
      providesTags: ["AdminTrends"],
    }),

    getAdminFunnel: builder.query<AdminFunnel, { from?: string; to?: string } | void>({
      query: (params) => {
        if (!params) return "/admin/funnel";
        const sp = new URLSearchParams();
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
        return `/admin/funnel?${sp.toString()}`;
      },
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

    getAdminAiInsights: builder.query<AdminAiInsights, void>({
      query: () => "/admin/ai-insights",
      providesTags: ["AdminAiInsights"],
    }),

    runAdminAiScan: builder.mutation<{ analyzed: number; failed: number }, void>({
      query: () => ({ url: "/admin/ai/scan", method: "POST" }),
      invalidatesTags: ["AdminAiInsights"],
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

    getAdminBusinessGoals: builder.query<AdminBusinessGoal[], string | void>({
      query: (metric) =>
        metric ? `/admin/business-goals?metric=${metric}` : "/admin/business-goals",
      providesTags: ["AdminBusinessGoals"],
    }),

    getAdminBusinessGoal: builder.query<AdminBusinessGoal, string>({
      query: (id) => `/admin/business-goals/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminBusinessGoals", id }],
    }),

    createAdminBusinessGoal: builder.mutation<AdminBusinessGoal, CreateBusinessGoalDto>({
      query: (body) => ({ url: "/admin/business-goals", method: "POST", body }),
      invalidatesTags: ["AdminBusinessGoals"],
    }),

    updateAdminBusinessGoal: builder.mutation<
      AdminBusinessGoal,
      { id: string; body: UpdateBusinessGoalDto }
    >({
      query: ({ id, body }) => ({
        url: `/admin/business-goals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "AdminBusinessGoals",
        { type: "AdminBusinessGoals", id },
      ],
    }),

    deleteAdminBusinessGoal: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/business-goals/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminBusinessGoals"],
    }),

    // ── AI Providers ────────────────────────────────────────────────────

    getAiProviders: builder.query<AiProvider[], void>({
      query: () => "/admin/ai/providers",
      providesTags: ["AiProviders"],
    }),

    getAiProvider: builder.query<AiProvider, string>({
      query: (id) => `/admin/ai/providers/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AiProviders", id }],
    }),

    createAiProvider: builder.mutation<AiProvider, CreateAiProviderDto>({
      query: (body) => ({ url: "/admin/ai/providers", method: "POST", body }),
      invalidatesTags: ["AiProviders"],
    }),

    updateAiProvider: builder.mutation<AiProvider, { id: string; body: UpdateAiProviderDto }>({
      query: ({ id, body }) => ({
        url: `/admin/ai/providers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["AiProviders", { type: "AiProviders", id }],
    }),

    deleteAiProvider: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/ai/providers/${id}`, method: "DELETE" }),
      invalidatesTags: ["AiProviders"],
    }),

    getAiProviderModels: builder.query<{ success: boolean; models: string[]; message?: string }, string>({
      query: (id) => `/admin/ai/providers/${id}/models`,
      providesTags: (_result, _error, id) => [{ type: "AiProviders", id }],
    }),

    previewAiProviderModels: builder.mutation<{ success: boolean; models: string[]; message?: string }, FetchModelsDto>({
      query: (body) => ({ url: "/admin/ai/providers/fetch-models", method: "POST", body }),
    }),

    testAiProvider: builder.mutation<{ success: boolean; model?: string; message?: string; response?: string }, string>({
      query: (id) => ({ url: `/admin/ai/providers/${id}/test`, method: "POST" }),
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
  useGetAdminAiInsightsQuery,
  useRunAdminAiScanMutation,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardRecentActivityQuery,
  useGetAdminDashboardTeamWorkloadQuery,
  useGetAdminAuditLogQuery,
  useGetAdminAuditLogFiltersQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminIntegrationsSyncStatusQuery,
  useGetAdminIntegrationsGatewaysQuery,
  useGetAdminBusinessGoalsQuery,
  useGetAdminBusinessGoalQuery,
  useCreateAdminBusinessGoalMutation,
  useUpdateAdminBusinessGoalMutation,
  useDeleteAdminBusinessGoalMutation,
  useGetAiProvidersQuery,
  useGetAiProviderQuery,
  useGetAiProviderModelsQuery,
  usePreviewAiProviderModelsMutation,
  useCreateAiProviderMutation,
  useUpdateAiProviderMutation,
  useDeleteAiProviderMutation,
  useTestAiProviderMutation,
} = adminApi;
