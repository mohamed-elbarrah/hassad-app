"use client";

import type { AdminClientsWorkspaceQuery, ClientWorkspaceRecord } from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";

export type CrmClientsWorkspaceQuery = AdminClientsWorkspaceQuery & {
  search?: string;
};

export type CrmClientWorkspaceRecord = Omit<ClientWorkspaceRecord, "owner"> & {
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export type CrmClientsWorkspaceResponse = {
  items: CrmClientWorkspaceRecord[];
};

export type CrmClientDetailApi = unknown;

export const crmClientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmClientsWorkspace: builder.query<
      CrmClientsWorkspaceResponse,
      CrmClientsWorkspaceQuery
    >({
      query: (params) => ({ url: "/crm/clients", params }),
      providesTags: ["Clients"],
    }),
    getCrmClientDetail: builder.query<CrmClientDetailApi, string>({
      query: (id) => ({ url: `/crm/clients/${id}/full` }),
      providesTags: ["Clients"],
    }),
  }),
});

export const { useGetCrmClientDetailQuery, useGetCrmClientsWorkspaceQuery } = crmClientsApi;
