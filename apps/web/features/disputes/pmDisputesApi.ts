import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "@hassad/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PmDisputeSummary {
  id: string;
  ticketNumber: number;
  client: { id: string; name: string };
  project: { id: string; name: string };
  title: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  openedAt: string;
  deadlineAt?: string;
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
  page?: number;
  limit?: number;
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

export interface PmDisputeStats {
  userId: string;
  userName: string;
  totalDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
  pmChangedCount: number;
  avgResolutionDays: number;
}

export interface ApproveDisputeInput {
  priority: string;
  notes?: string;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

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

    getPmDisputeStats: builder.query<PmDisputeStats, string>({
      query: (pmId) => `/admin/disputes/pm/${pmId}/stats`,
      providesTags: ["PmDispute"],
    }),

    approveDispute: builder.mutation<
      void,
      { id: string; input: ApproveDisputeInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/approve`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PmDispute", id },
        "PmDisputes",
      ],
    }),

    rejectDispute: builder.mutation<
      void,
      { id: string; input: { reason: string } }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/reject`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PmDispute", id },
        "PmDisputes",
      ],
    }),

    changePm: builder.mutation<
      void,
      { id: string; input: { newPmId: string; reason: string } }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/change-pm`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PmDispute", id },
        "PmDisputes",
      ],
    }),
  }),
});

export const {
  useGetPmDisputesQuery,
  useGetPmDisputeDetailQuery,
  useAcknowledgeDisputeMutation,
  useAddPmDisputeMessageMutation,
  useResolveDisputeMutation,
  useGetPmDisputeStatsQuery,
  useApproveDisputeMutation,
  useRejectDisputeMutation,
  useChangePmMutation,
} = pmDisputesApi;
