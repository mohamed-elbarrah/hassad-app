import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminProposalItem {
  id: string;
  title: string;
  status: string;
  totalPrice: number;
  lead: { id: string; companyName: string } | null;
  client: { id: string; companyName: string } | null;
  creator: { id: string; name: string } | null;
  createdAt: string;
}

export interface PaginatedAdminProposals {
  items: AdminProposalItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProposalFilters {
  status?: string;
  search?: string;
  clientId?: string;
  creatorId?: string;
  page?: number;
  limit?: number;
}

export interface AdminProposalStats {
  total: number;
  sent: number;
  approved: number;
  rejected: number;
  revisionRequested: number;
  conversionRate: number;
}

export interface AdminProposalDetail {
  id: string;
  title: string;
  status: string;
  totalPrice: number;
  lead: { id: string; companyName: string; contactName: string } | null;
  client: { id: string; companyName: string } | null;
  creator: { id: string; name: string; email: string } | null;
  request: {
    id: string;
    companyName: string;
    contactName: string;
    status: string;
  } | null;
  contract: { id: string; title: string; status: string } | null;
  createdAt: string;
}

export const adminProposalsApi = createApi({
  reducerPath: "adminProposalsApi",
  baseQuery,
  tagTypes: ["AdminProposals", "AdminProposal", "AdminProposalStats"],
  endpoints: (builder) => ({
    getAdminProposals: builder.query<
      PaginatedAdminProposals,
      AdminProposalFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/proposals";
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.search) params.set("search", filters.search);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.creatorId) params.set("creatorId", filters.creatorId);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/proposals?${params.toString()}`;
      },
      providesTags: ["AdminProposals"],
    }),

    getAdminProposalById: builder.query<AdminProposalDetail, string>({
      query: (id) => `/admin/proposals/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminProposal", id }],
    }),

    getAdminProposalStats: builder.query<AdminProposalStats, void>({
      query: () => "/admin/proposals/stats",
      providesTags: ["AdminProposalStats"],
    }),
  }),
});

export const {
  useGetAdminProposalsQuery,
  useGetAdminProposalByIdQuery,
  useGetAdminProposalStatsQuery,
} = adminProposalsApi;
