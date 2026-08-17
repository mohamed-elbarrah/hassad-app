"use client";

import { baseApi } from "@/lib/api/base-api";
import type { CrmOverviewBoardFilter, CrmOverviewRecord } from "@/features/crm-overview/lib/crm-overview-data";

export type CrmOverviewQuery = {
  filter?: CrmOverviewBoardFilter;
  search?: string;
};

export const crmOverviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmOverview: builder.query<CrmOverviewRecord[], CrmOverviewQuery | void>({
      query: (params) => ({ url: "/crm/overview", params: params ?? {} }),
      providesTags: ["CrmOverview"],
    }),
  }),
});

export const { useGetCrmOverviewQuery } = crmOverviewApi;
