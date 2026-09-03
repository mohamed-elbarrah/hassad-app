import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminReportRange {
  from?: string;
  to?: string;
}

function reportUrl(path: string, params?: AdminReportRange | void) {
  if (!params || (!params.from && !params.to)) return path;
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  return `${path}?${searchParams.toString()}`;
}

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

/** Persisted aggregate payload produced by the scheduled full report snapshot. */
export interface AdminReportSnapshotTasks {
  byStatus: Array<{ status: string; count: number }>;
  total: number;
  overdueTasks: number;
  blockedTasks: number;
  revisionLoops: number;
  slaCompliance: number;
  teamThroughputByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    tasksCompleted: number;
  }>;
}

export interface AdminReportSnapshotSystem {
  failedWebhooks: number;
  failedNotifications: number;
  notificationFailureRate: number;
  securityEventDistribution: Array<{ type: string; count: number }>;
  impersonationCount: number;
  errorDistribution: Array<{
    level: string;
    category: string;
    count: number;
  }>;
}

export interface AdminReportSnapshotData {
  sales?: AdminReportSales;
  clients?: AdminReportClients;
  projects?: AdminReportProjects;
  finance?: AdminReportRevenue;
  tasks?: AdminReportSnapshotTasks;
  system?: AdminReportSnapshotSystem;
}

export interface AdminReportSnapshot {
  id: string;
  reportType: "all" | "sales" | "clients" | "projects" | "tasks" | "system-health" | "finance";

  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  periodStart: string;
  periodEnd: string;
  data: AdminReportSnapshotData;
  generatedAt: string;
  createdAt: string;
  change: Record<string, number> | null;
}

export const adminReportsApi = createApi({
  reducerPath: "adminReportsApi",
  baseQuery,
  tagTypes: ["AdminReports"],
  endpoints: (builder) => ({
    getAdminReportSales: builder.query<
      AdminReportSales,
      AdminReportRange | void
    >({
      query: (params) => reportUrl("/admin/reports/sales", params),
      providesTags: ["AdminReports"],
    }),

    getAdminReportRevenue: builder.query<
      AdminReportRevenue,
      AdminReportRange | void
    >({
      query: (params) => reportUrl("/admin/reports/revenue", params),
      providesTags: ["AdminReports"],
    }),

    getAdminReportProjects: builder.query<
      AdminReportProjects,
      AdminReportRange | void
    >({
      query: (params) => reportUrl("/admin/reports/projects", params),
      providesTags: ["AdminReports"],
    }),

    getAdminReportSatisfaction: builder.query<
      AdminReportSatisfaction,
      AdminReportRange | void
    >({
      query: (params) => reportUrl("/admin/reports/satisfaction", params),
      providesTags: ["AdminReports"],
    }),

    getAdminReportSnapshots: builder.query<AdminReportSnapshot[], void>({
      query: () => "/admin/reports/snapshots?limit=12",
      providesTags: ["AdminReports"],
    }),
  }),
});

export const {
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportSatisfactionQuery,
  useGetAdminReportSnapshotsQuery,
} = adminReportsApi;
