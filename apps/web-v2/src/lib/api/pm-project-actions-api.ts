"use client";

import { baseApi } from "@/lib/api/base-api";
import type { FilePurpose, MeetingStatus, TaskDepartment, TaskPriority } from "@hassad/shared";

export type PmAssignableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: string | null;
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
    createPmTask: builder.mutation<unknown, { projectId: string; body: FormData }>({
      query: ({ projectId, body }) => ({
        url: `/pm/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PmProjects"],
    }),
    assignPmTask: builder.mutation<unknown, { projectId: string; taskId: string; userId: string }>({
      query: ({ projectId, taskId, userId }) => ({
        url: `/pm/projects/${projectId}/tasks/${taskId}/assign`,
        method: "POST",
        body: { userId },
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
  }),
});

export const {
  useGetPmAssignableUsersQuery,
  useCreatePmTaskMutation,
  useAssignPmTaskMutation,
  useCreatePmMeetingMutation,
  useUpdatePmMeetingMutation,
  useUploadPmProjectFileMutation,
} = pmProjectActionsApi;
