"use client";

import type { AdminClientsWorkspaceQuery, ClientWorkspaceRecord } from "@hassad/shared";

export type SalesClientsWorkspaceQuery = AdminClientsWorkspaceQuery;
export type SalesClientsWorkspaceResponse = {
  items: Omit<ClientWorkspaceRecord, "owner">[];
};

import { baseApi } from "@/lib/api/base-api";

export const salesWorkspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesClientsWorkspace: builder.query<
      SalesClientsWorkspaceResponse,
      SalesClientsWorkspaceQuery
    >({
      query: (params) => ({ url: "/sales/clients", params }),
      providesTags: ["Clients"],
    }),
  }),
});

export const { useGetSalesClientsWorkspaceQuery } = salesWorkspacesApi;
