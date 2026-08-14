"use client";

import type { AdminDeliveryWorkspaceQuery, DeliveryWorkspaceResponse } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export const adminProjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeliveryWorkspace: builder.query<DeliveryWorkspaceResponse, AdminDeliveryWorkspaceQuery>({
      query: (params) => ({ url: "/admin/delivery/workspace", params }),
      providesTags: ["Delivery"],
    }),
    getAdminProjectPeriods: builder.query<unknown, string>({ query: (projectId) => `/admin/projects/${projectId}/periods`, providesTags: ["AdminProjects"] }),
    getAdminProjectTeam: builder.query<unknown, string>({ query: (projectId) => `/admin/projects/${projectId}/team`, providesTags: ["AdminProjects"] }),
    getAdminProjectDeliverables: builder.query<unknown, { projectId: string; status?: string; page?: number; limit?: number }>({ query: ({ projectId, ...params }) => ({ url: `/admin/projects/${projectId}/deliverables`, params }), providesTags: ["AdminProjects"] }),
    getAdminProjectTimeline: builder.query<unknown, string>({ query: (projectId) => `/admin/projects/${projectId}/timeline`, providesTags: ["AdminProjects"] }),
  }),
});

export const { useGetDeliveryWorkspaceQuery, useGetAdminProjectPeriodsQuery, useGetAdminProjectTeamQuery, useGetAdminProjectDeliverablesQuery, useGetAdminProjectTimelineQuery } = adminProjectsApi;
