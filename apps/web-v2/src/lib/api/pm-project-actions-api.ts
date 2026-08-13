"use client";

import { baseApi } from "@/lib/api/base-api";
import type { FilePurpose, TaskDepartment, TaskPriority } from "@hassad/shared";

export type PmAssignableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: string | null;
};

export type PmProjectFile = {
  id: string;
  projectId: string;
  periodId: string | null;
  periodLabel: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string | null;
};

export const pmProjectActionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPmAssignableUsers: builder.query<{ items: PmAssignableUser[] }, { projectId: string; dept?: TaskDepartment; search?: string; limit?: number }>({
      query: ({ projectId, dept, search, limit }) => ({
        url: `/pm/projects/${projectId}/assignable-users`,
        params: { dept, search, limit },
      }),
      providesTags: ["PmProjects"],
    }),
    getPmProjectFiles: builder.query<{ items: PmProjectFile[] }, { projectId: string }>({
      query: ({ projectId }) => ({ url: `/pm/projects/${projectId}/files` }),
      providesTags: ["PmProjects"],
    }),
    createPmTask: builder.mutation<unknown, { projectId: string; body: FormData }>({
      query: ({ projectId, body }) => ({
        url: `/pm/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PmProjects"],
    }),
    createPmMeeting: builder.mutation<unknown, { projectId: string; body: FormData }>({
      query: ({ projectId, body }) => ({
        url: `/pm/projects/${projectId}/meetings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PmProjects"],
    }),
    updatePmMeeting: builder.mutation<unknown, { projectId: string; meetingId: string; body: Record<string, unknown> }>({
      query: ({ projectId, meetingId, body }) => ({
        url: `/pm/projects/${projectId}/meetings/${meetingId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PmProjects"],
    }),
    uploadPmProjectFile: builder.mutation<unknown, { projectId: string; body: FormData }>({
      query: ({ projectId, body }) => ({
        url: `/pm/projects/${projectId}/files`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PmProjects"],
    }),
    downloadPmProjectFile: builder.query<{ url: string }, { projectId: string; fileId: string }>({
      query: ({ projectId, fileId }) => ({ url: `/pm/projects/${projectId}/files/${fileId}/download` }),
      providesTags: ["PmProjects"],
    }),
  }),
});

export const {
  useGetPmAssignableUsersQuery,
  useGetPmProjectFilesQuery,
  useCreatePmTaskMutation,
  useCreatePmMeetingMutation,
  useUpdatePmMeetingMutation,
  useUploadPmProjectFileMutation,
  useDownloadPmProjectFileQuery,
} = pmProjectActionsApi;
