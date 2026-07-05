import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignMetricsInput,
  UpdateCampaignStatusInput,
} from "@hassad/shared";

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
function flattenCampaignAnalytics(c: any) {
  const { analytics, ...rest } = c;
  return {
    ...rest,
    impressions: analytics?.impressions ?? 0,
    clicks: analytics?.clicks ?? 0,
    conversions: analytics?.conversions ?? 0,
    revenue: analytics?.revenue ?? 0,
    roas: analytics?.roas ?? 0,
    ctr: analytics?.ctr ?? 0,
    cpc: analytics?.cpc ?? 0,
    cpa: analytics?.cpa ?? 0,
    conversionRate: analytics?.conversionRate ?? 0,
  };
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
      transformResponse: (baseQueryReturnValue: any) => {
        return (baseQueryReturnValue || []).map(flattenCampaignAnalytics);
      },
    }),
    getCampaign: builder.query<Campaign & { analytics: any }, string>({
      query: (id) => `campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: "Campaign", id }],
      transformResponse: (baseQueryReturnValue: any) => {
        const flattened = flattenCampaignAnalytics(baseQueryReturnValue);
        return {
          ...flattened,
          analytics: baseQueryReturnValue.analytics,
        };
      },
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
        url: "campaigns",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "TaskCampaigns", id: taskId },
        "Campaign",
      ],
    }),
    updateCampaignMetrics: builder.mutation<
      Campaign,
      { id: string; body: UpdateCampaignMetricsInput }
    >({
      query: ({ id, body }) => ({
        url: `campaigns/${id}/kpis`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Campaign", id },
        "TaskCampaigns",
        "Campaign",
      ],
    }),
    updateCampaignStatus: builder.mutation<
      Campaign,
      { id: string; action: "start" | "pause" | "stop" | "end" }
    >({
      query: ({ id, action }) => ({
        url: `campaigns/${id}/${action}`,
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
        url: `campaigns/${id}/flag-optimization`,
        method: "POST",
        body: { needsOptimization },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Campaign", id },
        "TaskCampaigns",
      ],
    }),
    duplicateCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({
        url: `campaigns/${id}/duplicate`,
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
        url: `campaigns/${id}/archive`,
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
        url: `campaigns/${id}/unarchive`,
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
  useGetMyCampaignStatsQuery,
  useCreateCampaignMutation,
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
