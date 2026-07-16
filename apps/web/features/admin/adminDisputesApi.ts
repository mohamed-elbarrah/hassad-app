import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminDisputeItem {
  id: string;
  ticketNumber: number;
  clientId: string;
  pmId: string;
  projectId: string;
  reviewedBy: string | null;
  resolvedBy: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  openedAt: string;
  approvedAt: string | null;
  deadlineAt: string | null;
  clientNotifiedAt: string | null;
  clientRespondedAt: string | null;
  clientConfirmedResolved: boolean | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  resolution: string | null;
  pmChanged: boolean;
  newPmId: string | null;
  rejectionReason: string | null;
  project: { id: string; name: string };
  client: { id: string; companyName: string };
  pm: { id: string; name: string; avatarUrl: string | null };
  reviewer: { id: string; name: string } | null;
  resolver: { id: string; name: string } | null;
  _count: { messages: number };
}

export interface AdminDisputeResponse {
  data: AdminDisputeItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminDisputeFilters {
  status?: string;
  category?: string;
  priority?: string;
  projectId?: string;
  clientId?: string;
  pmId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminDisputeStats {
  pendingApproval: number;
  active: number;
  escalated: number;
  resolved: number;
  closed: number;
}

export interface AdminDisputeMessage {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export interface AdminDisputeAttachment {
  id: string;
  ticketId: string;
  messageId: string | null;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploader: { id: string; name: string };
}

export interface AdminDisputeHistoryEntry {
  id: string;
  ticketId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  note: string | null;
  changer: { id: string; name: string };
}

export interface AdminDisputeDetail {
  id: string;
  ticketNumber: number;
  clientId: string;
  pmId: string;
  projectId: string;
  reviewedBy: string | null;
  resolvedBy: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  openedAt: string;
  approvedAt: string | null;
  deadlineAt: string | null;
  clientNotifiedAt: string | null;
  clientRespondedAt: string | null;
  clientConfirmedResolved: boolean | null;
  reminder1SentAt: string | null;
  reminder2SentAt: string | null;
  reminder3SentAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  resolution: string | null;
  pmChanged: boolean;
  newPmId: string | null;
  rejectionReason: string | null;
  project: { id: string; name: string };
  client: { id: string; companyName: string };
  pm: { id: string; name: string; avatarUrl: string | null };
  reviewer: { id: string; name: string } | null;
  resolver: { id: string; name: string } | null;
  newPm: { id: string; name: string } | null;
  messages: AdminDisputeMessage[];
  attachments: AdminDisputeAttachment[];
  history: AdminDisputeHistoryEntry[];
  _count: { messages: number };
}

export interface ApproveDisputeInput {
  priority: string;
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

export const adminDisputesApi = createApi({
  reducerPath: "adminDisputesApi",
  baseQuery,
  tagTypes: ["AdminDisputes", "AdminDispute", "AdminDisputeStats"],
  endpoints: (builder) => ({
    getAdminDisputes: builder.query<
      AdminDisputeResponse,
      AdminDisputeFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/disputes";
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.category) params.set("category", filters.category);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.projectId) params.set("projectId", filters.projectId);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.pmId) params.set("pmId", filters.pmId);
        if (filters.fromDate) params.set("fromDate", filters.fromDate);
        if (filters.toDate) params.set("toDate", filters.toDate);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/disputes?${params.toString()}`;
      },
      providesTags: ["AdminDisputes"],
    }),

    getAdminDisputeById: builder.query<AdminDisputeDetail, string>({
      query: (id) => `/admin/disputes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminDispute", id }],
    }),

    getAdminDisputeStats: builder.query<AdminDisputeStats, void>({
      query: () => "/admin/disputes/stats",
      providesTags: ["AdminDisputeStats"],
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
        { type: "AdminDispute", id },
        "AdminDisputes",
        "AdminDisputeStats",
      ],
    }),

    rejectDispute: builder.mutation<
      void,
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
        "AdminDisputeStats",
      ],
    }),

    changePm: builder.mutation<
      void,
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
        "AdminDisputeStats",
      ],
    }),

    closeDispute: builder.mutation<
      void,
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
        "AdminDisputeStats",
      ],
    }),

    addAdminDisputeMessage: builder.mutation<
      AdminDisputeMessage,
      { disputeId: string; input: AddMessageInput }
    >({
      query: ({ disputeId, input }) => ({
        url: `/admin/disputes/${disputeId}/messages`,
        method: "POST",
        body: { ...input, isInternal: true },
      }),
      invalidatesTags: (_result, _error, { disputeId }) => [
        { type: "AdminDispute", id: disputeId },
      ],
    }),
  }),
});

export const {
  useGetAdminDisputesQuery,
  useGetAdminDisputeByIdQuery,
  useGetAdminDisputeStatsQuery,
  useApproveDisputeMutation,
  useRejectDisputeMutation,
  useChangePmMutation,
  useCloseDisputeMutation,
  useAddAdminDisputeMessageMutation,
} = adminDisputesApi;
