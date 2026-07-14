import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminClientItem {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  companyName: string;
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
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminClientStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export interface AdminClientDetail {
  id: string;
  companyName: string;
  businessName: string;
  businessType: string;
  status: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
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
  overdueInvoicesCount: number;
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
    status: string;
    dueDate: string | null;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
  historyLogs: Array<{
    id: string;
    eventType: string;
    description: string;
    userName: string | null;
    occurredAt: string;
  }>;
}

export const adminClientsApi = createApi({
  reducerPath: "adminClientsApi",
  baseQuery,
  tagTypes: ["AdminClients", "AdminClient", "AdminClientStats", "AdminClientUsers"],
  endpoints: (builder) => ({
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
} = adminClientsApi;
