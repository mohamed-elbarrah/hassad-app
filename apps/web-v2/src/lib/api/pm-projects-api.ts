"use client";

import { baseApi } from "@/lib/api/base-api";
import type { ProjectStatus, TaskPriority } from "@hassad/shared";

export type PmProjectCard = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  projectManager: {
    id: string;
    name: string;
  } | null;
  priority: TaskPriority;
  taskCount: number;
  overdueTaskCount: number;
  activeTaskCount: number;
  updatedAt: string;
};

export type PmProjectWorkspaceApi = unknown;

export type PmProjectsResponse = {
  items: PmProjectCard[];
};

export const pmProjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPmProjects: builder.query<PmProjectsResponse, void>({
      query: () => ({ url: "/pm/projects" }),
      providesTags: ["PmProjects"],
    }),
    getPmProjectDetail: builder.query<PmProjectWorkspaceApi, string>({
      query: (id) => ({ url: `/pm/projects/${id}/workspace` }),
      providesTags: ["PmProjects"],
    }),
  }),
});

export const { useGetPmProjectsQuery, useGetPmProjectDetailQuery } = pmProjectsApi;
