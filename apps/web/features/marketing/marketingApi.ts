import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import { Campaign, CampaignAnalytics, CampaignPlatform, CreateCampaignInput, UpdateCampaignMetricsInput } from "@hassad/shared";

export interface MarketingCampaign extends Campaign {
  client?: { id: string; companyName: string | null } | null;
  analytics: CampaignAnalytics;
}
export interface CampaignListResponse { items: MarketingCampaign[]; total: number; page: number; limit: number; totalPages: number; }
export interface CampaignListQuery { page: number; limit: number; status?: Campaign["status"]; platform?: CampaignPlatform; search?: string; sortBy?: "name" | "createdAt" | "startDate" | "budgetTotal" | "budgetSpent"; sortOrder?: "asc" | "desc"; }
export interface MarketingKpiSnapshot { id: string; campaignId: string; impressions: number; clicks: number; conversions: number; revenue: number; cpc: number; cpa: number; ctr: number; conversionRate: number; roas: number; source: string | null; recordedAt: string; createdAt: string; }
export interface MarketingKpiHistoryResponse { items: MarketingKpiSnapshot[]; total: number; page: number; limit: number; totalPages: number; }

export interface MarketingStrategy {
  id: string;
  taskId: string;
  createdBy: string;
  clientId: string;
  projectId: string | null;
  status: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  revisionNote: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Flatten analytics fields from API response into campaign object */
function flattenCampaignAnalytics(campaign: MarketingCampaign): MarketingCampaign & CampaignAnalytics {
  return { ...campaign, impressions: campaign.analytics?.impressions ?? 0, clicks: campaign.analytics?.clicks ?? 0, conversions: campaign.analytics?.conversions ?? 0, revenue: campaign.analytics?.revenue ?? 0, roas: campaign.analytics?.roas ?? 0, ctr: campaign.analytics?.ctr ?? 0, cpc: campaign.analytics?.cpc ?? 0, cpa: campaign.analytics?.cpa ?? 0, conversionRate: campaign.analytics?.conversionRate ?? 0 };
}

export const marketingApi = createApi({
  reducerPath: "marketingApi",
  baseQuery,
  tagTypes: ["Campaign", "TaskCampaigns", "TaskStrategy", "Strategy"],
  endpoints: (builder) => ({
    // ── Campaign Endpoints ───────────────────────────────────────────────

    getCampaignsByTask: builder.query<Campaign[], string>({
      query: (taskId) => `tasks/${taskId}/campaigns`,
      providesTags: (result, error, taskId) => [
        { type: "TaskCampaigns", id: taskId },
      ],
      transformResponse: (baseQueryReturnValue: MarketingCampaign[]) => (baseQueryReturnValue || []).map(flattenCampaignAnalytics),
    }),
    getCampaign: builder.query<MarketingCampaign, string>({
      query: (id) => `marketing/campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: "Campaign", id }],
      transformResponse: (baseQueryReturnValue: MarketingCampaign) => flattenCampaignAnalytics(baseQueryReturnValue),
    }),
    getCampaigns: builder.query<CampaignListResponse, CampaignListQuery>({
      query: ({ page, limit, status, platform, search, sortBy, sortOrder }) => ({ url: "marketing/campaigns", params: { page, limit, status, platform, search, sortBy, sortOrder } }),
      providesTags: (result) => ["Campaign", ...(result?.items ?? []).map(({ id }) => ({ type: "Campaign" as const, id }))],
    }),
    getMyCampaignStats: builder.query<
      { activeCampaigns: number; totalBudgetUsed: number; avgRoas: number },
      void
    >({
      query: () => "campaigns/my-stats",
      providesTags: ["Campaign"],
    }),
    createCampaign: builder.mutation<Campaign, CreateCampaignInput>({
      query: (body) => ({
        url: "marketing/campaigns",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "TaskCampaigns", id: taskId },
        "Campaign",
      ],
    }),
    getCampaignKpiHistory: builder.query<MarketingKpiHistoryResponse, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 20 }) => ({ url: `marketing/campaigns/${id}/kpis`, params: { page, limit } }),
      providesTags: (result, error, { id }) => [{ type: "Campaign", id }, { type: "Campaign", id: `${id}-kpis` }],
    }),
    updateCampaignMetrics: builder.mutation<
      Campaign,
      { id: string; body: UpdateCampaignMetricsInput }
    >({
      query: ({ id, body }) => ({
        url: `marketing/campaigns/${id}/kpis`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Campaign", id },
        { type: "Campaign", id: `${id}-kpis` },
        "TaskCampaigns",
        "Campaign",
      ],
    }),
    updateCampaignStatus: builder.mutation<
      Campaign,
      { id: string; action: "start" | "pause" | "stop" | "end" }
    >({
      query: ({ id, action }) => ({
        url: `marketing/campaigns/${id}/${action}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Campaign", id },
        "TaskCampaigns",
        "Campaign",
      ],
    }),
    flagOptimization: builder.mutation<
      Campaign,
      { id: string; needsOptimization: boolean }
    >({
      query: ({ id, needsOptimization }) => ({
        url: `marketing/campaigns/${id}/optimization`,
        method: "PATCH",
        body: { needsOptimization },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Campaign", id },
        "TaskCampaigns",
      ],
    }),
    duplicateCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({
        url: `marketing/campaigns/${id}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "TaskCampaigns",
        "Campaign",
        { type: "Campaign", id },
      ],
    }),
    archiveCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({
        url: `marketing/campaigns/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Campaign", id },
        "TaskCampaigns",
        "Campaign",
      ],
    }),
    unarchiveCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({
        url: `marketing/campaigns/${id}/unarchive`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Campaign", id },
        "TaskCampaigns",
        "Campaign",
      ],
    }),

    // ── Marketing Strategy Endpoints ─────────────────────────────────────

    getTaskStrategy: builder.query<MarketingStrategy | null, string>({
      query: (taskId) => `tasks/${taskId}/marketing-strategy`,
      providesTags: (result, error, taskId) => [
        { type: "TaskStrategy", id: taskId },
      ],
    }),
    uploadStrategy: builder.mutation<
      MarketingStrategy,
      { taskId: string; file: File }
    >({
      query: ({ taskId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `tasks/${taskId}/marketing-strategy`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "TaskStrategy", id: taskId },
        "Strategy",
      ],
    }),
    sendStrategyToClient: builder.mutation<MarketingStrategy, string>({
      query: (id) => ({
        url: `marketing-strategies/${id}/send`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Strategy", id },
        "TaskStrategy",
      ],
    }),
    resubmitStrategy: builder.mutation<
      MarketingStrategy,
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `marketing-strategies/${id}/resubmit`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Strategy", id },
        "TaskStrategy",
      ],
    }),
    getStrategyDownloadUrl: builder.query<string, string>({
      query: (id) => `marketing-strategies/${id}/download`,
    }),
  }),
});

export const {
  useGetCampaignsByTaskQuery,
  useGetCampaignQuery,
  useGetCampaignsQuery,
  useGetMyCampaignStatsQuery,
  useCreateCampaignMutation,
  useGetCampaignKpiHistoryQuery,
  useUpdateCampaignMetricsMutation,
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation,
  useArchiveCampaignMutation,
  useUnarchiveCampaignMutation,
  // Strategy hooks
  useGetTaskStrategyQuery,
  useUploadStrategyMutation,
  useSendStrategyToClientMutation,
  useResubmitStrategyMutation,
  useGetStrategyDownloadUrlQuery,
} = marketingApi;
