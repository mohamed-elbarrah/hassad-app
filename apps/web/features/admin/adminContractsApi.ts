import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { ContractStatus } from "@hassad/shared";

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
  signedAt: string | null;
  versionNumber: number;
  eSigned: boolean;
  pendingRenewalAlerts: number;
  invoiceCount: number;
  project: { id: string; name: string; status: string } | null;
  createdAt: string;
}

export interface PaginatedAdminContracts {
  items: AdminContractItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: { active: number; signed: number; eSigned: number; totalValue: number };
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

export interface AdminContractActionResult {
  code: string;
}

export interface AdminContractActorCapabilities {
  canIntervene: boolean;
}

export interface AdminContractProjectConversionResult extends AdminContractActionResult {
  project: {
    id: string;
    name: string;
    status: string;
    clientId: string;
    contractId: string;
    projectManagerId: string | null;
    startDate: string;
    endDate: string;
  };
}

export interface AdminContractDetail {
  id: string;
  clientId: string;
  proposalId: string | null;
  createdBy?: string;
  salesPersonId?: string | null;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  fileUrl: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt: string | null;
  createdAt: string;
  shareLinkToken?: string | null;
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
    manager: { id: string; name: string } | null;
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string | null;
    createdAt: string;
    paidAt: string | null;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      date: string | null;
      createdAt: string;
    }>;
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
    fileUrl: string | null;
    createdAt: string;
  }>;
  paymentPlans: Array<{
    id: string;
    label: string;
    sequence: number;
    triggerType: string;
    amountType: string;
    amountValue: number;
    isRecurring: boolean;
    dueOffsetDays: number | null;
    isActive: boolean;
  }>;
}

export interface AdminContractFileResult {
  fileUrl: string | null;
}

export const adminContractsApi = createApi({
  reducerPath: "adminContractsApi",
  baseQuery,
  tagTypes: ["AdminContracts", "AdminContract"],
  endpoints: (builder) => ({
    cancelAdminContract: builder.mutation<AdminContractActionResult, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/contracts/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminContract", id }, "AdminContracts"],
    }),

    triggerAdminContractRenewalAlert: builder.mutation<AdminContractActionResult, string>({
      query: (id) => ({
        url: `/admin/contracts/${id}/trigger-renewal-alert`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminContract", id }],
    }),

    convertAdminContractToProject: builder.mutation<AdminContractProjectConversionResult, { id: string; name?: string; pmId?: string }>({
      query: ({ id, name, pmId }) => ({
        url: `/admin/contracts/${id}/convert-to-project`,
        method: "POST",
        body: { name, pmId },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminContract", id }, "AdminContracts"],
    }),

    updateAdminContractStatus: builder.mutation<AdminContractActionResult, { id: string; status: ContractStatus; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/admin/contracts/${id}/status`,
        method: "POST",
        body: { status, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminContract", id }, "AdminContracts"],
    }),
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

    getAdminContractActorCapabilities: builder.query<AdminContractActorCapabilities, void>({
      query: () => "/admin/contracts/capabilities",
      providesTags: ["AdminContracts"],
    }),

    getAdminContractFile: builder.query<AdminContractFileResult, string>({
      query: (id) => `/admin/contracts/${id}/file`,
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
  useGetAdminContractActorCapabilitiesQuery,
  useLazyGetAdminContractFileQuery,
  useCancelAdminContractMutation,
  useTriggerAdminContractRenewalAlertMutation,
  useConvertAdminContractToProjectMutation,
  useUpdateAdminContractStatusMutation,
} = adminContractsApi;
