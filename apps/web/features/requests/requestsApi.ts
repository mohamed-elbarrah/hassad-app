import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { BusinessType, ClientSource, RequestStatus } from "@hassad/shared";

export interface RequestServiceItem {
  serviceId: string;
  quantity?: number;
  notes?: string;
}

export interface CreateRequestPayload {
  contactName: string;
  companyName: string;
  businessName: string;
  phoneWhatsapp: string;
  email?: string;
  businessType: BusinessType;
  source: ClientSource;
  notes?: string;
  services?: RequestServiceItem[];
}

export interface RequestAssignee {
  id: string;
  name: string;
  email: string;
}

export interface RequestClientSummary {
  id: string;
  companyName: string;
  contactName: string;
  userId?: string | null;
}

export interface RequestWorkflowItem {
  id: string;
  status: string;
}

export interface RequestServiceSummary {
  id: string;
  serviceId: string;
  quantity: number;
  notes?: string | null;
  service: {
    id: string;
    name: string;
    nameAr?: string | null;
  };
}

export interface RequestItem {
  id: string;
  clientId: string;
  submittedBy?: string | null;
  assignedSalesId?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  businessName: string;
  businessType: BusinessType;
  source: ClientSource;
  notes?: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  client?: RequestClientSummary;
  assignee?: RequestAssignee | null;
  services?: RequestServiceSummary[];
  proposals?: RequestWorkflowItem[];
  contracts?: RequestWorkflowItem[];
  project?: RequestWorkflowItem | null;
}

export interface RequestStatusHistoryItem {
  id: string;
  fromStatus?: RequestStatus | null;
  toStatus: RequestStatus;
  changedBy?: string | null;
  note?: string | null;
  changedAt: string;
  changer?: RequestAssignee | null;
}

export interface RequestDetail extends RequestItem {
  statusHistory: RequestStatusHistoryItem[];
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  project?: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  } | null;
}

export interface RequestFilters {
  status?: RequestStatus;
  search?: string;
  assignedSalesId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export const requestsApi = createApi({
  reducerPath: "requestsApi",
  baseQuery,
  tagTypes: ["Request"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getRequests: builder.query<RequestItem[], RequestFilters | void>({
      query: (filters) => ({
        url: "/requests",
        params: (filters as RequestFilters) ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Request" as const, id })),
              { type: "Request", id: "LIST" },
            ]
          : [{ type: "Request", id: "LIST" }],
    }),

    getRequestById: builder.query<RequestDetail, string>({
      query: (id) => ({ url: `/requests/${id}` }),
      providesTags: (_, __, id) => [{ type: "Request", id }],
    }),

    createRequest: builder.mutation<RequestItem, CreateRequestPayload>({
      query: (body) => ({
        url: "/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),

    updateRequestStatus: builder.mutation<
      RequestItem,
      { id: string; toStatus: RequestStatus; note?: string }
    >({
      query: ({ id, toStatus, note }) => ({
        url: `/requests/${id}/status`,
        method: "POST",
        body: { toStatus, note },
      }),
      async onQueryStarted({ id, toStatus }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          requestsApi.util.updateQueryData(
            "getRequests",
            { limit: 100 },
            (draft) => {
              const request = draft.find((item) => item.id === id);
              if (request) {
                request.status = toStatus;
                request.updatedAt = new Date().toISOString();
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: "Request", id },
        { type: "Request", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetRequestByIdQuery,
  useCreateRequestMutation,
  useUpdateRequestStatusMutation,
} = requestsApi;
