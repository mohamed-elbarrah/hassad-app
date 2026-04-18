// apps/web/features/tasks/tasksApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  TaskFile,
  TaskComment,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
} from "@hassad/shared";

// ── Local interfaces ─────────────────────────────────────────────────────────

interface MyTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  dept?: TaskDepartment;
  archived?: boolean;
  dueBefore?: string;
  dueAfter?: string;
}

export interface TaskWithProject extends Task {
  project?: { id: string; name: string };
  assignee?: { id: string; name: string };
  archivedAt?: string | null;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  done: number;
  overdue: number;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery,
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    /** GET /v1/projects/:projectId/tasks — list tasks for a project */
    getTasksByProject: builder.query<Task[], string>({
      query: (projectId) => `/projects/${projectId}/tasks`,
      providesTags: (result, _error, projectId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Task" as const, id })),
              { type: "Task", id: `PROJECT_${projectId}` },
            ]
          : [{ type: "Task", id: `PROJECT_${projectId}` }],
    }),

    /** GET /v1/tasks/:id — single task with full relations */
    getTaskById: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    /** POST /v1/projects/:projectId/tasks — create a task in a project */
    createTask: builder.mutation<
      Task,
      { projectId: string; body: CreateTaskInput }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Task", id: `PROJECT_${projectId}` },
      ],
    }),

    /** PATCH /v1/tasks/:id — update task fields (ADMIN + PM) */
    updateTask: builder.mutation<Task, { id: string; body: UpdateTaskInput }>({
      query: ({ id, body }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Task", id }],
    }),

    /** PATCH /v1/tasks/:id/status — dedicated status transition */
    updateTaskStatus: builder.mutation<
      Task,
      { id: string; body: UpdateTaskStatusInput }
    >({
      query: ({ id, body }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Task", id }],
    }),

    /** DELETE /v1/tasks/:id — hard delete (ADMIN only) */
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    /** GET /v1/tasks/my — my tasks with optional filters */
    getMyTasks: builder.query<TaskWithProject[], MyTasksFilters>({
      query: (filters = {}) => ({
        url: "/tasks/my",
        params: filters,
      }),
      providesTags: [{ type: "Task", id: "MY_TASKS" }],
    }),

    /** GET /v1/tasks/my/stats — aggregated stats for the current user */
    getMyTaskStats: builder.query<TaskStats, void>({
      query: () => "/tasks/my/stats",
      providesTags: [{ type: "Task", id: "MY_STATS" }],
    }),

    /** PATCH /v1/tasks/:id/archive — toggle archive */
    toggleArchiveTask: builder.mutation<
      { id: string; archivedAt: string | null },
      string
    >({
      query: (id) => ({ url: `/tasks/${id}/archive`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "MY_STATS" },
      ],
    }),

    /** GET /v1/tasks/:taskId/files */
    getTaskFiles: builder.query<TaskFile[], string>({
      query: (taskId) => `/tasks/${taskId}/files`,
      providesTags: (_result, _error, taskId) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** POST /v1/tasks/:taskId/files */
    uploadTaskFile: builder.mutation<
      TaskFile,
      { taskId: string; file: FormData }
    >({
      query: ({ taskId, file }) => ({
        url: `/tasks/${taskId}/files`,
        method: "POST",
        body: file,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** DELETE /v1/tasks/:taskId/files/:fileId */
    deleteTaskFile: builder.mutation<void, { taskId: string; fileId: string }>({
      query: ({ taskId, fileId }) => ({
        url: `/tasks/${taskId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** GET /v1/tasks/:taskId/comments */
    getTaskComments: builder.query<TaskComment[], string>({
      query: (taskId) => `/tasks/${taskId}/comments`,
      providesTags: (_result, _error, taskId) => [
        { type: "Task", id: `COMMENTS_${taskId}` },
      ],
    }),

    /** POST /v1/tasks/:taskId/comments */
    addTaskComment: builder.mutation<
      TaskComment,
      { taskId: string; content: string }
    >({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `COMMENTS_${taskId}` },
      ],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
  useToggleArchiveTaskMutation,
  useGetTaskFilesQuery,
  useUploadTaskFileMutation,
  useDeleteTaskFileMutation,
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
} = tasksApi;
