"use client";

import { CampaignPlatform, CampaignStatus, MarketingStrategyStatus, TaskPriority, TaskStatus } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export type MarketingTaskCard = { id: string; title: string; description: string | null; status: TaskStatus; priority: TaskPriority; dueDate: string; isOverdue: boolean; revisionCount: number; project: { id: string; name: string } | null; period: { id: string; label: string } | null };
export type MarketingOverview = { summary: Record<string, number>; kanban: Partial<Record<TaskStatus, MarketingTaskCard[]>>; items: MarketingTaskCard[] };
export type MarketingStrategy = { id: string; taskId: string; status: MarketingStrategyStatus; fileName: string; fileSize: number; revisionNote: string | null; sentAt: string | null; approvedAt: string | null; task?: { id: string; title: string; project?: { id: string; name: string } | null }; creator?: { id: string; name: string } };
export type MarketingCampaign = { id: string; taskId: string; name: string; platform: CampaignPlatform; status: CampaignStatus; startDate: string; endDate: string | null; budgetTotal: number; budgetSpent: number; needsOptimization: boolean; client?: { id: string; companyName: string | null }; task?: { id: string; title: string }; project?: { id: string; name: string } | null; kpiSnapshots?: Array<Record<string, number | string>>; analytics?: Record<string, number> };

export const marketingWorkspaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketingOverview: builder.query<MarketingOverview, Record<string, string | number | undefined>>({ query: (params) => ({ url: "/marketing/overview", params }), providesTags: ["MarketingOverview", "MarketingTasks"] }),
    getMarketingTaskDetail: builder.query<unknown, string>({ query: (id) => ({ url: `/marketing/tasks/${id}` }), providesTags: ["MarketingTaskDetail", "MarketingTasks"] }),
    updateMarketingTaskStatus: builder.mutation<unknown, { taskId: string; status: TaskStatus }>({ query: ({ taskId, status }) => ({ url: `/marketing/tasks/${taskId}/status`, method: "PATCH", body: { status } }), invalidatesTags: ["MarketingOverview", "MarketingTasks", "MarketingTaskDetail"] }),
    addMarketingTaskComment: builder.mutation<unknown, { taskId: string; content: string }>({ query: ({ taskId, content }) => ({ url: `/marketing/tasks/${taskId}/comments`, method: "POST", body: { content } }), invalidatesTags: ["MarketingTaskDetail"] }),
    uploadMarketingTaskFile: builder.mutation<unknown, { taskId: string; body: FormData }>({ query: ({ taskId, body }) => ({ url: `/marketing/tasks/${taskId}/files`, method: "POST", body }), invalidatesTags: ["MarketingTaskDetail"] }),
    downloadMarketingTaskFile: builder.query<{ url: string }, { taskId: string; fileId: string }>({ query: ({ taskId, fileId }) => ({ url: `/marketing/tasks/${taskId}/files/${fileId}/download` }) }),
    getMarketingStrategies: builder.query<{ data: MarketingStrategy[]; total: number; page: number; limit: number }, Record<string, string | number | undefined>>({ query: (params) => ({ url: "/marketing/strategies", params }), providesTags: ["MarketingStrategies"] }),
    getMarketingStrategy: builder.query<MarketingStrategy, string>({ query: (id) => ({ url: `/marketing/strategies/${id}` }), providesTags: ["MarketingStrategies"] }),
    createMarketingStrategy: builder.mutation<unknown, { taskId: string; body: FormData }>({ query: ({ taskId, body }) => ({ url: `/marketing/tasks/${taskId}/strategy`, method: "POST", body }), invalidatesTags: ["MarketingStrategies", "MarketingTaskDetail", "MarketingOverview"] }),
    sendMarketingStrategy: builder.mutation<unknown, string>({ query: (id) => ({ url: `/marketing/strategies/${id}/send`, method: "POST" }), invalidatesTags: ["MarketingStrategies", "MarketingTaskDetail", "MarketingOverview"] }),
    resubmitMarketingStrategy: builder.mutation<unknown, { id: string; body: FormData }>({ query: ({ id, body }) => ({ url: `/marketing/strategies/${id}/resubmit`, method: "POST", body }), invalidatesTags: ["MarketingStrategies", "MarketingTaskDetail", "MarketingOverview"] }),
    downloadMarketingStrategy: builder.query<{ url: string }, string>({ query: (id) => ({ url: `/marketing/strategies/${id}/download` }) }),
    getMarketingCampaigns: builder.query<{ data: MarketingCampaign[]; total: number; page: number; limit: number }, Record<string, string | number | undefined>>({ query: (params) => ({ url: "/marketing/campaigns", params }), providesTags: ["MarketingCampaigns"] }),
    getMarketingCampaign: builder.query<MarketingCampaign, string>({ query: (id) => ({ url: `/marketing/campaigns/${id}` }), providesTags: ["MarketingCampaigns"] }),
    createMarketingCampaign: builder.mutation<unknown, Record<string, unknown>>({ query: (body) => ({ url: "/marketing/campaigns", method: "POST", body }), invalidatesTags: ["MarketingCampaigns", "MarketingTaskDetail", "MarketingOverview"] }),
    updateMarketingCampaign: builder.mutation<unknown, { id: string; body: Record<string, unknown> }>({ query: ({ id, body }) => ({ url: `/marketing/campaigns/${id}`, method: "PATCH", body }), invalidatesTags: ["MarketingCampaigns"] }),
    changeMarketingCampaignStatus: builder.mutation<unknown, { id: string; action: "start" | "pause" | "stop" | "end" }>({ query: ({ id, action }) => ({ url: `/marketing/campaigns/${id}/${action}`, method: "POST" }), invalidatesTags: ["MarketingCampaigns", "MarketingOverview"] }),
    getMarketingCampaignKpis: builder.query<unknown[], string>({ query: (id) => ({ url: `/marketing/campaigns/${id}/kpis` }), providesTags: ["MarketingCampaigns"] }),
    addMarketingCampaignKpi: builder.mutation<unknown, { id: string; body: Record<string, number> }>({ query: ({ id, body }) => ({ url: `/marketing/campaigns/${id}/kpis`, method: "POST", body }), invalidatesTags: ["MarketingCampaigns"] }),
    flagMarketingOptimization: builder.mutation<unknown, { id: string; needsOptimization: boolean }>({ query: ({ id, needsOptimization }) => ({ url: `/marketing/campaigns/${id}/optimization`, method: "PATCH", body: { needsOptimization } }), invalidatesTags: ["MarketingCampaigns", "MarketingOverview"] }),
  }),
});

export const { useGetMarketingOverviewQuery, useAddMarketingTaskCommentMutation, useUploadMarketingTaskFileMutation, useLazyDownloadMarketingTaskFileQuery, useGetMarketingTaskDetailQuery, useUpdateMarketingTaskStatusMutation, useGetMarketingStrategiesQuery, useGetMarketingStrategyQuery, useCreateMarketingStrategyMutation, useSendMarketingStrategyMutation, useResubmitMarketingStrategyMutation, useLazyDownloadMarketingStrategyQuery, useGetMarketingCampaignsQuery, useGetMarketingCampaignQuery, useCreateMarketingCampaignMutation, useUpdateMarketingCampaignMutation, useChangeMarketingCampaignStatusMutation, useGetMarketingCampaignKpisQuery, useAddMarketingCampaignKpiMutation, useFlagMarketingOptimizationMutation } = marketingWorkspaceApi;
