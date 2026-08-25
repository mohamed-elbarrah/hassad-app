import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { Task, TaskComment, TaskFile, TaskStatus, FilePurpose } from "@hassad/shared";

export interface TeamTaskCard extends Pick<Task, "id" | "title" | "description" | "status" | "priority" | "dueDate" | "revisionCount"> {
  department: string | null;
  isOverdue: boolean;
  project: { id: string; name: string } | null;
  period: { id: string; periodNumber: number } | null;
  assignee: { id: string; name: string } | null;
  isClientVisible: boolean;
  isArchived: boolean;
}

export interface TeamSummary { total: number; todo: number; inProgress: number; inReview: number; revision: number; done: number; overdue: number; dueToday: number }
export interface TeamPage<T> { items: T[]; page: number; limit: number; total: number; totalPages: number }
export interface TeamOverview {
  summary: TeamSummary;
  kanban: Record<TaskStatus, TeamTaskCard[]>;
  items: TeamTaskCard[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface TeamTasksParams { search?: string; status?: TaskStatus; priority?: string; department?: string; projectId?: string; dueBefore?: string; dueAfter?: string; page?: number; limit?: number; }
export interface TeamTaskPage extends TeamPage<TeamTaskCard> {}
export interface TeamCommentPage extends TeamPage<TaskComment> {}
export interface TeamFilePage extends TeamPage<TaskFile> {}

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery,
  tagTypes: ["TeamTask", "TeamTaskComments", "TeamTaskFiles"],
  endpoints: (builder) => ({
    getTeamOverview: builder.query<TeamOverview, TeamTasksParams | void>({
      query: (params = {}) => ({ url: "/team/overview", params: params as Record<string, string | number | undefined> }),
      providesTags: [{ type: "TeamTask", id: "LIST" }],
    }),
    getTeamTask: builder.query<Task, string>({
      query: (id) => `/team/tasks/${id}`,
      providesTags: (_r, _e, id) => [{ type: "TeamTask", id }],
    }),
    changeTeamTaskStatus: builder.mutation<Task, { id: string; status: TaskStatus }>({
      query: ({ id, status }) => ({ url: `/team/tasks/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "TeamTask", id }, { type: "TeamTask", id: "LIST" }],
    }),
    getTeamTasks: builder.query<TeamTaskPage, TeamTasksParams | void>({
      query: (params = {}) => ({ url: "/team/tasks", params: params as Record<string, string | number | undefined> }),
      providesTags: [{ type: "TeamTask", id: "LIST" }],
    }),
    getTeamTaskComments: builder.query<TeamCommentPage, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 25 }) => ({ url: `/team/tasks/${id}/comments`, params: { page, limit } }),
      providesTags: (_r, _e, { id }) => [{ type: "TeamTaskComments", id }],
    }),
    addTeamTaskComment: builder.mutation<TaskComment, { taskId: string; content: string }>({
      query: ({ taskId, content }) => ({ url: `/team/tasks/${taskId}/comments`, method: "POST", body: { content } }),
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "TeamTaskComments", id: taskId }],
    }),
    getTeamTaskFiles: builder.query<TeamFilePage, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 25 }) => ({ url: `/team/tasks/${id}/files`, params: { page, limit } }),
      providesTags: (_r, _e, { id }) => [{ type: "TeamTaskFiles", id }],
    }),
    uploadTeamTaskFile: builder.mutation<TaskFile, { taskId: string; file: File; purpose?: FilePurpose }>({
      query: ({ taskId, file, purpose }) => { const body = new FormData(); body.append("file", file); if (purpose) body.append("purpose", purpose); return { url: `/team/tasks/${taskId}/files`, method: "POST", body }; },
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "TeamTaskFiles", id: taskId }],
    }),
    getTeamTaskFileDownload: builder.query<{ url: string }, { taskId: string; fileId: string }>({ query: ({ taskId, fileId }) => `/team/tasks/${taskId}/files/${fileId}/download` }),
  }),
});

export const { useGetTeamOverviewQuery, useGetTeamTasksQuery, useLazyGetTeamTasksQuery, useGetTeamTaskQuery, useChangeTeamTaskStatusMutation, useGetTeamTaskCommentsQuery, useAddTeamTaskCommentMutation, useGetTeamTaskFilesQuery, useUploadTeamTaskFileMutation, useLazyGetTeamTaskFileDownloadQuery } = teamApi;
