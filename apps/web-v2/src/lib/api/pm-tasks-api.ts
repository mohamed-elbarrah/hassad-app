"use client";

import { baseApi } from "@/lib/api/base-api";
import type { FilePurpose, TaskDepartment, TaskPriority, TaskStatus } from "@hassad/shared";

export type PmTaskListItem = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  clientName: string;
  projectStatus: string | null;
  department: TaskDepartment;
  assigneeName: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  periodLabel: string;
  periodNumber?: number | null;
  isClientVisible: boolean;
  revisionCount: number;
};

export type PmTaskDetail = unknown;

export type PmTaskFile = {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  purpose: string;
  createdAt: string;
  url?: string | null;
};

export type PmTaskComment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
};

export const pmTasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPmTasks: builder.query<{ items: PmTaskListItem[] }, Record<string, string | number | undefined>>({
      query: (params) => ({ url: "/pm/tasks", params }),
      providesTags: ["PmTasks"],
    }),
    getPmTaskDetail: builder.query<PmTaskDetail, string>({
      query: (id) => ({ url: `/pm/tasks/${id}` }),
      providesTags: ["PmTasks"],
    }),
    getPmTaskFiles: builder.query<{ items: PmTaskFile[] }, string>({
      query: (id) => ({ url: `/pm/tasks/${id}/files` }),
      providesTags: ["PmTasks"],
    }),
    getPmTaskComments: builder.query<{ items: PmTaskComment[] }, string>({
      query: (id) => ({ url: `/pm/tasks/${id}/comments` }),
      providesTags: ["PmTasks"],
    }),
    updatePmTaskStatus: builder.mutation<unknown, { taskId: string; status: TaskStatus }>({
      query: ({ taskId, status }) => ({ url: `/pm/tasks/${taskId}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["PmTasks"],
    }),
    addPmTaskComment: builder.mutation<unknown, { taskId: string; content: string; isInternal?: boolean }>({
      query: ({ taskId, content, isInternal }) => ({ url: `/pm/tasks/${taskId}/comments`, method: "POST", body: { content, isInternal } }),
      invalidatesTags: ["PmTasks"],
    }),
    uploadPmTaskFile: builder.mutation<unknown, { taskId: string; body: FormData }>({
      query: ({ taskId, body }) => ({ url: `/pm/tasks/${taskId}/files`, method: "POST", body }),
      invalidatesTags: ["PmTasks"],
    }),
    downloadPmTaskFile: builder.query<{ url: string }, { taskId: string; fileId: string }>({
      query: ({ taskId, fileId }) => ({ url: `/pm/tasks/${taskId}/files/${fileId}/download` }),
      providesTags: ["PmTasks"],
    }),
  }),
});

export const {
  useGetPmTasksQuery,
  useGetPmTaskDetailQuery,
  useGetPmTaskFilesQuery,
  useGetPmTaskCommentsQuery,
  useUpdatePmTaskStatusMutation,
  useAddPmTaskCommentMutation,
  useUploadPmTaskFileMutation,
  useDownloadPmTaskFileQuery,
} = pmTasksApi;
