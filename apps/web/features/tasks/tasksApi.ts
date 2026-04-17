// apps/web/features/tasks/tasksApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "@hassad/shared";

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
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = tasksApi;
