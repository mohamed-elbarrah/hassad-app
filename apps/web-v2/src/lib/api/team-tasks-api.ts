"use client";

import { TaskPriority, TaskStatus, type TaskDepartment } from "@hassad/shared";
import { baseApi } from "@/lib/api/base-api";

export type TeamTaskCard = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  department: TaskDepartment | null;
  dueDate: string;
  isOverdue: boolean;
  revisionCount: number;
  project: { id: string; name: string } | null;
  period: { id: string; label: string } | null;
  assignee: { id: string; name: string } | null;
  isClientVisible: boolean;
  isArchived: boolean;
};

export type TeamOverview = {
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    revision: number;
    done: number;
    overdue: number;
    dueToday: number;
  };
  kanban: Partial<Record<TaskStatus, TeamTaskCard[]>>;
  items: TeamTaskCard[];
};

export const teamTasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeamOverview: builder.query<TeamOverview, Record<string, string | number | undefined>>({
      query: (params) => ({ url: "/team/overview", params }),
      providesTags: ["TeamOverview", "TeamTasks"],
    }),
    getTeamTasks: builder.query<{ items: TeamTaskCard[]; page: number; limit: number; total: number; totalPages: number }, Record<string, string | number | undefined>>({
      query: (params) => ({ url: "/team/tasks", params }),
      providesTags: ["TeamTasks"],
    }),
    getTeamTaskDetail: builder.query<unknown, string>({
      query: (taskId) => ({ url: `/team/tasks/${taskId}` }),
      providesTags: ["TaskDetail", "TeamTasks"],
    }),
    updateTeamTaskStatus: builder.mutation<unknown, { taskId: string; status: TaskStatus }>({
      query: ({ taskId, status }) => ({ url: `/team/tasks/${taskId}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["TeamOverview", "TeamTasks", "TaskDetail", "PmTasks", "Delivery"],
    }),
    getTeamTaskComments: builder.query<{ items: Array<{ id: string; content: string; createdAt: string; isInternal: boolean; user: { id: string; name: string } }> }, string>({
      query: (taskId) => ({ url: `/team/tasks/${taskId}/comments` }),
      providesTags: ["TaskComments", "TaskDetail"],
    }),
    addTeamTaskComment: builder.mutation<unknown, { taskId: string; content: string }>({
      query: ({ taskId, content }) => ({ url: `/team/tasks/${taskId}/comments`, method: "POST", body: { content } }),
      invalidatesTags: ["TaskComments", "TaskDetail", "TeamTasks", "PmTasks"],
    }),
    getTeamTaskFiles: builder.query<{ items: Array<{ id: string; fileName: string; fileSize: number; mimeType: string; purpose: string; createdAt: string; uploadedBy: string; url?: string | null }> }, string>({
      query: (taskId) => ({ url: `/team/tasks/${taskId}/files` }),
      providesTags: ["TaskFiles", "TaskDetail"],
    }),
    uploadTeamTaskFile: builder.mutation<unknown, { taskId: string; body: FormData }>({
      query: ({ taskId, body }) => ({ url: `/team/tasks/${taskId}/files`, method: "POST", body }),
      invalidatesTags: ["TaskFiles", "TaskDetail", "TeamTasks"],
    }),
    getTeamTaskFileDownload: builder.query<{ url: string }, { taskId: string; fileId: string }>({
      query: ({ taskId, fileId }) => ({ url: `/team/tasks/${taskId}/files/${fileId}/download` }),
    }),
  }),
});

export const {
  useGetTeamOverviewQuery,
  useGetTeamTasksQuery,
  useGetTeamTaskDetailQuery,
  useUpdateTeamTaskStatusMutation,
  useGetTeamTaskCommentsQuery,
  useAddTeamTaskCommentMutation,
  useGetTeamTaskFilesQuery,
  useUploadTeamTaskFileMutation,
  useLazyGetTeamTaskFileDownloadQuery,
} = teamTasksApi;
