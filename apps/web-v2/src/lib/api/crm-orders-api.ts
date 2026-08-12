"use client";

import { baseApi } from "@/lib/api/base-api";

export const crmOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmOrderDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/crm/orders/${id}` }),
      providesTags: ["Crm"],
    }),
  }),
});

export const { useGetCrmOrderDetailQuery } = crmOrdersApi;
