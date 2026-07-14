import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { UserRole, TaskDepartment } from "@hassad/shared";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  department?: TaskDepartment | null;
  lastLoginAt?: string | null;
  createdAt: string;
  activeTasksCount?: number;
  activeProjectsCount?: number;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
  department?: TaskDepartment;
  isActive?: boolean;
  lastLogin?: string;
  excludeRole?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserDetail extends AdminUserItem {
  activeSessionsCount?: number;
  securityEventsCount?: number;
  performance?: {
    avgCompletionSpeedDays: number;
    avgQualityScore: number;
    tasksCompleted: number;
  };
}

export interface AdminUserActivity {
  id: string;
  action: string;
  entityType: string;
  entityLabel: string;
  createdAt: string;
}

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

export interface PaginatedAdminSessions {
  items: AdminSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSessionFilters {
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminSecurityEvent {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  type: string;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface PaginatedAdminSecurityEvents {
  items: AdminSecurityEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminSecurityEventFilters {
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminSecurityStats {
  totalEvents: number;
  failedLogins24h: number;
  impersonations7d: number;
  passwordResets7d: number;
  activeSessions: number;
  twoFactorEnabled: number;
}

export interface AdminTeamWorkloadItem {
  userId: string;
  userName: string;
  activeTasksCount: number;
  workloadStatus: string;
  avgCompletionSpeedDays: number | null;
  avgQualityScore: number | null;
}

export interface AdminTeamWorkloadSummary {
  available: number;
  busy: number;
  overloaded: number;
}

export interface AdminTeamWorkload {
  items: AdminTeamWorkloadItem[];
  summary: AdminTeamWorkloadSummary;
}

export const adminUsersApi = createApi({
  reducerPath: "adminUsersApi",
  baseQuery,
  tagTypes: [
    "AdminUsers",
    "AdminUser",
    "AdminUserActivity",
    "AdminSessions",
    "AdminSecurity",
    "AdminTeamWorkload",
  ],
  endpoints: (builder) => ({
    getAdminUsers: builder.query<PaginatedAdminUsers, AdminUserFilters | void>({
      query: (filters) => {
        if (!filters) return "/admin/users";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.role) params.set("role", filters.role);
        if (filters.department) params.set("department", filters.department);
        if (filters.isActive !== undefined)
          params.set("isActive", String(filters.isActive));
        if (filters.lastLogin) params.set("lastLogin", filters.lastLogin);
        if (filters.excludeRole) params.set("excludeRole", filters.excludeRole);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ["AdminUsers"],
    }),

    getAdminUserById: builder.query<AdminUserDetail, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    getAdminUserActivity: builder.query<AdminUserActivity[], string>({
      query: (id) => `/admin/users/${id}/activity`,
      providesTags: (_result, _error, id) => [
        { type: "AdminUserActivity", id },
      ],
    }),

    getAdminUserPerformance: builder.query<
      AdminUserDetail["performance"],
      string
    >({
      query: (id) => `/admin/users/${id}/performance`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    createAdminUser: builder.mutation<AdminUserItem, Partial<AdminUserItem>>({
      query: (body) => ({ url: "/admin/users", method: "POST", body }),
      invalidatesTags: ["AdminUsers"],
    }),

    updateAdminUser: builder.mutation<
      AdminUserItem,
      { id: string; body: Partial<AdminUserItem> }
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

    resetAdminUserPassword: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}/reset-password`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    impersonateAdminUser: builder.mutation<
      { token: string },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/impersonate`,
        method: "POST",
        body: { reason },
      }),
    }),

    revokeAdminUserSessions: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}/revoke-sessions`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "AdminUser", id },
        "AdminSessions",
      ],
    }),

    updateAdminUserPermissions: builder.mutation<
      void,
      { id: string; permissionKeys: string[] }
    >({
      query: ({ id, permissionKeys }) => ({
        url: `/admin/users/${id}/permissions`,
        method: "POST",
        body: { permissionKeys },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminUser", id }],
    }),

    getAdminSessions: builder.query<
      PaginatedAdminSessions,
      AdminSessionFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/sessions";
        const params = new URLSearchParams();
        if (filters.userId) params.set("userId", filters.userId);
        if (filters.search) params.set("search", filters.search);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/sessions?${params.toString()}`;
      },
      providesTags: ["AdminSessions"],
    }),

    revokeAdminSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/sessions/${id}/revoke`,
        method: "POST",
      }),
      invalidatesTags: ["AdminSessions"],
    }),

    getAdminSecurityEvents: builder.query<
      PaginatedAdminSecurityEvents,
      AdminSecurityEventFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/security/events";
        const params = new URLSearchParams();
        if (filters.userId) params.set("userId", filters.userId);
        if (filters.type) params.set("type", filters.type);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/security/events?${params.toString()}`;
      },
      providesTags: ["AdminSecurity"],
    }),

    getAdminSecurityStats: builder.query<AdminSecurityStats, void>({
      query: () => "/admin/security/stats",
      providesTags: ["AdminSecurity"],
    }),

    getAdminTeamWorkload: builder.query<AdminTeamWorkload, void>({
      query: () => "/admin/team/workload",
      providesTags: ["AdminTeamWorkload"],
    }),

    getAdminUserWorkload: builder.query<AdminTeamWorkloadItem, string>({
      query: (userId) => `/admin/team/workload/${userId}`,
      providesTags: ["AdminTeamWorkload"],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useGetAdminUserActivityQuery,
  useGetAdminUserPerformanceQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useResetAdminUserPasswordMutation,
  useImpersonateAdminUserMutation,
  useRevokeAdminUserSessionsMutation,
  useUpdateAdminUserPermissionsMutation,
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
  useGetAdminSecurityEventsQuery,
  useGetAdminSecurityStatsQuery,
  useGetAdminTeamWorkloadQuery,
  useGetAdminUserWorkloadQuery,
} = adminUsersApi;
