"use client";

import { baseApi } from "@/lib/api/base-api";

export const adminIndexApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasksIndex: builder.query<any, Record<string, unknown>>({
      query: (params) => ({ url: "/admin/tasks", params }),
    }),
    getDisputesIndex: builder.query<any, Record<string, unknown>>({
      query: (params) => ({ url: "/admin/disputes", params }),
    }),
    getContractsIndex: builder.query<any, Record<string, unknown>>({
      query: (params) => ({ url: "/admin/contracts", params }),
    }),
    getProposalsIndex: builder.query<any, Record<string, unknown>>({
      query: (params) => ({ url: "/admin/proposals", params }),
    }),
  }),
});

export const {
  useGetContractsIndexQuery,
  useGetDisputesIndexQuery,
  useGetProposalsIndexQuery,
  useGetTasksIndexQuery,
} = adminIndexApi;
