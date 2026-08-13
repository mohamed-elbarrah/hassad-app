"use client";

import { baseApi } from "@/lib/api/base-api";
import type { CrmActionToast } from "@/lib/api/crm-action-toast";

export type CrmContractsIndexQuery = {
  search?: string;
  status?: "all" | "sent" | "signed" | "active" | "on-hold" | "expired" | "cancelled";
  type?: string;
  expiringDays?: string;
  page?: string;
  limit?: string;
};

export type CrmContractIndexApiItem = {
  id: string;
  title: string | null;
  clientName: string | null;
  type: string | null;
  status: string | null;
  monthlyValue: number | null;
  totalValue: number | null;
  currency: string | null;
  startDate: string | null;
  endDate: string | null;
  signedAt: string | null;
  versionNumber: number | null;
  eSigned: boolean | null;
  pendingRenewalAlerts: number;
  invoiceCount: number;
  project: { id: string; name: string; status: string } | null;
  createdAt: string;
};

export type CrmContractsIndexResponse = {
  items: CrmContractIndexApiItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CrmContractDetailApi = {
  id: string;
  clientId: string;
  proposalId: string | null;
  createdBy: string;
  salesPersonId?: string | null;
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
  servicesList: unknown;
  downPaymentType: string | null;
  downPaymentValue: number | null;
  numberOfMonths: number | null;
  client?: { id: string; companyName: string; userId: string | null } | null;
  proposal?: {
    id: string;
    title: string;
    totalPrice: number;
    serviceDescription: string;
    servicesList: unknown;
    contactName: string | null;
    contactEmail: string | null;
    status: string;
    startDate: string | null;
    durationDays: number;
    durationUnit: string;
    platforms: string[];
    offerValidityDays: number;
    filePath: string | null;
    requestId: string | null;
  } | null;
  project?: { id: string; name: string; status: string; startDate: string; endDate: string; manager?: { id: string; name: string } | null } | null;
  versions?: unknown[];
  paymentPlans?: Array<{
    id: string;
    label: string;
    sequence: number;
    triggerType: string;
    amountType: string;
    amountValue: number;
    isRecurring: boolean;
    dueOffsetDays: number | null;
  }>;
  renewalAlerts?: unknown[];
  statusHistory?: unknown[];
  invoices?: unknown[];
};

export type CrmContractMutationResponse = {
  contract: CrmContractDetailApi;
  toast: CrmActionToast;
};

export const crmContractsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmContractsIndex: builder.query<CrmContractsIndexResponse, CrmContractsIndexQuery>({
      query: (params) => ({ url: "/crm/contracts", params }),
      providesTags: ["Delivery"],
    }),
    getCrmContractDetail: builder.query<CrmContractDetailApi, string>({
      query: (id) => ({ url: `/crm/contracts/${id}` }),
      providesTags: ["Delivery"],
    }),
    createCrmContract: builder.mutation<CrmContractMutationResponse, FormData>({
      query: (body) => ({
        url: "/crm/contracts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Delivery", "Crm", "CrmOverview"],
    }),
    updateCrmContract: builder.mutation<CrmContractMutationResponse, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/crm/contracts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Delivery", "Crm", "CrmOverview"],
    }),
    sendCrmContract: builder.mutation<CrmContractMutationResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/crm/contracts/${id}/send`,
        method: "POST",
      }),
      invalidatesTags: ["Delivery", "Crm", "CrmOverview"],
    }),
  }),
});

export const {
  useCreateCrmContractMutation,
  useGetCrmContractDetailQuery,
  useGetCrmContractsIndexQuery,
  useSendCrmContractMutation,
  useUpdateCrmContractMutation,
} = crmContractsApi;
