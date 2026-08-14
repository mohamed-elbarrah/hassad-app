"use client";

import { baseApi } from "@/lib/api/base-api";

type AdminTasksResponse = { items: any[]; total?: number; page?: number; limit?: number; totalPages?: number };

export const adminTasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTasks: builder.query<AdminTasksResponse, Record<string, unknown>>({ query: (params) => ({ url: "/admin/tasks", params }), providesTags: ["Delivery"] }),
  }),
});

export const { useGetAdminTasksQuery } = adminTasksApi;
