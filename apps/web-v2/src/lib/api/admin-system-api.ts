"use client";

import { baseApi } from "@/lib/api/base-api";

export const adminSystemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminAuditLog: builder.query<unknown, Record<string, unknown> | void>({ query: (params) => ({ url: "/admin/audit-log", params: params ?? undefined }), providesTags: ["AdminSystem"] }),
    getAdminAuditFilters: builder.query<unknown, void>({ query: () => "/admin/audit-log/filters", providesTags: ["AdminSystem"] }),
    getAdminSecurityEvents: builder.query<unknown, Record<string, unknown> | void>({ query: (params) => ({ url: "/admin/security/events", params: params ?? undefined }), providesTags: ["AdminSystem"] }),
    getAdminSecurityStats: builder.query<unknown, void>({ query: () => "/admin/security/stats", providesTags: ["AdminSystem"] }),
    getAdminSessions: builder.query<unknown, Record<string, unknown> | void>({ query: (params) => ({ url: "/admin/sessions", params: params ?? undefined }), providesTags: ["AdminSystem"] }),
    revokeAdminSession: builder.mutation<unknown, string>({ query: (id) => ({ url: `/admin/sessions/${id}/revoke`, method: "POST" }), invalidatesTags: ["AdminSystem"] }),
    getAdminSystemEvents: builder.query<unknown, Record<string, unknown> | void>({ query: (params) => ({ url: "/admin/events", params: params ?? undefined }), providesTags: ["AdminSystem"] }),
    getAdminSystemEventStats: builder.query<unknown, void>({ query: () => "/admin/events/stats", providesTags: ["AdminSystem"] }),
    resolveAdminSystemEvent: builder.mutation<unknown, string>({ query: (id) => ({ url: `/admin/events/${id}/resolve`, method: "POST" }), invalidatesTags: ["AdminSystem"] }),
    getAdminNotificationTemplates: builder.query<unknown, Record<string, unknown> | void>({ query: (params) => ({ url: "/admin/notification-templates", params: params ?? undefined }), providesTags: ["AdminSystem"] }),
  }),
});

export const {
  useGetAdminAuditLogQuery,
  useGetAdminAuditFiltersQuery,
  useGetAdminSecurityEventsQuery,
  useGetAdminSecurityStatsQuery,
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
  useGetAdminSystemEventsQuery,
  useGetAdminSystemEventStatsQuery,
  useResolveAdminSystemEventMutation,
  useGetAdminNotificationTemplatesQuery,
} = adminSystemApi;
