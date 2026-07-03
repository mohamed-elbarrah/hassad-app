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
  before: any;
  after: any;
  metadata: any;
  createdAt: string;
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
  action: "activate" | "deactivate" | "changeRole" | "reassignDepartment" | "export";
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

export interface AlertItem {
  count: number;
  label: string;
  link: string;
}

export interface AlertsData {
  overdueTasks: AlertItem;
  agedInvoices: AlertItem;
  escalatedDisputes: AlertItem;
  failedWebhooks: AlertItem;
  expiringContracts: AlertItem;
  pendingRequests: AlertItem;
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
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/audit-log?${params.toString()}`;
      },
      providesTags: ["AuditLog"],
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

    revokeUserSessions: builder.mutation<
      { revokedCount: number },
      string
    >({
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminUser", id },
      ],
    }),

    // ── Admin Sessions ──────────────────────────────────────────────────────

    getAdminSessions: builder.query<PaginatedSessions, { userId?: string; page?: number; limit?: number }>({
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
      { userId?: string; type?: string; from?: string; to?: string; page?: number; limit?: number }
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

  }),
});

export const {
  // Existing
  useGetAdminStatsQuery,
  useGetHealthQuery,
  useGetAuditLogQuery,
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
} = adminApi;
