import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "@hassad/shared";

export interface PmDisputeSummary {
  id: string;
  ticketNumber: number;
  client: {
    id: string;
    companyName: string | null;
    user: { name: string } | null;
  };
  project: { id: string; name: string };
  title: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  openedAt: string;
  deadlineAt?: string | null;
  _count?: { messages: number };
}

export interface PmDisputeMessage {
  id: string;
  content: string;
  author: { id: string; name: string; avatarUrl?: string | null };
  isInternal: boolean;
  createdAt: string;
}

export interface PmDisputeHistory {
  id: string;
  fromStatus?: DisputeStatus | null;
  toStatus: DisputeStatus;
  changedAt: string;
  note?: string | null;
  changer: { id: string; name: string };
}

export interface PmDisputeDetail extends PmDisputeSummary {
  description: string;
  messages: PmDisputeMessage[];
  history: PmDisputeHistory[];
  resolution?: string | null;
}

export interface PmDisputeFilterInput {
  status?: DisputeStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PmDisputeStats {
  active: number;
  escalated: number;
  resolved: number;
}

export interface PmDisputeListResponse {
  data: PmDisputeSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PmDisputeMessageInput {
  content: string;
}

export interface PmResolveInput {
  message: string;
}

export const pmDisputesApi = createApi({
  reducerPath: "pmDisputesApi",
  baseQuery,
  tagTypes: ["PmDisputes", "PmDispute"],
  endpoints: (builder) => ({
    getPmDisputes: builder.query<
      PmDisputeListResponse,
      PmDisputeFilterInput | void
    >({
      query: (params) => ({
        url: "/pm/disputes",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "PmDispute" as const,
                id,
              })),
              "PmDisputes",
            ]
          : ["PmDisputes"],
    }),

    getPmDisputeStats: builder.query<PmDisputeStats, void>({
      query: () => "/pm/disputes/stats",
      providesTags: ["PmDisputes"],
    }),

    getPmDisputeDetail: builder.query<PmDisputeDetail, string>({
      query: (id) => `/pm/disputes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PmDispute", id }],
    }),

    acknowledgeDispute: builder.mutation<PmDisputeDetail, string>({
      query: (id) => ({
        url: `/pm/disputes/${id}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "PmDispute", id },
        "PmDisputes",
      ],
    }),

    addPmDisputeMessage: builder.mutation<
      PmDisputeMessage,
      { disputeId: string; input: PmDisputeMessageInput; files?: File[] }
    >({
      query: ({ disputeId, input, files }) => {
        const formData = new FormData();
        formData.append("content", input.content);
        if (files?.length) files.forEach((f) => formData.append("files", f));
        return {
          url: `/pm/disputes/${disputeId}/messages`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { disputeId }) => [
        { type: "PmDispute", id: disputeId },
      ],
    }),

    resolveDispute: builder.mutation<
      PmDisputeDetail,
      { disputeId: string; input: PmResolveInput }
    >({
      query: ({ disputeId, input }) => ({
        url: `/pm/disputes/${disputeId}/resolve`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { disputeId }) => [
        { type: "PmDispute", id: disputeId },
        "PmDisputes",
      ],
    }),
  }),
});

export const {
  useGetPmDisputesQuery,
  useGetPmDisputeStatsQuery,
  useGetPmDisputeDetailQuery,
  useAcknowledgeDisputeMutation,
  useAddPmDisputeMessageMutation,
  useResolveDisputeMutation,
} = pmDisputesApi;
