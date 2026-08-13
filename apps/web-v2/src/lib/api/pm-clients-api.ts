"use client";

import { baseApi } from "@/lib/api/base-api";

export const pmClientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPmClientDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/pm/clients/${id}/full` }),
      providesTags: ["Clients"],
    }),
  }),
});

export const { useGetPmClientDetailQuery } = pmClientsApi;
