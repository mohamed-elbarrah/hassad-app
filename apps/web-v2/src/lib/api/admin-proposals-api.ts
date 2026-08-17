"use client";

import { baseApi } from "@/lib/api/base-api";

type AdminProposalsResponse = { items: any[]; total?: number; page?: number; limit?: number; totalPages?: number };

export const adminProposalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProposals: builder.query<AdminProposalsResponse, Record<string, unknown>>({ query: (params) => ({ url: "/admin/proposals", params }), providesTags: ["Crm"] }),
  }),
});

export const { useGetAdminProposalsQuery } = adminProposalsApi;
