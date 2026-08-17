"use client";

import type { AdminCrmWorkspaceQuery, CrmWorkspaceResponse } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export const adminCrmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmWorkspace: builder.query<CrmWorkspaceResponse, AdminCrmWorkspaceQuery>({
      query: (params) => ({ url: "/admin/crm/workspace", params }),
      providesTags: ["Crm"],
    }),
  }),
});

export const { useGetCrmWorkspaceQuery } = adminCrmApi;
