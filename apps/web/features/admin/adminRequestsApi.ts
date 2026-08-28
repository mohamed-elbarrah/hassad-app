import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  BusinessType,
  ClientSource,
  ContactLogResult,
  ContactLogType,
  RequestStatus,
} from "@hassad/shared";

export interface AdminRequestContactLogPayload {
  type: ContactLogType;
  result: ContactLogResult;
  notes?: string;
}

export interface AdminRequestDetail {
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
  client: { id: string; companyName: string } | null;
  assignee: { id: string; name: string; email: string } | null;
  services: Array<{
    id: string;
    serviceId: string;
    quantity: number;
    notes?: string | null;
    service: { id: string; name: string; nameAr?: string | null };
  }>;
  capabilities?: {
    canLogContact: boolean;
    canUpdateStatus: boolean;
    allowedNextStatuses: RequestStatus[];
  };
  statusHistory: Array<{
    id: string;
    fromStatus?: RequestStatus | null;
    toStatus: RequestStatus;
    changedBy?: string | null;
    changedAt: string;
    changer?: { id: string; name: string; email: string } | null;
    note?: string | null;
  }>;
  contactLogs: Array<{
    id: string;
    type: ContactLogType;
    result: ContactLogResult;
    notes?: string | null;
    contactedAt: string;
    userId: string;
    user: { id: string; name: string; email: string };
  }>;
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

export interface AdminRequestItem {
  id: string;
  clientName: string;
  contactName: string;
  assigneeId: string | null;
  assigneeName: string;
  status: string;
  servicesCount: number;
  ageDays: number;
  createdAt: string;
}

export interface PaginatedAdminRequests {
  items: AdminRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminRequestFilters {
  search?: string;
  assigneeId?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface AdminRequestService {
  id: string;
  requestId: string;
  serviceId: string;
  quantity: number;
  notes: string | null;
}

export const adminRequestsApi = createApi({
  reducerPath: "adminRequestsApi",
  baseQuery,
  tagTypes: ["AdminRequests", "AdminRequest"],
  endpoints: (builder) => ({
    getAdminRequests: builder.query<
      PaginatedAdminRequests,
      AdminRequestFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/requests";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
        if (filters.status) params.set("status", filters.status);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/requests?${params.toString()}`;
      },
      providesTags: ["AdminRequests"],
    }),

    getAdminRequestById: builder.query<AdminRequestDetail, string>({
      query: (id) => `/admin/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminRequest", id }],
    }),
    updateAdminRequestStatus: builder.mutation<{ code: string }, { id: string; status: RequestStatus; reason: string }>({
      query: ({ id, status, reason }) => ({ url: `/admin/requests/${id}/force-status`, method: "POST", body: { status, reason } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminRequest", id }, "AdminRequests"],
    }),
    addAdminRequestContactLog: builder.mutation<{ code: string }, { id: string; body: AdminRequestContactLogPayload }>({
      query: ({ id, body }) => ({ url: `/admin/requests/${id}/contact-log`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminRequest", id }, "AdminRequests"],
    }),
  }),
});

export const {
  useGetAdminRequestsQuery,
  useGetAdminRequestByIdQuery,
  useUpdateAdminRequestStatusMutation,
  useAddAdminRequestContactLogMutation,
} = adminRequestsApi;
