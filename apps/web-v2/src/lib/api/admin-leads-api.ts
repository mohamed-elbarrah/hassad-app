"use client";

import { baseApi } from "@/lib/api/base-api";

export type AdminLeadsQuery = { page?: number; limit?: number; search?: string; status?: string; assignedTo?: string };

export const adminLeadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminLeads: builder.query<unknown, AdminLeadsQuery | void>({ query: (params) => ({ url: "/admin/leads", params: params ?? undefined }), providesTags: ["AdminLeads"] }),
    getAdminLeadStats: builder.query<unknown, void>({ query: () => "/admin/leads/stats", providesTags: ["AdminLeads"] }),
    getAdminStaleLeads: builder.query<unknown, { days?: number; page?: number; limit?: number } | void>({ query: (params) => ({ url: "/admin/leads/stale", params: params ?? undefined }), providesTags: ["AdminLeads"] }),
    getAdminLead: builder.query<unknown, string>({ query: (id) => `/admin/leads/${id}`, providesTags: ["AdminLeads"] }),
  }),
});

export const { useGetAdminLeadsQuery, useGetAdminLeadStatsQuery, useGetAdminStaleLeadsQuery, useGetAdminLeadQuery } = adminLeadsApi;
