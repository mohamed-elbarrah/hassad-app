import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminContractItem {
  id: string;
  title: string;
  clientName: string;
  type: string;
  status: string;
  monthlyValue: number;
  totalValue: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  versionNumber: number;
  eSigned: boolean;
  pendingRenewalAlerts: number;
  invoiceCount: number;
  createdAt: string;
}

export interface PaginatedAdminContracts {
  items: AdminContractItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminContractFilters {
  search?: string;
  clientId?: string;
  status?: string;
  type?: string;
  expiringDays?: number;
  page?: number;
  limit?: number;
}

export interface AdminContractDetail {
  id: string;
  clientId: string;
  proposalId: string | null;
  createdBy: string;
  salesPersonId: string | null;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  filePath: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt: string | null;
  createdAt: string;
  shareLinkToken: string | null;
  currency: string;
  requestId: string | null;
  servicesList: unknown | null;
  downPaymentType: string | null;
  downPaymentValue: number | null;
  numberOfMonths: number | null;
  client: { id: string; companyName: string };
  project: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    manager: { id: string; name: string };
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    paidAt: string | null;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    changedAt: string;
    reason: string | null;
    changer: { id: string; name: string };
  }>;
  versions: Array<{
    id: string;
    versionNumber: number;
    filePath: string | null;
    createdAt: string;
  }>;
}

export const adminContractsApi = createApi({
  reducerPath: "adminContractsApi",
  baseQuery,
  tagTypes: ["AdminContracts", "AdminContract"],
  endpoints: (builder) => ({
    getAdminContracts: builder.query<
      PaginatedAdminContracts,
      AdminContractFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/contracts";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.status) params.set("status", filters.status);
        if (filters.type) params.set("type", filters.type);
        if (filters.expiringDays)
          params.set("expiringDays", String(filters.expiringDays));
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/contracts?${params.toString()}`;
      },
      providesTags: ["AdminContracts"],
    }),

    getAdminContractById: builder.query<AdminContractDetail, string>({
      query: (id) => `/admin/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminContract", id }],
    }),
  }),
});

export const {
  useGetAdminContractsQuery,
  useGetAdminContractByIdQuery,
} = adminContractsApi;
