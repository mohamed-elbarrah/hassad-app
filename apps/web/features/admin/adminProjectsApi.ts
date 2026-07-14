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

export interface PaginatedAdminProjects {
  items: AdminProjectItem[];
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
}

export interface AdminProjectFile {
  id: string;
  fileName: string;
  filePath: string;
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

    getAdminProjectById: builder.query<AdminProjectDetail, string>({
      query: (id) => `/admin/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminProject", id }],
    }),
  }),
});

export const { useGetAdminProjectsQuery, useGetAdminProjectByIdQuery } =
  adminProjectsApi;
