"use client";

import { baseApi } from "@/lib/api/base-api";

export type AdminReportQuery = { from?: string; to?: string };

export const adminReportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSalesReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/sales", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminRevenueReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/revenue", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminProjectsReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/projects", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminTeamPerformanceReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/team-performance", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminSatisfactionReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/satisfaction", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminCampaignsReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/campaigns", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminLeadsReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/leads", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminClientsReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/clients", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminSystemHealthReport: builder.query<unknown, AdminReportQuery | void>({ query: (params) => ({ url: "/admin/reports/system-health", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    getAdminReportSnapshots: builder.query<unknown, { reportType?: string; period?: string; limit?: number } | void>({ query: (params) => ({ url: "/admin/reports/snapshots", params: params ?? undefined }), providesTags: ["AdminReports"] }),
    saveAdminReportSnapshot: builder.mutation<unknown, { reportType: string; period: string }>({ query: (body) => ({ url: "/admin/reports/snapshots", method: "POST", body }), invalidatesTags: ["AdminReports"] }),
    exportAdminReport: builder.query<unknown, { type: string; format: string; from?: string; to?: string }>({ query: (params) => ({ url: "/admin/reports/export", params }), providesTags: ["AdminReports"] }),
  }),
});

export const {
  useGetAdminSalesReportQuery,
  useGetAdminRevenueReportQuery,
  useGetAdminProjectsReportQuery,
  useGetAdminTeamPerformanceReportQuery,
  useGetAdminSatisfactionReportQuery,
  useGetAdminCampaignsReportQuery,
  useGetAdminLeadsReportQuery,
  useGetAdminClientsReportQuery,
  useGetAdminSystemHealthReportQuery,
  useGetAdminReportSnapshotsQuery,
  useSaveAdminReportSnapshotMutation,
  useLazyExportAdminReportQuery,
} = adminReportsApi;
