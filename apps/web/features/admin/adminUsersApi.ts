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
  roles?: string;
  department?: TaskDepartment;
  status?: "active" | "inactive";
  lastLogin?: string;
  excludeRole?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserDetail extends AdminUserItem {
  phoneWhatsapp?: string | null;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  activeRequestsCount?: number;
  activeTasksCount?: number;
  activeProjectsCount?: number;
  updatedAt?: string;
  activeSessionsCount?: number;
  securityEventsCount?: number;
  performance?: {
    workloadStatus: string;
    avgCompletionSpeedDays: number;
    avgQualityScore: number;
    tasksCompleted: number;
  };
}

export interface AdminPermission {
  id: string;
  name: string;
}

export interface AdminUserPermissions {
  permissions: AdminPermission[];
  assignedPermissionIds: string[];
  canAssignPermissionIds: string[];
}

export interface AdminUserActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
}

export interface PaginatedAdminUserActivity {
  items: AdminUserActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserWork {
  projects: Array<{ id: string; name: string; status: string; clientName: string }>;
  tasks: Array<{ id: string; title: string; status: string; projectName: string }>;
  disputes: Array<{ id: string; title: string; status: string; priority: string }>;
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    status: string;
    startDate: string;
    endDate: string | null;
    clientName: string;
    projectName: string | null;
  }>;
}

export interface AdminUserMetric {
  key: string;
  value: number;
  format: "number";
}

export interface AdminUserOverview {
  profile: AdminUserDetail;
  kpis: AdminUserMetric[];
  performance: {
    sectionCode: string;
    metrics: AdminUserMetric[];
  };
  work: AdminUserWork;
}

export interface AdminSessionRevokeResult {
  revoked: true;
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

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneWhatsapp?: string;
  department?: TaskDepartment;
}

export interface SuspendAdminUserPayload {
  id: string;
  reason: string;
  suspendedUntil?: string;
}

export interface ReactivateAdminUserPayload {
  id: string;
  reason: string;
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
        if (filters.roles) params.set("roles", filters.roles);
        if (filters.department) params.set("department", filters.department);
        if (filters.status) params.set("status", filters.status);
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

    getAdminUserOverview: builder.query<AdminUserOverview, string>({
      query: (id) => `/admin/users/${id}/overview`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    getAdminUserPermissions: builder.query<AdminUserPermissions, string>({
      query: (id) => `/admin/users/${id}/permissions`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    getAdminUserActivity: builder.query<PaginatedAdminUserActivity, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 20 }) => `/admin/users/${id}/activity?page=${page}&limit=${limit}`,
      providesTags: (_result, _error, params) => [
        { type: "AdminUserActivity", id: params.id },
      ],
    }),

    getAdminUserPerformance: builder.query<
      AdminUserDetail["performance"],
      string
    >({
      query: (id) => `/admin/users/${id}/performance`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    getAdminUserWork: builder.query<AdminUserWork, string>({
      query: (id) => `/admin/users/${id}/work`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),

    createAdminUser: builder.mutation<AdminUserItem, CreateAdminUserPayload>({
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

    suspendAdminUser: builder.mutation<void, SuspendAdminUserPayload>({
      query: ({ id, reason, suspendedUntil }) => ({
        url: `/admin/users/${id}/suspend`,
        method: "POST",
        body: { reason, suspendedUntil },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminUser", id },
        "AdminUsers",
      ],
    }),

    reactivateAdminUser: builder.mutation<void, ReactivateAdminUserPayload>({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/reactivate`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminUser", id },
        "AdminUsers",
      ],
    }),

    impersonateAdminUser: builder.mutation<
      { expiresAt: string },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/impersonate`,
        method: "POST",
        body: { reason },
      }),
    }),

    revokeAdminUserSessions: builder.mutation<{ revokedCount: number }, string>({
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

    revokeAdminSession: builder.mutation<AdminSessionRevokeResult, string>({
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
  useGetAdminUserOverviewQuery,
  useGetAdminUserPermissionsQuery,
  useGetAdminUserActivityQuery,
  useGetAdminUserPerformanceQuery,
  useGetAdminUserWorkQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useResetAdminUserPasswordMutation,
  useSuspendAdminUserMutation,
  useReactivateAdminUserMutation,
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
