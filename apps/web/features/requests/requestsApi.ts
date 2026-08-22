import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import { ContactLogResult, ContactLogType } from "@hassad/shared";
import type {
  BusinessType,
  ClientKind,
  ClientSource,
  ClientStatus,
  RequestStatus,
} from "@hassad/shared";

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

export interface CreateSalesNewClientRequestPayload {
  email: string;
  phoneWhatsapp: string;
  password: string;
  notes?: string;
  services: RequestServiceItem[];
}

export interface RequestAssignee {
  id: string;
  name: string;
  email: string;
}

export interface RequestClientSummary {
  id: string;
  companyName: string;
  userId?: string | null;
  kind?: ClientKind;
  status?: ClientStatus;
  intakeCompleted?: boolean;
  totalProjects?: number;
  activeProjects?: number;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneWhatsapp?: string | null;
  } | null;
}

export interface RequestWorkflowItem {
  id: string;
  status: string;
  totalPrice?: number;
  totalValue?: number;
}

export interface RequestContactLogItem {
  id: string;
  type: ContactLogType;
  result: ContactLogResult;
  notes?: string | null;
  contactedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedRequestContactLogs {
  items: RequestContactLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  contactAttemptCount: number;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: RequestClientSummary;
  assignee?: RequestAssignee | null;
  services?: RequestServiceSummary[];
  proposals?: RequestWorkflowItem[];
  contracts?: RequestWorkflowItem[];
  contactLogs?: Array<{
    id: string;
    type: ContactLogType;
    result: ContactLogResult;
    notes?: string | null;
    contactedAt: string;
  }>;
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
  capabilities?: {
    canLogContact: boolean;
    canUpdateStatus: boolean;
    allowedNextStatuses: RequestStatus[];
  };
  statusHistory: RequestStatusHistoryItem[];
  contactLogs: RequestContactLogItem[];
  currentStageSince: string;
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    totalPrice?: number;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    totalValue?: number;
    createdAt: string;
  }>;
  project?: {
    id: string;
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
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

export interface CreateRequestForClientPayload {
  clientId: string;
  services: RequestServiceItem[];
  notes?: string;
}

export interface CreateRequestContactLogPayload {
  type: ContactLogType;
  result: ContactLogResult;
  notes?: string;
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

    /** POST /v1/requests/for-client — create request for existing client */
    createRequestForClient: builder.mutation<
      RequestItem,
      CreateRequestForClientPayload
    >({
      query: (body) => ({
        url: "/requests/for-client",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),

    /** POST /v1/requests/:id/contact-log — log a contact attempt */
    addRequestContactLog: builder.mutation<
      RequestContactLogItem,
      { id: string; body: CreateRequestContactLogPayload }
    >({
      query: ({ id, body }) => ({
        url: `/requests/${id}/contact-log`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Request", id },
        { type: "Request", id: "LIST" },
      ],
    }),

    /** GET /v1/requests/:id/contact-log — paginated contact logs for a request */
    getRequestContactLogs: builder.query<
      PaginatedRequestContactLogs,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page, limit }) => ({
        url: `/requests/${id}/contact-log`,
        params: { page, limit },
      }),
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetRequestByIdQuery,
  useCreateRequestMutation,
  useUpdateRequestStatusMutation,
  useCreateRequestForClientMutation,
  useAddRequestContactLogMutation,
  useGetRequestContactLogsQuery,
} = requestsApi;
