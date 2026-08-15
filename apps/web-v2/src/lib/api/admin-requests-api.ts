"use client";

import type {
  AdminRequestsWorkspaceQuery,
  CrmWorkspaceResponse,
} from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export type AdminRequestsQuery = { page?: number; limit?: number; search?: string; status?: string };

export const adminRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminRequests: builder.query<unknown, AdminRequestsQuery | void>({ query: (params) => ({ url: "/admin/requests", params: params ?? undefined }), providesTags: ["AdminRequests"] }),
    getAdminRequestsWorkspace: builder.query<CrmWorkspaceResponse, AdminRequestsWorkspaceQuery>({
      query: (params) => ({ url: "/admin/requests/workspace", params }),
      providesTags: ["AdminRequests"],
    }),
    getAdminStaleRequests: builder.query<unknown, { days?: number; page?: number; limit?: number } | void>({ query: (params) => ({ url: "/admin/requests/stale", params: params ?? undefined }), providesTags: ["AdminRequests"] }),
    getAdminRequest: builder.query<unknown, string>({ query: (id) => `/admin/requests/${id}`, providesTags: ["AdminRequests"] }),
  }),
});

export const {
  useGetAdminRequestsQuery,
  useGetAdminRequestsWorkspaceQuery,
  useGetAdminStaleRequestsQuery,
  useGetAdminRequestQuery,
} = adminRequestsApi;
