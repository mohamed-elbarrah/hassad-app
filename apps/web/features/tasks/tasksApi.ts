// apps/web/features/tasks/tasksApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFile,
  TaskComment,
  TaskStatus,
  TaskPriority,
  FilePurpose,
} from "@hassad/shared";

// ── Local interfaces ─────────────────────────────────────────────────────────

interface MyTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  /** departmentId UUID filter */
  dept?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface TaskWithProject extends Task {
  project?: {
    id: string;
    name: string;
    clientId: string;
    client?: {
      companyName: string;
      businessType: string;
    };
  };
  assignee?: { id: string; name: string };
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

    /**
     * POST /v1/tasks — create a task.
     * projectId and departmentId must be included in the body.
     */
    createTask: builder.mutation<Task, CreateTaskInput>({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Task", id: `PROJECT_${"projectId" in body ? (body as any).projectId : ""}` },
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
    toggleArchiveTask: builder.mutation<{ message: string }, string>({
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
      { taskId: string; file: File; purpose?: FilePurpose }
    >({
      query: ({ taskId, file, purpose }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (purpose) {
          formData.append("purpose", purpose);
        }

        return {
        url: `/tasks/${taskId}/files`,
        method: "POST",
        body: formData,
      };
      },
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

    /** POST /v1/tasks/:id/start — move TODO→IN_PROGRESS */
    startTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/start`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Task", id }, { type: "Task", id: "MY_TASKS" }],
    }),

    /** POST /v1/tasks/:id/submit — move IN_PROGRESS→IN_REVIEW */
    submitTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/submit`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Task", id }, { type: "Task", id: "MY_TASKS" }],
    }),

    /** POST /v1/tasks/:id/approve — move IN_REVIEW→DONE */
    approveTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/approve`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Task", id }, { type: "Task", id: "MY_TASKS" }],
    }),

    /** POST /v1/tasks/:id/reject — move IN_REVIEW→REVISION */
    rejectTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/reject`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Task", id }, { type: "Task", id: "MY_TASKS" }],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
  useToggleArchiveTaskMutation,
  useGetTaskFilesQuery,
  useUploadTaskFileMutation,
  useDeleteTaskFileMutation,
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} = tasksApi;
