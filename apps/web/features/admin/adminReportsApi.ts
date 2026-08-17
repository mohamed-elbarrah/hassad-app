import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminReportSales {
  totalLeads: number;
  leadsByStage: Array<{ stage: string; count: number }>;
  conversionRate: number;
  leadsBySource: Array<{ source: string; count: number }>;
  topSalesPeople: Array<{
    userId: string | null;
    name: string | null;
    email: string | null;
    count: number;
  }>;
}

export interface AdminReportRevenue {
  monthlyRevenue: Array<{ month: string; total: number }>;
  paidVsUnpaid: {
    paid: { count: number; total: number };
    unpaid: { count: number; total: number };
  };
  avgInvoiceValue: number;
  topClients: Array<{
    clientId: string;
    companyName: string | null;
    total: number;
    invoiceCount: number;
  }>;
}

export interface AdminReportProjects {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  avgDuration: number;
  overdueCount: number;
  completionRate: number;
}

export interface AdminReportTeamPerformance {
  team: Array<{
    userId: string;
    userName: string | null;
    userEmail: string | null;
    activeTasksCount: number;
    workloadStatus: string;
    avgCompletionSpeedDays: number;
    avgQualityScore: number;
    tasksCompleted: number;
  }>;
}

export interface AdminReportSatisfaction {
  avgScore: number;
  ratingsByScore: Array<{ score: number; count: number }>;
  trend: Array<{ month: string; avgScore: number; count: number }>;
}

export interface AdminReportCampaigns {
  totalByStatus: Array<{ status: string; count: number }>;
  totalBudget: number;
  totalSpent: number;
  avgROI: number;
  platformBreakdown: Array<{
    platform: string;
    count: number;
    budgetTotal: number;
    budgetSpent: number;
  }>;
}

export interface AdminReportClients {
  clients: Array<{
    id: string;
    companyName: string;
    status: string;
    totalProjects: number;
    totalContractValue: number;
    totalPaid: number;
    avgSatisfactionScore: number | null;
    createdAt: string;
  }>;
  satisfaction: { avgScore: number; totalRatings: number };
}

export interface AdminReportSystemHealth {
  gateways: Array<{
    id: string;
    provider: string;
    type: string;
    healthStatus: string;
    totalPayments: number;
  }>;
  externalServices: Array<{
    serviceName: string;
    status: string;
    responseTime: number | null;
    lastCheckedAt: string;
    consecutiveFailures: number;
  }>;
}

export const adminReportsApi = createApi({
  reducerPath: "adminReportsApi",
  baseQuery,
  tagTypes: ["AdminReports"],
  endpoints: (builder) => ({
    getAdminReportSales: builder.query<
      AdminReportSales,
      { from?: string; to?: string } | void
    >({
      query: (params) => {
        if (!params) return "/admin/reports/sales";
        const searchParams = new URLSearchParams();
        if (params.from) searchParams.set("from", params.from);
        if (params.to) searchParams.set("to", params.to);
        return `/admin/reports/sales?${searchParams.toString()}`;
      },
      providesTags: ["AdminReports"],
    }),

    getAdminReportRevenue: builder.query<
      AdminReportRevenue,
      { from?: string; to?: string } | void
    >({
      query: (params) => {
        if (!params) return "/admin/reports/revenue";
        const searchParams = new URLSearchParams();
        if (params.from) searchParams.set("from", params.from);
        if (params.to) searchParams.set("to", params.to);
        return `/admin/reports/revenue?${searchParams.toString()}`;
      },
      providesTags: ["AdminReports"],
    }),

    getAdminReportProjects: builder.query<
      AdminReportProjects,
      { from?: string; to?: string } | void
    >({
      query: (params) => {
        if (!params) return "/admin/reports/projects";
        const searchParams = new URLSearchParams();
        if (params.from) searchParams.set("from", params.from);
        if (params.to) searchParams.set("to", params.to);
        return `/admin/reports/projects?${searchParams.toString()}`;
      },
      providesTags: ["AdminReports"],
    }),

    getAdminReportSatisfaction: builder.query<
      AdminReportSatisfaction,
      { from?: string; to?: string } | void
    >({
      query: (params) => {
        if (!params) return "/admin/reports/satisfaction";
        const searchParams = new URLSearchParams();
        if (params.from) searchParams.set("from", params.from);
        if (params.to) searchParams.set("to", params.to);
        return `/admin/reports/satisfaction?${searchParams.toString()}`;
      },
      providesTags: ["AdminReports"],
    }),
  }),
});

export const {
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportSatisfactionQuery,
} = adminReportsApi;
