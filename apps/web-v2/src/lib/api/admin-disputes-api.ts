"use client";

import { baseApi } from "@/lib/api/base-api";

type AdminDisputesResponse = { data: any[]; total?: number; page?: number; limit?: number; totalPages?: number };

export const adminDisputesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDisputes: builder.query<AdminDisputesResponse, Record<string, unknown>>({ query: (params) => ({ url: "/admin/disputes", params }), providesTags: ["Delivery"] }),
  }),
});

export const { useGetAdminDisputesQuery } = adminDisputesApi;
