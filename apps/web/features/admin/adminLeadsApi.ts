import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminLeadItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string;
  assigneeId: string | null;
  assigneeName: string;
  pipelineStage: string;
  source: string;
  businessType: string;
  contactAttemptCount: number;
  lastContactAt: string | null;
  createdAt: string;
  potentialValue: number | null;
  daysSinceLastContact: number | null;
  hasProposal: boolean;
}

export interface PaginatedAdminLeads {
  items: AdminLeadItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminLeadFilters {
  search?: string;
  noContactSince?: number;
  assigneeId?: string;
  stage?: string;
  source?: string;
  businessType?: string;
  page?: number;
  limit?: number;
}

export interface AdminLeadStats {
  byStage: Array<{ stage: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  conversionRate: number;
}

export interface AdminLeadContactLog {
  id: string;
  type: string;
  result: string;
  notes: string | null;
  contactedAt: string;
  user: { name: string };
}

export interface AdminLeadProposal {
  id: string;
  title: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface AdminLeadDetail {
  id: string;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email: string | null;
  businessName: string;
  businessType: string;
  source: string;
  assignedTo: string | null;
  pipelineStage: string;
  contactAttemptCount: number;
  lastContactAt: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  requestId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  contactLogs: AdminLeadContactLog[];
  pipelineHistory: Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    changedBy: string;
    changedAt: string;
    reason: string | null;
    changer: { id: string; name: string };
  }>;
  proposals: AdminLeadProposal[];
  client: { id: string } | null;
}

export const adminLeadsApi = createApi({
  reducerPath: "adminLeadsApi",
  baseQuery,
  tagTypes: ["AdminLeads", "AdminLead", "AdminLeadStats"],
  endpoints: (builder) => ({
    getAdminLeads: builder.query<
      PaginatedAdminLeads,
      AdminLeadFilters | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/leads";
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.noContactSince)
          params.set("noContactSince", String(filters.noContactSince));
        if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
        if (filters.stage) params.set("stage", filters.stage);
        if (filters.source) params.set("source", filters.source);
        if (filters.businessType)
          params.set("businessType", filters.businessType);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/leads?${params.toString()}`;
      },
      providesTags: ["AdminLeads"],
    }),

    getAdminLeadById: builder.query<AdminLeadDetail, string>({
      query: (id) => `/admin/leads/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminLead", id }],
    }),

    getAdminLeadStats: builder.query<AdminLeadStats, void>({
      query: () => "/admin/leads/stats",
      providesTags: ["AdminLeadStats"],
    }),
  }),
});

export const {
  useGetAdminLeadsQuery,
  useGetAdminLeadByIdQuery,
  useGetAdminLeadStatsQuery,
} = adminLeadsApi;
