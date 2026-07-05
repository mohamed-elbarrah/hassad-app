import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export const adminClientsApi = createApi({
  reducerPath: "adminClientsApi",
  baseQuery,
  tagTypes: ["AdminClientFull", "AdminClientHistory"],
  endpoints: (builder) => ({
    getAdminClientFull: builder.query<any, string>({
      query: (id) => `admin/clients/${id}/full`,
      providesTags: (_result, _error, id) => [{ type: "AdminClientFull", id }],
    }),
    getAdminClientHistory: builder.query<any, { id: string; page?: number; limit?: number }>({
      query: ({ id, page, limit }) => ({
        url: `admin/clients/${id}/history`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "AdminClientHistory", id }],
    }),
  }),
});

export const { useGetAdminClientFullQuery, useGetAdminClientHistoryQuery } = adminClientsApi;
