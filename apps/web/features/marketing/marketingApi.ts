import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import { 
  Campaign, 
  CreateCampaignInput, 
  UpdateCampaignMetricsInput,
  UpdateCampaignStatusInput 
} from "@hassad/shared";

export const marketingApi = createApi({
  reducerPath: "marketingApi",
  baseQuery,
  tagTypes: ["Campaign", "TaskCampaigns"],
  endpoints: (builder) => ({
    getCampaignsByTask: builder.query<Campaign[], string>({
      query: (taskId) => `tasks/${taskId}/campaigns`,
      providesTags: (result, error, taskId) => [{ type: "TaskCampaigns", id: taskId }],
    }),
    getCampaign: builder.query<Campaign & { analytics: any }, string>({
      query: (id) => `campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: "Campaign", id }],
    }),
    createCampaign: builder.mutation<Campaign, CreateCampaignInput>({
      query: (body) => ({
        url: "campaigns",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "TaskCampaigns", id: taskId },
      ],
    }),
    updateCampaignMetrics: builder.mutation<
      Campaign,
      { id: string; body: UpdateCampaignMetricsInput }
    >({
      query: ({ id, body }) => ({
        url: `campaigns/${id}/metrics`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Campaign", id }],
    }),
    updateCampaignStatus: builder.mutation<
      Campaign,
      { id: string; action: 'start' | 'pause' | 'stop' | 'end' }
    >({
      query: ({ id, action }) => ({
        url: `campaigns/${id}/${action}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Campaign", id }],
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
      invalidatesTags: (result, error, { id }) => [{ type: "Campaign", id }],
    }),
    duplicateCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({
        url: `campaigns/${id}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: ["TaskCampaigns"],
    }),
  }),
});

export const {
  useGetCampaignsByTaskQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMetricsMutation,
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation,
} = marketingApi;
