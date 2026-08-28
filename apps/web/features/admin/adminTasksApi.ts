import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { TaskStatus } from "@hassad/shared";

export interface AdminTaskItem {
  id: string;
  title: string;
  projectName: string;
  assigneeId: string | null;
  assigneeName: string;
  department: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
  revisionCount: number;
  createdAt: string;
}

export interface PaginatedAdminTasks {
  items: AdminTaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminTaskStats {
  total: number;
  overdue: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface AdminTaskFilters {
  search?: string;
  assigneeId?: string;
  projectId?: string;
  department?: string;
  status?: string;
  priority?: string;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminTaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

export interface AdminTaskFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface AdminTaskActionResult {
  code: string;
}
export interface AdminTaskActorCapabilities {
  canIntervene: boolean;
}

export interface AdminTaskDetail {
  id: string;
  projectId: string;
  departmentId: string;
  assignedTo: string | null;
  createdBy: string;
  approvedBy: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  revisionCount: number;
  isVisibleToClient: boolean;
  periodId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
  department: { name: string } | null;
  availableTransitionTargets: TaskStatus[];
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    changedAt: string;
    changer: { id?: string; name: string } | null;
  }>;
  comments: AdminTaskComment[];
  files: AdminTaskFile[];
}

export const adminTasksApi = createApi({
  reducerPath: "adminTasksApi",
  baseQuery,
  tagTypes: ["AdminTasks", "AdminTask"],
  endpoints: (builder) => ({
    getAdminTasks: builder.query<PaginatedAdminTasks, AdminTaskFilters | void>({
      query: (filters) => {
        if (!filters) return "/admin/tasks";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
        if (filters.projectId) params.set("projectId", filters.projectId);
        if (filters.department) params.set("department", filters.department);
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.overdueOnly) params.set("overdueOnly", "true");
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/tasks?${params.toString()}`;
      },
      providesTags: ["AdminTasks"],
    }),

    getAdminTaskStats: builder.query<AdminTaskStats, AdminTaskFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.search) params.set("search", filters.search);
          if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
          if (filters.projectId) params.set("projectId", filters.projectId);
          if (filters.department) params.set("department", filters.department);
          if (filters.status) params.set("status", filters.status);
          if (filters.priority) params.set("priority", filters.priority);
          if (filters.overdueOnly) params.set("overdueOnly", "true");
        }
        return `/admin/tasks/stats?${params.toString()}`;
      },
      providesTags: ["AdminTasks"],
    }),

    getAdminTaskActorCapabilities: builder.query<
      AdminTaskActorCapabilities,
      void
    >({
      query: () => "/admin/tasks/capabilities",
      providesTags: ["AdminTasks"],
    }),
    getAdminTaskById: builder.query<AdminTaskDetail, string>({
      query: (id) => `/admin/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminTask", id }],
    }),
    reassignAdminTask: builder.mutation<
      AdminTaskActionResult,
      { id: string; assigneeId: string; reason: string }
    >({
      query: ({ id, assigneeId, reason }) => ({
        url: `/admin/tasks/${id}/reassign`,
        method: "POST",
        body: { assigneeId, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminTask", id },
        "AdminTasks",
      ],
    }),
    forceTransitionAdminTask: builder.mutation<
      AdminTaskActionResult,
      { id: string; status: TaskStatus; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/admin/tasks/${id}/force-transition`,
        method: "POST",
        body: { status, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminTask", id },
        "AdminTasks",
      ],
    }),
  }),
});

export const {
  useGetAdminTasksQuery,
  useGetAdminTaskStatsQuery,
  useGetAdminTaskByIdQuery,
  useGetAdminTaskActorCapabilitiesQuery,
  useReassignAdminTaskMutation,
  useForceTransitionAdminTaskMutation,
} = adminTasksApi;
