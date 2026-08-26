import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { ClientProfile } from "@hassad/shared";

export interface AdminClientItem {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  isActive: boolean;
  lastActiveAt: string | null;
  status: string;
  kind: string;
  businessType: string;
  businessName: string | null;
  createdAt: string;
  companyName: string;
  manager: { id: string; name: string; email: string } | null;
  portalAccess: boolean;
  contractsCount: number;
  projectsCount: number;
  invoicesCount: number;
  totalRevenue: number;
  activeProjects: number;
  completedProjects: number;
  totalContractValue: number;
  overdueInvoicesCount: number;
}

export interface PaginatedAdminClients {
  items: AdminClientItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminClientFilters {
  search?: string;
  status?: "active" | "stopped" | "inactive" | "lead";
  page?: number;
  limit?: number;
}

export interface AdminClientStats {
  total: number;
  lead: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  totalRevenue: number;
}

export interface AdminClientDetail {
  id: string;
  companyName: string;
  businessName: string | null;
  businessType: string;
  status: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  portalAccess: boolean;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; email: string } | null;
}

export interface ClientUserItem {
  id: string;
  clientId: string | null;
  name: string;
  email: string;
  companyName: string | null;
  businessType: string | null;
  status: string;
  portalAccess: boolean;
  totalProjects: number;
  activeProjects: number;
  totalPaid: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PaginatedClientUsers {
  items: ClientUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientUserFilters {
  search?: string;
  status?: string;
  segment?: "new" | "active" | "stopped";
  page?: number;
  limit?: number;
}

export interface AdminClientFullDetail extends AdminClientDetail {
  source: string | null;
  managerName: string | null;
  portalToken: string | null;
  portalTokenExpiresAt: string | null;
  hasPortalAccess: boolean;
  intakeCompleted?: boolean;
  avatarUrl?: string | null;
  avgSatisfactionScore?: number | null;
  totalContractValue?: number | null;
  signedContractValue?: number | null;
  totalInvoiced?: number | null;
  totalPaid?: number | null;
  activeProjects?: number | null;
  completedProjects?: number | null;
  totalProjects?: number | null;
  overdueInvoicesCount: number;
  profile: ClientProfile | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneWhatsapp: string | null;
    avatarUrl: string | null;
  } | null;
  counters: {
    contracts: number;
    projects: number;
    invoices: number;
    payments: number;
    proposals: number;
    requests: number;
  };
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    totalValue: number;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    completionPercentage: number;
    pmName: string | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    remainingAmount: number;
    status: string;
    issueDate: string | null;
    dueDate: string | null;
    paidAt: string | null;
    createdAt: string;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
    invoiceNumber: string | null;
    invoiceId: string | null;
  }>;
  historyLogs: Array<{
    id: string;
    eventType: string;
    description: string | null;
    userId: string | null;
    userName: string | null;
    occurredAt: string;
  }>;
  satRatings?: Array<{
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export const adminClientsApi = createApi({
  reducerPath: "adminClientsApi",
  baseQuery,
  tagTypes: ["AdminClients", "AdminClient", "AdminClientStats", "AdminClientUsers"],
  endpoints: (builder) => ({
    suspendAdminClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/clients/${id}/suspend`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminClient", id }, "AdminClients", "AdminClientStats"],
    }),

    reactivateAdminClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/clients/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminClient", id }, "AdminClients", "AdminClientStats"],
    }),

    assignAdminClientManager: builder.mutation<void, { id: string; managerId: string }>({
      query: ({ id, managerId }) => ({
        url: `/admin/clients/${id}/assign-manager`,
        method: "POST",
        body: { managerId },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminClient", id }, "AdminClients"],
    }),

    toggleAdminClientPortalAccess: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/portal/clients/${id}/toggle-access`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminClient", id }],
    }),

    regenerateAdminClientPortalToken: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/portal/clients/${id}/regenerate-token`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdminClient", id }],
    }),
    getAdminClients: builder.query<
      PaginatedAdminClients,
      AdminClientFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/clients";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.status) params.set("status", filters.status);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/clients?${params.toString()}`;
      },
      providesTags: ["AdminClients"],
    }),

    getAdminClientById: builder.query<AdminClientFullDetail, string>({
      query: (id) => `/admin/clients/${id}/full`,
      providesTags: (_result, _error, id) => [{ type: "AdminClient", id }],
    }),

    getAdminClientStats: builder.query<AdminClientStats, void>({
      query: () => "/admin/clients/stats",
      providesTags: ["AdminClientStats"],
    }),

    getAdminClientUsers: builder.query<
      PaginatedClientUsers,
      ClientUserFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/clients/users";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.status) params.set("status", filters.status);
        if (filters.segment) params.set("segment", filters.segment);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/clients/users?${params.toString()}`;
      },
      providesTags: ["AdminClientUsers"],
    }),
  }),
});

export const {
  useGetAdminClientsQuery,
  useGetAdminClientByIdQuery,
  useGetAdminClientStatsQuery,
  useGetAdminClientUsersQuery,
  useSuspendAdminClientMutation,
  useReactivateAdminClientMutation,
  useAssignAdminClientManagerMutation,
  useToggleAdminClientPortalAccessMutation,
  useRegenerateAdminClientPortalTokenMutation,
} = adminClientsApi;
