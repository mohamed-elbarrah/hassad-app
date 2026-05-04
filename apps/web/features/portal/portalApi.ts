import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface DeliverableSummary {
  id: string;
  title: string;
  titleAr?: string | null;
  status: string;
  statusAr: string;
  createdAt: string;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  currentPhase: string;
  projectManager: {
    id: string;
    name: string;
    isOnline: boolean;
  } | null;
  deliverables: DeliverableSummary[];
  startDate: string;
  endDate: string;
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
  type: "DELIVERABLE_APPROVAL" | "INVOICE_PAYMENT" | "PROPOSAL_REVIEW" | "CONTRACT_SIGN";
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

export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery,
  tagTypes: ["PortalDashboard", "ProjectProgress", "PortalCampaigns", "ActionItems", "ActivityFeed", "CampaignSummary"],
  endpoints: (builder) => ({
    getPortalDashboard: builder.query<PortalDashboard, void>({
      query: () => "/portal/dashboard",
      providesTags: ["PortalDashboard"],
    }),
    getProjectProgress: builder.query<ProjectProgress | null, void>({
      query: () => "/portal/project-progress",
      providesTags: ["ProjectProgress"],
    }),
    getPortalCampaigns: builder.query<PortalCampaign[], void>({
      query: () => "/portal/campaigns",
      providesTags: ["PortalCampaigns"],
    }),
    getActionItems: builder.query<{ items: ActionItem[] }, void>({
      query: () => "/portal/action-items",
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
    snoozeActionItem: builder.mutation<{ id: string; snoozedUntil: string }, { itemType: string; itemId: string; hours?: number }>({
      query: (body) => ({ url: "/portal/action-items/snooze", method: "POST", body }),
      invalidatesTags: ["ActionItems"],
    }),
    unsnoozeActionItem: builder.mutation<{ success: boolean }, { itemType: string; itemId: string }>({
      query: ({ itemType, itemId }) => ({ url: `/portal/action-items/snooze/${itemType}/${itemId}`, method: "DELETE" }),
      invalidatesTags: ["ActionItems"],
    }),
  }),
});

export const {
  useGetPortalDashboardQuery,
  useGetProjectProgressQuery,
  useGetPortalCampaignsQuery,
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
} = portalApi;