"use client";

import type { AdminOverviewQuery, AdminOverviewResponse } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export const adminOverviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<AdminOverviewResponse, AdminOverviewQuery>({
      query: (params) => ({ url: "/admin/overview", params }),
      providesTags: ["Overview"],
    }),
  }),
});

export const { useGetAdminOverviewQuery } = adminOverviewApi;
