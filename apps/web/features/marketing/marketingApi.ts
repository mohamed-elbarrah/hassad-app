import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import { Campaign, CampaignAnalytics, CampaignPlatform, CreateCampaignInput, UpdateCampaignMetricsInput, Task, TaskPriority, TaskStatus, TaskFile, TaskComment, FilePurpose } from "@hassad/shared";

export interface MarketingCampaign extends Campaign {
  client?: { id: string; companyName: string | null } | null;
  analytics: CampaignAnalytics;
}
export interface CampaignListResponse { items: MarketingCampaign[]; total: number; page: number; limit: number; totalPages: number; }
export interface CampaignListQuery { page: number; limit: number; status?: Campaign["status"]; platform?: CampaignPlatform; search?: string; sortBy?: "name" | "createdAt" | "startDate" | "budgetTotal" | "budgetSpent"; sortOrder?: "asc" | "desc"; }
export interface MarketingKpiSnapshot { id: string; campaignId: string; impressions: number; clicks: number; conversions: number; revenue: number; cpc: number; cpa: number; ctr: number; conversionRate: number; roas: number; source: string | null; recordedAt: string; createdAt: string; }
export interface MarketingKpiHistoryResponse { items: MarketingKpiSnapshot[]; total: number; page: number; limit: number; totalPages: number; }
export interface MarketingTask extends Task {
  isOverdue?: boolean;
  project?: { id: string; name: string; clientId: string; client?: { companyName: string; businessType: string } };
  campaigns?: Array<{ id: string; name: string; conversions?: number }>;
}
export interface MarketingTaskQuery { search?: string; status?: TaskStatus; priority?: TaskPriority; projectId?: string; dueBefore?: string; dueAfter?: string; page?: number; limit?: number; }
export interface MarketingTaskListResponse { items: MarketingTask[]; total: number; page: number; limit: number; totalPages: number; }
export interface MarketingOverviewResponse { summary: Record<string, number>; kanban: Record<string, MarketingTask[]>; items: MarketingTask[]; }

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
  tagTypes: ["Campaign", "TaskCampaigns", "TaskStrategy", "Strategy", "MarketingTasks"],
  endpoints: (builder) => ({
    // ── Marketing-owned task endpoints ──────────────────────────────────
    getMarketingOverview: builder.query<MarketingOverviewResponse, MarketingTaskQuery | void>({
      query: (params: MarketingTaskQuery = {}) => ({ url: "/marketing/overview", params }),
      providesTags: [{ type: "MarketingTasks", id: "OVERVIEW" }],
    }),
    getMarketingTasks: builder.query<MarketingTaskListResponse, MarketingTaskQuery>({
      query: (params = {}) => ({ url: "/marketing/tasks", params }),
      providesTags: (result) => [{ type: "MarketingTasks", id: "LIST" }, ...(result?.items ?? []).map(({ id }) => ({ type: "MarketingTasks" as const, id }))],
    }),
    getMarketingTaskById: builder.query<MarketingTask, string>({
      query: (id) => `/marketing/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "MarketingTasks", id }],
    }),
    getMarketingTaskComments: builder.query<TaskComment[], string>({ query: (id) => `/marketing/tasks/${id}/comments`, transformResponse: (response: { items: TaskComment[] }) => response.items, providesTags: (_r, _e, id) => [{ type: "MarketingTasks", id: `COMMENTS_${id}` }] }),
    addMarketingTaskComment: builder.mutation<TaskComment, { taskId: string; content: string }>({ query: ({ taskId, content }) => ({ url: `/marketing/tasks/${taskId}/comments`, method: "POST", body: { content } }), invalidatesTags: (_r, _e, { taskId }) => [{ type: "MarketingTasks", id: `COMMENTS_${taskId}` }] }),
    getMarketingTaskFiles: builder.query<TaskFile[], string>({ query: (id) => `/marketing/tasks/${id}/files`, transformResponse: (response: { items: TaskFile[] }) => response.items, providesTags: (_r, _e, id) => [{ type: "MarketingTasks", id: `FILES_${id}` }] }),
    deleteMarketingTaskFile: builder.mutation<void, { taskId: string; fileId: string }>({ query: ({ taskId, fileId }) => ({ url: `/marketing/tasks/${taskId}/files/${fileId}`, method: "DELETE" }), invalidatesTags: (_r, _e, { taskId }) => [{ type: "MarketingTasks", id: `FILES_${taskId}` }] }),
    uploadMarketingTaskFile: builder.mutation<TaskFile, { taskId: string; file: File; purpose?: FilePurpose }>({ query: ({ taskId, file, purpose }) => { const formData = new FormData(); formData.append("file", file); if (purpose) formData.append("purpose", purpose); return { url: `/marketing/tasks/${taskId}/files`, method: "POST", body: formData }; }, invalidatesTags: (_r, _e, { taskId }) => [{ type: "MarketingTasks", id: `FILES_${taskId}` }] }),
    getMarketingTaskFileDownload: builder.query<{ url: string }, { taskId: string; fileId: string }>({ query: ({ taskId, fileId }) => `/marketing/tasks/${taskId}/files/${fileId}/download` }),
    changeMarketingTaskStatus: builder.mutation<MarketingTask, { id: string; status: TaskStatus }>({
      query: ({ id, status }) => ({ url: `/marketing/tasks/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "MarketingTasks", id }, { type: "MarketingTasks", id: "LIST" }, { type: "MarketingTasks", id: "OVERVIEW" }],
    }),

    // ── Campaign Endpoints ───────────────────────────────────────────────

    getCampaignsByTask: builder.query<MarketingCampaign[], string>({
      query: (taskId) => ({ url: "marketing/campaigns", params: { taskId, page: 1, limit: 100 } }),
      providesTags: (result, error, taskId) => [
        { type: "TaskCampaigns", id: taskId },
      ],
      transformResponse: (baseQueryReturnValue: CampaignListResponse) => (baseQueryReturnValue?.items || []).map(flattenCampaignAnalytics),
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
      query: () => "/marketing/campaigns/stats",
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
    getCampaignKpiHistory: builder.query<MarketingKpiHistoryResponse, { id: string; page?: number; limit?: number; from?: string; to?: string }>({
      query: ({ id, page = 1, limit = 20, from, to }) => ({ url: `marketing/campaigns/${id}/kpis`, params: { page, limit, from, to } }),
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
      query: (taskId) => `/marketing/tasks/${taskId}/strategy`,
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
          url: `/marketing/tasks/${taskId}/strategy`,
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
        url: `/marketing/strategies/${id}/send`,
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
          url: `/marketing/strategies/${id}/resubmit`,
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
      query: (id) => `/marketing/strategies/${id}/download`,
      transformResponse: (response: { url: string }) => response.url,
    }),
  }),
});

export const {
  useGetMarketingOverviewQuery,
  useGetMarketingTasksQuery,
  useGetMarketingTaskByIdQuery,
  useChangeMarketingTaskStatusMutation,
  useGetMarketingTaskCommentsQuery,
  useAddMarketingTaskCommentMutation,
  useGetMarketingTaskFilesQuery,
  useUploadMarketingTaskFileMutation,
  useDeleteMarketingTaskFileMutation,
  useLazyGetMarketingTaskFileDownloadQuery,
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
  useLazyGetStrategyDownloadUrlQuery,
} = marketingApi;
