"use client";

import type { AdminClientsWorkspaceQuery, ClientWorkspaceRecord } from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";

export type CrmClientsWorkspaceQuery = AdminClientsWorkspaceQuery;
export type CrmClientsWorkspaceResponse = {
  items: Omit<ClientWorkspaceRecord, "owner">[];
};

export const crmClientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmClientsWorkspace: builder.query<
      CrmClientsWorkspaceResponse,
      CrmClientsWorkspaceQuery
    >({
      query: (params) => ({ url: "/crm/clients", params }),
      providesTags: ["Clients"],
    }),
  }),
});

export const { useGetCrmClientsWorkspaceQuery } = crmClientsApi;
