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
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/contracts", params }),
      providesTags: ["PortalContracts"],
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
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
} = portalApi;
