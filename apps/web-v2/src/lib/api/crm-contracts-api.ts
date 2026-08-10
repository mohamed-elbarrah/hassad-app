"use client";

import { baseApi } from "@/lib/api/base-api";

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
  title: string;
  type: string;
  status: string;
  totalValue: number;
  monthlyValue: number | null;
  signedAt: string | null;
  endDate: string | null;
  client?: { id: string; companyName: string; userId: string | null } | null;
  project?: { id: string; name: string; status: string } | null;
  versions?: unknown[];
  paymentPlans?: unknown[];
  renewalAlerts?: unknown[];
  statusHistory?: unknown[];
  invoices?: unknown[];
  createdAt: string;
  updatedAt?: string;
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
  }),
});

export const { useGetCrmContractDetailQuery, useGetCrmContractsIndexQuery } = crmContractsApi;
