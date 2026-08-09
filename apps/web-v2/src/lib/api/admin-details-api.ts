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
        const [detail, performance, activity, work] = await Promise.all([
          baseQuery({ url: `/admin/users/${id}` }),
          baseQuery({ url: `/admin/users/${id}/performance` }),
          baseQuery({ url: `/admin/users/${id}/activity` }),
          baseQuery({ url: `/admin/users/${id}/work` }),
        ]);

        const error =
          detail.error ?? performance.error ?? activity.error ?? work.error;

        if (error) {
          return { error: error as FetchBaseQueryError };
        }

        return {
          data: {
            detail: detail.data,
            performance: performance.data,
            activity: activity.data,
            work: work.data,
          },
        };
      },
      providesTags: ["Employees"],
    }),
    getClientDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/clients/${id}/full` }),
      providesTags: ["Clients"],
    }),
    getOrderDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/admin/leads/${id}` }),
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
