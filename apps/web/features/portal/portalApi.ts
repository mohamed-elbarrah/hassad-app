import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  statusAr: string;
  progress: number;
  startDate: string;
  endDate: string;
  projectManager: {
    id: string;
    name: string;
    isOnline: boolean;
  } | null;
}

export interface ProjectProgress {
  projects: ProjectSummary[];
  overallProgress: number;
  totalProjects: number;
  activeProjects: number;
}

export interface PortalDashboardSummary {
  totalContracts: number;
  totalContractValue: number;
  totalOutstanding: number;
  activeProjects: number;
  activeCampaigns: number;
}

export interface PortalDashboard {
  summary: PortalDashboardSummary;
  recentContracts: any[];
  recentInvoices: any[];
  recentProjects: any[];
  recentCampaigns: any[];
  projectProgress: ProjectProgress | null;
}

export interface ActionItem {
  id: string;
  type:
    | "DELIVERABLE_APPROVAL"
    | "INVOICE_PAYMENT"
    | "PROPOSAL_REVIEW"
    | "CONTRACT_SIGN";
  title: string;
  subtitle: string;
  actionUrl: string;
  dueDate?: string;
  priority: "high" | "normal" | "low";
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  date: string;
  text: string;
  icon: "palette" | "file" | "trending" | "check" | "dollar";
}

export interface CampaignSummary {
  totalVisits: number;
  totalConversions: number;
  avgRoas: number;
  improvementPercent: number;
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpc: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  roas: number;
}

export interface PortalCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  startDate: string;
  endDate?: string;
  budgetTotal: number;
  budgetSpent: number;
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface PortalCampaignKpiSnapshot {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpc: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  roas: number;
  source: string | null;
  recordedAt: string;
}

export interface PortalCampaignDetail extends PortalCampaign {
  kpiSnapshots: PortalCampaignKpiSnapshot[];
}

export interface PortalProjectList {
  data: ProjectSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PortalRequestServiceSummary {
  id: string;
  quantity: number;
  name: string;
  nameAr?: string | null;
}

export interface PortalRequestDocumentSummary {
  id: string;
  title: string;
  status: string;
  url?: string | null;
  sentAt?: string | null;
  signedAt?: string | null;
}

export interface PortalRequestSummary {
  id: string;
  companyName: string;
  contactName: string;
  notes?: string | null;
  status: string;
  statusLabel: string;
  stageLabel: string;
  createdAt: string;
  updatedAt: string;
  services: PortalRequestServiceSummary[];
  latestProposal?: PortalRequestDocumentSummary | null;
  latestContract?: PortalRequestDocumentSummary | null;
}

export interface PortalRequestList {
  data: PortalRequestSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PortalInvoiceSummary {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  dueDate: string;
  issueDate?: string;
  contract?: { id: string; title: string } | null;
  payments?: { amount: number; status: string }[];
}

export interface PortalFinanceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  nextInvoiceDueDate: string | null;
  nextInvoiceAmount: number;
}

export interface PortalContractSummary {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  proposal?: { id: string; title: string } | null;
  projectManager?: string | null;
}

export interface ReportKpiCard {
  metric: string;
  label: string;
  value: number;
  previousValue: number;
  trendPercent: number | null;
}

export interface ReportSmartTip {
  type: "budget" | "warning" | "insight";
  title: string;
  description: string;
}

export interface ReportTopCampaign {
  id: string;
  name: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  spend: number;
}

export interface ReportPlatformDistribution {
  platform: string;
  spend: number;
  percent: number;
}

export interface ReportSummary {
  kpiCards: ReportKpiCard[];
  smartTips: ReportSmartTip[];
  topCampaigns: ReportTopCampaign[];
  platformDistribution: ReportPlatformDistribution[];
  period: { dateFrom: string | null; dateTo: string | null };
}

export interface ReportTimelineDataset {
  label: string;
  data: number[];
  metric: string;
}

export interface ReportTimeline {
  labels: string[];
  datasets: ReportTimelineDataset[];
}

export interface ReviewProject {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  statusAr: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; isOnline: boolean } | null;
  taskCount: number;
  deliverableCount: number;
}

export interface ProjectReviewRevision {
  id: string;
  comment: string;
  createdAt: string;
  client: { id: string; companyName: string };
}

export interface ProjectReviewDetail {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  clientId: string;
  projectManagerId?: string | null;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; isOnline: boolean } | null;
  files: {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    url?: string;
  }[];
  revisionRequests: ProjectReviewRevision[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleType: "SALES" | "PM" | "ACCOUNT_MANAGER";
  isOnline: boolean;
  avatarUrl?: string | null;
}

export interface TeamMembersResponse {
  members: TeamMember[];
}

export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery,
  tagTypes: [
    "PortalDashboard",
    "ProjectProgress",
    "PortalCampaigns",
    "ActionItems",
    "ActivityFeed",
    "CampaignSummary",
    "PortalCampaign",
    "PortalProjects",
    "PortalRequests",
    "PortalInvoices",
    "PortalContracts",
    "PortalReports",
    "ReviewProjects",
    "TeamMembers",
    "PortalStrategies",
  ],
  endpoints: (builder) => ({
    getPortalDashboard: builder.query<PortalDashboard, void>({
      query: () => "/portal/dashboard",
      providesTags: ["PortalDashboard"],
    }),
    getPortalFinanceSummary: builder.query<PortalFinanceSummary, void>({
      query: () => "/portal/finance/summary",
      providesTags: ["PortalInvoices"],
    }),
    getProjectProgress: builder.query<ProjectProgress | null, void>({
      query: () => "/portal/project-progress",
      providesTags: ["ProjectProgress"],
    }),
    getPortalProjects: builder.query<
      PortalProjectList,
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/projects", params }),
      providesTags: ["PortalProjects"],
    }),
    getPortalRequests: builder.query<
      PortalRequestList,
      { page?: number; limit?: number } | void
    >({
      query: (params) =>
        params
          ? { url: "/portal/requests", params }
          : { url: "/portal/requests" },
      providesTags: ["PortalRequests"],
    }),
    getPortalCampaigns: builder.query<PortalCampaign[], void>({
      query: () => "/portal/campaigns",
      providesTags: ["PortalCampaigns"],
    }),
    getPortalCampaign: builder.query<PortalCampaignDetail, string>({
      query: (id) => `/portal/campaigns/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PortalCampaign", id }],
    }),
    getActionItems: builder.query<
      { items: ActionItem[]; total: number; page: number; limit: number },
      { type?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/action-items", params }),
      providesTags: ["ActionItems"],
    }),
    getActivityFeed: builder.query<{ items: ActivityFeedItem[] }, void>({
      query: () => "/portal/activity-feed",
      providesTags: ["ActivityFeed"],
    }),
    getCampaignSummary: builder.query<CampaignSummary, void>({
      query: () => "/portal/campaigns/summary",
      providesTags: ["CampaignSummary"],
    }),
    getPortalInvoices: builder.query<
      {
        data: PortalInvoiceSummary[];
        total: number;
        page: number;
        limit: number;
      },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/invoices", params }),
      providesTags: ["PortalInvoices"],
    }),
    getPortalContracts: builder.query<
      {
        data: PortalContractSummary[];
        total: number;
        page: number;
        limit: number;
      },
      {
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: "/portal/contracts", params }),
      providesTags: ["PortalContracts"],
    }),

    getPortalContractById: builder.query<any, string>({
      query: (id) => `/portal/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PortalContracts", id }],
    }),
    snoozeActionItem: builder.mutation<
      { id: string; snoozedUntil: string },
      { itemType: string; itemId: string; hours?: number }
    >({
      query: (body) => ({
        url: "/portal/action-items/snooze",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ActionItems"],
    }),
    unsnoozeActionItem: builder.mutation<
      { success: boolean },
      { itemType: string; itemId: string }
    >({
      query: ({ itemType, itemId }) => ({
        url: `/portal/action-items/snooze/${itemType}/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ActionItems"],
    }),
    getPortalReports: builder.query<ReportSummary, void>({
      query: () => "/portal/reports",
      providesTags: ["PortalReports"],
    }),
    getReportTimeline: builder.query<
      ReportTimeline,
      {
        dateFrom?: string;
        dateTo?: string;
        granularity?: "day" | "week" | "month";
      } | void
    >({
      query: (params) =>
        params
          ? { url: "/portal/reports/timeline", params }
          : { url: "/portal/reports/timeline" },
      providesTags: ["PortalReports"],
    }),

    getReviewProjects: builder.query<ReviewProject[], void>({
      query: () => "/portal/projects/review",
      providesTags: ["ReviewProjects"],
    }),

    getProjectReviewDetail: builder.query<ProjectReviewDetail, string>({
      query: (id) => `/portal/projects/${id}/review-detail`,
      providesTags: (_result, _error, id) => [{ type: "ReviewProjects", id }],
    }),

    approveProject: builder.mutation<any, string>({
      query: (id) => ({
        url: `/portal/projects/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["ReviewProjects", "ProjectProgress", "PortalProjects"],
    }),

    requestProjectRevision: builder.mutation<
      any,
      { id: string; comment: string }
    >({
      query: ({ id, comment }) => ({
        url: `/portal/projects/${id}/request-revision`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: ["ReviewProjects", "ProjectProgress", "PortalProjects"],
    }),

    getProjectRevisions: builder.query<ProjectReviewRevision[], string>({
      query: (id) => `/portal/projects/${id}/revisions`,
    }),

    getTeamMembers: builder.query<TeamMembersResponse, void>({
      query: () => "/portal/team-members",
      providesTags: ["TeamMembers"],
    }),

    // ── Marketing Strategy Portal Endpoints ────────────────────────────

    getClientStrategies: builder.query<any[], void>({
      query: () => "/portal/marketing-strategies",
      providesTags: ["PortalStrategies"],
    }),

    getClientStrategy: builder.query<any, string>({
      query: (id) => `/portal/marketing-strategies/${id}`,
      providesTags: (result, error, id) => [{ type: "PortalStrategies", id }],
    }),

    approveStrategy: builder.mutation<any, string>({
      query: (id) => ({
        url: `/portal/marketing-strategies/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["PortalStrategies", "ActionItems"],
    }),

    requestStrategyRevision: builder.mutation<
      any,
      { id: string; comment: string }
    >({
      query: ({ id, comment }) => ({
        url: `/portal/marketing-strategies/${id}/request-revision`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: ["PortalStrategies", "ActionItems"],
    }),
  }),
});

export const {
  useGetPortalDashboardQuery,
  useGetPortalFinanceSummaryQuery,
  useGetProjectProgressQuery,
  useGetPortalProjectsQuery,
  useGetPortalRequestsQuery,
  useGetPortalCampaignsQuery,
  useGetPortalCampaignQuery,
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useGetPortalInvoicesQuery,
  useGetPortalContractsQuery,
  useGetPortalContractByIdQuery,
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
  useGetPortalReportsQuery,
  useGetReportTimelineQuery,
  useGetReviewProjectsQuery,
  useGetProjectReviewDetailQuery,
  useApproveProjectMutation,
  useRequestProjectRevisionMutation,
  useGetProjectRevisionsQuery,
  useGetTeamMembersQuery,
  // Strategy hooks
  useGetClientStrategiesQuery,
  useGetClientStrategyQuery,
  useApproveStrategyMutation,
  useRequestStrategyRevisionMutation,
} = portalApi;
