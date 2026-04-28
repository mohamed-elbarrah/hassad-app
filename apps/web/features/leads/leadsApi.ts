import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { PipelineStage } from "@hassad/shared";

export interface LeadListItem {
  id: string;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  pipelineStage: string;
  businessType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetLeadsResponse {
  items: LeadListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadFilters {
  search?: string;
  stage?: string;
  page?: number;
  limit?: number;
}

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Lead"],
  endpoints: (builder) => ({
    getLeads: builder.query<GetLeadsResponse, LeadFilters | void>({
      query: (filters) => ({
        url: "/leads",
        params: (filters as LeadFilters) ?? {},
      }),
      providesTags: [{ type: "Lead", id: "LIST" }],
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
      invalidatesTags: [{ type: "Lead", id: "LIST" }],
    }),
  }),
});

export const { useGetLeadsQuery, useUpdateLeadStageMutation } = leadsApi;
