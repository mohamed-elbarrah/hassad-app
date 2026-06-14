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

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: ["AdminStats", "AdminSettings", "AuditLog"],
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetHealthQuery,
  useGetAuditLogQuery,
  useGetAuditFiltersQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} = adminApi;
