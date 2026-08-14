"use client";

import type { AdminClientsWorkspaceQuery, ClientsWorkspaceResponse } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export const adminClientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClientsWorkspace: builder.query<ClientsWorkspaceResponse, AdminClientsWorkspaceQuery>({
      query: (params) => ({ url: "/admin/clients/workspace", params }),
      providesTags: ["Clients"],
    }),
  }),
});

export const { useGetClientsWorkspaceQuery } = adminClientsApi;
