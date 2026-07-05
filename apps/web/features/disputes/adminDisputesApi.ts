import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "@hassad/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminDisputeSummary {
  id: string;
  ticketNumber: number;
  client: { id: string; name: string };
  pm: { id: string; name: string };
  project: { id: string; name: string };
  title: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  openedAt: string;
  deadlineAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  _count?: { messages: number };
}

export interface AdminDisputeMessage {
  id: string;
  content: string;
  author: { id: string; name: string; avatarUrl?: string | null };
  isInternal: boolean;
  createdAt: string;
}

export interface AdminDisputeHistory {
  id: string;
  fromStatus?: DisputeStatus | null;
  toStatus: DisputeStatus;
  changedAt: string;
  note?: string | null;
  changer: { id: string; name: string };
}

export interface AdminDisputeAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploader: { id: string; name: string };
}

export interface AdminDisputeDetail extends AdminDisputeSummary {
  description: string;
  rejectionReason?: string;
  resolution?: string;
  pmChanged: boolean;
  newPm?: { id: string; name: string } | null;
  messages: AdminDisputeMessage[];
  history: AdminDisputeHistory[];
  attachments: AdminDisputeAttachment[];
}

export interface PmDisputeStats {
  userId: string;
  userName: string;
  totalDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
  pmChangedCount: number;
  avgResolutionDays: number;
  resolutionRate: number;
}

export interface DisputeStats {
  pendingApproval: number;
  active: number;
  escalated: number;
  resolved: number;
  closed: number;
}

export interface AdminDisputeFilterInput {
  status?: DisputeStatus;
  category?: DisputeCategory;
  priority?: DisputePriority;
  pmId?: string;
  clientId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminDisputeListResponse {
  data: AdminDisputeSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApproveDisputeInput {
  priority?: DisputePriority;
  notes?: string;
}

export interface RejectDisputeInput {
  reason: string;
}

export interface ChangePmInput {
  newPmId: string;
  reason: string;
}

export interface CloseDisputeInput {
  resolution: string;
}

export interface AddMessageInput {
  content: string;
  isInternal?: boolean;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

export const adminDisputesApi = createApi({
  reducerPath: "adminDisputesApi",
  baseQuery,
  tagTypes: ["AdminDisputes", "AdminDispute", "DisputeStats", "PmStats"],
  endpoints: (builder) => ({
    // ─── List & Stats ────────────────────────────────────────────────────────
    getAdminDisputes: builder.query<
      AdminDisputeListResponse,
      AdminDisputeFilterInput | void
    >({
      query: (params) => ({
        url: "/admin/disputes",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "AdminDispute" as const,
                id,
              })),
              "AdminDisputes",
            ]
          : ["AdminDisputes"],
    }),

    getDisputeStats: builder.query<DisputeStats, void>({
      query: () => "/admin/disputes/stats",
      providesTags: ["DisputeStats"],
    }),

    getPmDisputeStats: builder.query<PmDisputeStats, string>({
      query: (pmId) => `/admin/disputes/pm/${pmId}/stats`,
      providesTags: (_result, _error, pmId) => [{ type: "PmStats", id: pmId }],
    }),

    // ─── Detail ──────────────────────────────────────────────────────────────
    getAdminDisputeDetail: builder.query<AdminDisputeDetail, string>({
      query: (id) => `/admin/disputes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminDispute", id }],
    }),

    // ─── Actions ─────────────────────────────────────────────────────────────
    approveDispute: builder.mutation<
      AdminDisputeDetail,
      { id: string; input: ApproveDisputeInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/approve`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminDispute", id },
        "AdminDisputes",
        "DisputeStats",
      ],
    }),

    rejectDispute: builder.mutation<
      AdminDisputeDetail,
      { id: string; input: RejectDisputeInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/reject`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminDispute", id },
        "AdminDisputes",
        "DisputeStats",
      ],
    }),

    changePm: builder.mutation<
      AdminDisputeDetail,
      { id: string; input: ChangePmInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/change-pm`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminDispute", id },
        "AdminDisputes",
        "DisputeStats",
        "PmStats",
      ],
    }),

    closeDispute: builder.mutation<
      AdminDisputeDetail,
      { id: string; input: CloseDisputeInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/close`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminDispute", id },
        "AdminDisputes",
        "DisputeStats",
      ],
    }),

    addAdminMessage: builder.mutation<
      AdminDisputeMessage,
      { id: string; input: AddMessageInput }
    >({
      query: ({ id, input }) => ({
        url: `/admin/disputes/${id}/messages`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminDispute", id },
      ],
    }),
  }),
});

export const {
  useGetAdminDisputesQuery,
  useGetDisputeStatsQuery,
  useGetPmDisputeStatsQuery,
  useGetAdminDisputeDetailQuery,
  useApproveDisputeMutation,
  useRejectDisputeMutation,
  useChangePmMutation,
  useCloseDisputeMutation,
  useAddAdminMessageMutation,
} = adminDisputesApi;
