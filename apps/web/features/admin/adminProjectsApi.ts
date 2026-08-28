import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminProjectItem {
  id: string;
  name: string;
  clientName: string;
  pmId: string | null;
  pmName: string;
  status: string;
  completionPercentage: number;
  overdueTasksCount: number;
  priority: string;
  totalValue: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  isBehindSchedule: boolean;
  completedPeriods: number;
  totalPeriods: number;
  remainingValue: number;
}

export interface PaginatedAdminProjects<T = AdminProjectItem> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProjectFilters {
  search?: string;
  pmId?: string;
  clientId?: string;
  status?: string;
  priority?: string;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminProjectActionResult {
  code: string;
}

export interface AdminProjectActorCapabilities {
  canIntervene: boolean;
}

export interface AdminProjectMemberMutationResult {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface AdminProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

export interface AdminProjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: string | null;
  assigneeName?: string;
}

export interface AdminProjectFile {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AdminProjectMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  notes: string | null;
  createdBy: string;
}

export interface AdminProjectPeriod {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  completionPercentage: number;
}

export interface AdminProjectInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  paymentMethod: string | null;
}

export interface AdminProjectPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface AdminProjectHistoryEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface AdminProjectDeliverable {
  id: string;
  title?: string;
  status: string;
  createdAt: string;
  task?: { id: string; title: string } | null;
  period?: { id: string; periodNumber: number } | null;
}

export interface AdminProjectPeriodDetails extends AdminProjectPeriod {
  invoice?: { id: string; invoiceNumber: string; status: string; amount: number } | null;
  _count?: { tasks: number; deliverables: number; meetings: number };
}

export interface AdminProjectTimelineEntry {
  id: string;
  action: string;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

export interface AdminProjectDetail {
  id: string;
  clientId: string;
  contractId: string | null;
  projectManagerId: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requestId: string | null;
  client: { id: string; companyName: string };
  manager: { id: string; name: string; email: string } | null;
  contract: { totalValue: number; monthlyValue: number } | null;
  members: AdminProjectMember[];
  tasks: AdminProjectTask[];
  files: AdminProjectFile[];
  meetings: AdminProjectMeeting[];
  periods: AdminProjectPeriod[];
  totalValue: number;
  monthlyValue: number;
  invoices: AdminProjectInvoice[];
  payments: AdminProjectPayment[];
  history: AdminProjectHistoryEntry[];
}

export const adminProjectsApi = createApi({
  reducerPath: "adminProjectsApi",
  baseQuery,
  tagTypes: ["AdminProjects", "AdminProject"],
  endpoints: (builder) => ({
    reassignAdminProjectPM: builder.mutation<AdminProjectActionResult, { id: string; pmUserId: string; reason?: string }>({
      query: ({ id, pmUserId, reason }) => ({
        url: `/admin/projects/${id}/reassign-pm`,
        method: "POST",
        body: { pmUserId, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }, "AdminProjects"],
    }),

    archiveAdminProject: builder.mutation<AdminProjectActionResult, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/projects/${id}/archive`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }, "AdminProjects"],
    }),

    unarchiveAdminProject: builder.mutation<AdminProjectActionResult, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/projects/${id}/unarchive`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }, "AdminProjects"],
    }),

    forceAdminProjectStatus: builder.mutation<AdminProjectActionResult, { id: string; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/admin/projects/${id}/force-status`,
        method: "POST",
        body: { status, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }, "AdminProjects"],
    }),

    addAdminProjectMember: builder.mutation<AdminProjectMemberMutationResult, { id: string; userId: string; role: string }>({
      query: ({ id, userId, role }) => ({
        url: `/admin/projects/${id}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }],
    }),
    getAdminProjects: builder.query<
      PaginatedAdminProjects,
      AdminProjectFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/projects";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.pmId) params.set("pmId", filters.pmId);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.overdueOnly) params.set("overdueOnly", "true");
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/projects?${params.toString()}`;
      },
      providesTags: ["AdminProjects"],
    }),

    getAdminProjectActorCapabilities: builder.query<AdminProjectActorCapabilities, void>({
      query: () => "/admin/projects/capabilities",
      providesTags: ["AdminProjects"],
    }),

    getAdminProjectById: builder.query<AdminProjectDetail, string>({
      query: (id) => `/admin/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminProject", id }],
    }),
    getAdminProjectPeriods: builder.query<AdminProjectPeriodDetails[], string>({
      query: (id) => `/admin/projects/${id}/periods`,
      providesTags: (_result, _error, id) => [{ type: "AdminProject", id }],
    }),
    getAdminProjectTeam: builder.query<AdminProjectMember[], string>({
      query: (id) => `/admin/projects/${id}/team`,
      providesTags: (_result, _error, id) => [{ type: "AdminProject", id }],
    }),
    addAdminProjectTask: builder.mutation<AdminProjectTask, { id: string; title: string; assigneeId?: string; priority?: string; dueDate?: string; status?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/projects/${id}/tasks`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }],
    }),
    getAdminProjectTasks: builder.query<PaginatedAdminProjects<AdminProjectTask>, { id: string; page?: number; limit?: number; status?: string; priority?: string }>({
      query: ({ id, page = 1, limit = 20, status, priority }) => ({ url: `/admin/projects/${id}/tasks`, params: { page, limit, ...(status ? { status } : {}), ...(priority ? { priority } : {}) } }),
      providesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }],
    }),
    getAdminProjectDeliverables: builder.query<PaginatedAdminProjects<AdminProjectDeliverable>, { id: string; page?: number; limit?: number; status?: string }>({
      query: ({ id, page = 1, limit = 20, status }) => ({ url: `/admin/projects/${id}/deliverables`, params: { page, limit, ...(status ? { status } : {}) } }),
      providesTags: (_result, _error, { id }) => [{ type: "AdminProject", id }],
    }),
    getAdminProjectTimeline: builder.query<AdminProjectTimelineEntry[], string>({
      query: (id) => `/admin/projects/${id}/timeline`,
      providesTags: (_result, _error, id) => [{ type: "AdminProject", id }],
    }),
  }),
});

export const {
  useGetAdminProjectsQuery,
  useGetAdminProjectByIdQuery,
  useGetAdminProjectActorCapabilitiesQuery,
  useReassignAdminProjectPMMutation,
  useArchiveAdminProjectMutation,
  useUnarchiveAdminProjectMutation,
  useForceAdminProjectStatusMutation,
  useAddAdminProjectMemberMutation,
  useAddAdminProjectTaskMutation,
  useGetAdminProjectPeriodsQuery,
  useGetAdminProjectTeamQuery,
  useGetAdminProjectTasksQuery,
  useGetAdminProjectDeliverablesQuery,
  useGetAdminProjectTimelineQuery,
} = adminProjectsApi;
