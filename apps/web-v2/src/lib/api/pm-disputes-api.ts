"use client";

import { baseApi } from "@/lib/api/base-api";
import type {
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";

import type {
  DisputeThreadMessage,
  DisputeThreadSummary,
  DisputeThreadType,
} from "@/lib/api/dispute-chat-api";

export type { DisputeThreadType };

export type PmDisputeListItem = {
  id: string;
  ticketNumber: number;
  clientId: string;
  pmId: string;
  projectId: string;
  title: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  openedAt: string;
  updatedAt: string;
  deadlineAt: string | null;
  project: { id: string; name: string };
  client: {
    id: string;
    companyName: string;
    user: { name: string } | null;
  };
  pm: { id: string; name: string; avatarUrl: string | null } | null;
  messages: Array<{ createdAt: string }>;
  _count: { messages: number };
};

export type PmDisputeStats = {
  userId: string;
  totalDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
  pmChangedCount: number;
  avgResolutionDays: number;
};

export type PmDisputeWorkspaceResponse = {
  detail: unknown;
  threads: DisputeThreadSummary[];
  pmStats: PmDisputeStats;
};

export type PmDisputesResponse = {
  data: PmDisputeListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

function buildMessageFormData(args: { content: string; files: File[] }) {
  const formData = new FormData();
  formData.append("content", args.content);

  for (const file of args.files) {
    formData.append("files", file);
  }

  return formData;
}

export const pmDisputesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPmDisputes: builder.query<PmDisputesResponse, Record<string, unknown>>({
      query: (params) => ({ url: "/pm/disputes", params }),
      providesTags: ["PmDisputes"],
    }),
    getPmDisputeStats: builder.query<PmDisputeStats, void>({
      query: () => ({ url: "/pm/disputes/stats" }),
      providesTags: ["PmDisputes"],
    }),
    getPmDisputeWorkspace: builder.query<PmDisputeWorkspaceResponse, string>({
      query: (id) => ({ url: `/pm/disputes/${id}/workspace` }),
      providesTags: ["PmDisputes", "PmDisputeThreads"],
    }),
    getPmDisputeThreads: builder.query<DisputeThreadSummary[], string>({
      query: (id) => ({ url: `/pm/disputes/${id}/threads` }),
      providesTags: ["PmDisputeThreads"],
    }),
    getPmDisputeThreadMessages: builder.query<
      DisputeThreadMessage[],
      { disputeId: string; threadType: DisputeThreadType }
    >({
      query: ({ disputeId, threadType }) => ({
        url: `/pm/disputes/${disputeId}/threads/${threadType}/messages`,
      }),
      providesTags: ["PmDisputeThreads"],
    }),
    acknowledgePmDispute: builder.mutation<unknown, { disputeId: string }>({
      query: ({ disputeId }) => ({
        url: `/pm/disputes/${disputeId}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: ["PmDisputes", "PmDisputeThreads"],
    }),
    resolvePmDispute: builder.mutation<unknown, { disputeId: string; message: string }>({
      query: ({ disputeId, message }) => ({
        url: `/pm/disputes/${disputeId}/resolve`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: ["PmDisputes", "PmDisputeThreads"],
    }),
    sendPmDisputeThreadMessage: builder.mutation<
      DisputeThreadMessage,
      {
        disputeId: string;
        threadType: DisputeThreadType;
        content: string;
        files?: File[];
      }
    >({
      query: ({ disputeId, threadType, content, files = [] }) => {
        if (files.length > 0) {
          return {
            url: `/pm/disputes/${disputeId}/threads/${threadType}/messages`,
            method: "POST",
            body: buildMessageFormData({ content, files }),
          };
        }

        return {
          url: `/pm/disputes/${disputeId}/threads/${threadType}/messages`,
          method: "POST",
          body: { content },
        };
      },
      invalidatesTags: ["PmDisputes", "PmDisputeThreads"],
    }),
  }),
});

export const {
  useGetPmDisputesQuery,
  useGetPmDisputeStatsQuery,
  useGetPmDisputeWorkspaceQuery,
  useGetPmDisputeThreadsQuery,
  useGetPmDisputeThreadMessagesQuery,
  useAcknowledgePmDisputeMutation,
  useResolvePmDisputeMutation,
  useSendPmDisputeThreadMessageMutation,
} = pmDisputesApi;
