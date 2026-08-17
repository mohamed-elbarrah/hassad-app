import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminRequestItem {
  id: string;
  clientName: string;
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

export interface AdminRequestDetail {
  id: string;
  clientId: string;
  submittedBy: string | null;
  assignedSalesId: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email: string | null;
  businessName: string;
  businessType: string;
  source: string;
  notes: string | null;
  internalNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; companyName: string } | null;
  assignee: { id: string; name: string; email: string } | null;
  services: AdminRequestService[];
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    changedAt: string;
    changer: { id: string; name: string };
    note: string | null;
  }>;
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
  }),
});

export const { useGetAdminRequestsQuery, useGetAdminRequestByIdQuery } =
  adminRequestsApi;
