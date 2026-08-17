"use client";

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { baseApi } from "@/lib/api/base-api";

export const adminDetailsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeDetail: builder.query<
      {
        detail: unknown;
        performance: unknown;
        activity: unknown;
        work: unknown;
      },
      string
    >({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: `/admin/users/${id}/workspace` });
        if (result.error) return { error: result.error as FetchBaseQueryError };
        return { data: result.data as { detail: unknown; performance: unknown; activity: unknown; work: unknown } };
      },
      providesTags: ["Employees"],
    }),
    getClientDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/clients/${id}/full` }),
      providesTags: ["Clients"],
    }),
    getOrderDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/crm/orders/${id}` }),
      providesTags: ["Crm"],
    }),
    getProposalDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/proposals/${id}` }),
      providesTags: ["Crm"],
    }),
    getContractDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/contracts/${id}` }),
      providesTags: ["Delivery"],
    }),
    getProjectDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/projects/${id}` }),
      providesTags: ["Delivery"],
    }),
    getTaskDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/tasks/${id}` }),
      providesTags: ["Delivery"],
    }),
    getDisputeDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/disputes/${id}` }),
      providesTags: ["Delivery"],
    }),
  }),
});

export const {
  useGetClientDetailQuery,
  useGetContractDetailQuery,
  useGetDisputeDetailQuery,
  useGetEmployeeDetailQuery,
  useGetOrderDetailQuery,
  useGetProjectDetailQuery,
  useGetProposalDetailQuery,
  useGetTaskDetailQuery,
} = adminDetailsApi;
