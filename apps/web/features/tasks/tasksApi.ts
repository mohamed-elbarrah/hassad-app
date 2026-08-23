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
  TaskDepartment,
  FilePurpose,
} from "@hassad/shared";

// ── Local interfaces ─────────────────────────────────────────────────────────

interface MyTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  /** departmentId UUID filter */
  dept?: string;
  /** department name filter (e.g. "MARKETING") */
  deptName?: string;
  dueBefore?: string;
  dueAfter?: string;
  /** include campaigns with latest KPI snapshot */
  includeCampaigns?: boolean;
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
  creator?: { id: string; name: string };
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

export interface PmTaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  overdue: number;
  projects: number;
}

export interface PmTasksResponse {
  items: TaskWithProject[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PmTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  department?: TaskDepartment;
  search?: string;
  page?: number;
  limit?: number;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
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

    /** POST /v1/pm/projects/:projectId/tasks — PM-owned task creation */
    createPmProjectTask: builder.mutation<
      Task,
      CreateTaskInput & { projectId: string }
    >({
      query: ({ projectId, ...body }) => ({
        url: `/pm/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
        { type: "Task", id: `PROJECT_${projectId}` },
      ],
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
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "MY_STATS" },
        { type: "Task", id: "PM_STATS" },
        {
          type: "Task",
          id: `PROJECT_${"projectId" in body ? (body as any).projectId : ""}`,
        },
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
    toggleArchiveTask: builder.mutation<
      { code: string; archived: boolean },
      string
    >({
      query: (id) => ({ url: `/tasks/${id}/archive`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "MY_STATS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** GET /v1/pm/tasks/:id — PM-owned task detail */
    getPmTaskById: builder.query<TaskWithProject, string>({
      query: (taskId) => `/pm/tasks/${taskId}`,
      providesTags: (_result, _error, taskId) => [{ type: "Task", id: taskId }],
    }),

    /** GET /v1/pm/tasks/:taskId/files */
    getPmTaskFiles: builder.query<TaskFile[], string>({
      query: (taskId) => `/pm/tasks/${taskId}/files`,
      transformResponse: (response: { items: TaskFile[] }) => response.items,
      providesTags: (_result, _error, taskId) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** GET /v1/pm/tasks/:taskId/comments */
    getPmTaskComments: builder.query<TaskComment[], string>({
      query: (taskId) => `/pm/tasks/${taskId}/comments`,
      transformResponse: (response: { items: TaskComment[] }) => response.items,
      providesTags: (_result, _error, taskId) => [
        { type: "Task", id: `COMMENTS_${taskId}` },
      ],
    }),

    /** POST /v1/pm/tasks/:taskId/comments */
    addPmTaskComment: builder.mutation<
      TaskComment,
      { taskId: string; content: string }
    >({
      query: ({ taskId, content }) => ({
        url: `/pm/tasks/${taskId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `COMMENTS_${taskId}` },
      ],
    }),

    /** POST /v1/pm/tasks/:taskId/files */
    uploadPmTaskFile: builder.mutation<
      TaskFile,
      { taskId: string; file: File; purpose?: FilePurpose }
    >({
      query: ({ taskId, file, purpose }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (purpose) formData.append("purpose", purpose);
        return {
          url: `/pm/tasks/${taskId}/files`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** DELETE /v1/pm/tasks/:taskId/files/:fileId */
    deletePmTaskFile: builder.mutation<
      void,
      { taskId: string; fileId: string }
    >({
      query: ({ taskId, fileId }) => ({
        url: `/pm/tasks/${taskId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `FILES_${taskId}` },
      ],
    }),

    /** GET /v1/pm/tasks/:taskId/files/:fileId/download */
    getPmTaskFileDownload: builder.query<
      { url: string },
      { taskId: string; fileId: string }
    >({
      query: ({ taskId, fileId }) =>
        `/pm/tasks/${taskId}/files/${fileId}/download`,
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
      invalidatesTags: (_r, _e, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** POST /v1/tasks/:id/submit — move IN_PROGRESS→IN_REVIEW */
    submitTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/submit`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** POST /v1/tasks/:id/approve — move IN_REVIEW→DONE */
    approveTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/approve`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** PATCH /v1/tasks/:id/status — change task status to any valid state */
    changeTaskStatus: builder.mutation<
      Task,
      { id: string; status: TaskStatus }
    >({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "MY_STATS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** PATCH /v1/pm/tasks/:id/status — PM-owned status update */
    changePmTaskStatus: builder.mutation<
      Task,
      { id: string; status: TaskStatus }
    >({
      query: ({ id, status }) => ({
        url: `/pm/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** GET /v1/pm/tasks — all tasks across PM's projects */
    getPmTasks: builder.query<PmTasksResponse, PmTasksFilters>({
      query: (filters = {}) => ({
        url: "/pm/tasks",
        params: filters,
      }),
      providesTags: [{ type: "Task", id: "PM_TASKS" }],
    }),

    /** GET /v1/pm/tasks/stats — aggregated stats for PM's projects */
    getPmTaskStats: builder.query<PmTaskStats, void>({
      query: () => "/pm/tasks/stats",
      providesTags: [{ type: "Task", id: "PM_STATS" }],
    }),

    /** POST /v1/tasks/:id/reject — move IN_REVIEW→REVISION */
    rejectTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/reject`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),

    /** POST /v1/tasks/:id/assign — assign a task to a user (PM only) */
    assignTask: builder.mutation<Task, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `/tasks/${id}/assign`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "MY_TASKS" },
        { type: "Task", id: "MY_STATS" },
        { type: "Task", id: "PM_TASKS" },
        { type: "Task", id: "PM_STATS" },
      ],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useCreatePmProjectTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
  useToggleArchiveTaskMutation,
  useGetTaskFilesQuery,
  useGetPmTaskByIdQuery,
  useGetPmTaskFilesQuery,
  useGetPmTaskCommentsQuery,
  useAddPmTaskCommentMutation,
  useUploadPmTaskFileMutation,
  useDeletePmTaskFileMutation,
  useLazyGetPmTaskFileDownloadQuery,
  useUploadTaskFileMutation,
  useDeleteTaskFileMutation,
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useChangeTaskStatusMutation,
  useChangePmTaskStatusMutation,
  useRejectTaskMutation,
  useAssignTaskMutation,
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} = tasksApi;
