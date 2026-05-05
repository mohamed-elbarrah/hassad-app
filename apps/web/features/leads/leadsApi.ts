import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { PipelineStage, BusinessType } from "@hassad/shared";
import { ClientSource } from "@hassad/shared";

export interface LeadListItem {
  id: string;
  requestId?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  pipelineStage: string;
  businessType?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadAssignee {
  id: string;
  name: string;
  email: string;
}

export interface LeadPipelineHistoryItem {
  id: string;
  fromStage: string;
  toStage: string;
  changedBy: string;
  changedAt: string;
}

export interface LeadContactLogItem {
  id: string;
  userId: string;
  type: string; // CALL | WHATSAPP | MEETING | EMAIL
  result: string; // NO_RESPONSE | RESPONDED | BUSY | WRONG_NUMBER
  notes?: string | null;
  contactedAt: string;
}

export interface LeadDetail extends LeadListItem {
  businessName: string;
  source: string;
  assignedTo?: string | null;
  contactAttemptCount: number;
  lastContactAt?: string | null;
  isActive: boolean;
  assignee?: LeadAssignee | null;
  pipelineHistory: LeadPipelineHistoryItem[];
  contactLogs: LeadContactLogItem[];
}

// GET /leads returns a plain array (no pagination wrapper)
export type GetLeadsResponse = LeadListItem[];

export interface LeadFilters {
  search?: string;
  stage?: string;
  page?: number;
  limit?: number;
}

export interface LeadServiceItem {
  serviceId: string;
  quantity?: number;
  notes?: string;
}

export interface CreateLeadPayload {
  contactName: string;
  companyName: string;
  businessName: string;
  phoneWhatsapp: string;
  email?: string;
  businessType: BusinessType;
  source: ClientSource;
  notes?: string;
  services?: LeadServiceItem[];
}

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Lead"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getLeads: builder.query<GetLeadsResponse, LeadFilters | void>({
      query: (filters) => ({
        url: "/leads",
        params: (filters as LeadFilters) ?? {},
      }),
      providesTags: [{ type: "Lead", id: "LIST" }],
    }),

    getLeadById: builder.query<LeadDetail, string>({
      query: (id) => ({ url: `/leads/${id}` }),
      providesTags: (_, __, id) => [{ type: "Lead", id }],
    }),

    createLead: builder.mutation<LeadListItem, CreateLeadPayload>({
      query: (body) => ({
        url: "/leads",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }],
    }),

    updateLeadStage: builder.mutation<
      LeadListItem,
      { id: string; toStage: PipelineStage }
    >({
      query: ({ id, toStage }) => ({
        url: `/leads/${id}/stage`,
        method: "POST",
        body: { toStage },
      }),
      // Optimistic update: move the card immediately, roll back on error
      async onQueryStarted({ id, toStage }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          leadsApi.util.updateQueryData("getLeads", { limit: 100 }, (draft) => {
            const lead = draft.find((l) => l.id === id);
            if (lead) {
              lead.pipelineStage = toStage;
              lead.updatedAt = new Date().toISOString();
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadStageMutation,
} = leadsApi;
