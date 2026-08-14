"use client";

import { baseApi } from "@/lib/api/base-api";

type AdminContractsResponse = { items: any[]; total?: number; page?: number; limit?: number; totalPages?: number };

export const adminContractsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminContracts: builder.query<AdminContractsResponse, Record<string, unknown>>({ query: (params) => ({ url: "/admin/contracts", params }), providesTags: ["Crm"] }),
  }),
});

export const { useGetAdminContractsQuery } = adminContractsApi;
