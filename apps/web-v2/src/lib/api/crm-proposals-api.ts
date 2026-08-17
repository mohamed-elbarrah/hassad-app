"use client";

import type { ProposalWorkspaceQuery, ProposalWorkspaceRecord } from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";
import type { CrmActionToast } from "@/lib/api/crm-action-toast";

export type CrmProposalsWorkspaceQuery = Omit<ProposalWorkspaceQuery, "creatorId">;
export type CrmProposalsWorkspaceResponse = {
  items: Omit<ProposalWorkspaceRecord, "creator">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CrmProposalDetailApi = {
  id: string;
  requestId: string | null;
  clientId: string | null;
  title: string;
  serviceDescription: string;
  servicesList: Array<{ name: string; description?: string; price?: number }>;
  totalPrice: number;
  durationDays: number;
  durationUnit: string;
  platforms: string[];
  status: string;
  shareLinkToken?: string | null;
  sentAt: string | null;
  approvedAt?: string | null;
  createdAt: string;
  filePath: string | null;
  contactEmail: string | null;
  contactName: string | null;
  startDate: string | null;
  offerValidityDays: number;
  request?: {
    id: string;
    companyName: string;
    contactName: string;
    status: string;
  } | null;
  client?: { id: string; companyName: string } | null;
  creator?: { id: string; name: string; email: string } | null;
  contract?: { id: string; title: string; status: string } | null;
};

export type CrmProposalMutationResponse = {
  proposal: CrmProposalDetailApi;
  toast: CrmActionToast;
};

export const crmProposalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmProposalsWorkspace: builder.query<
      CrmProposalsWorkspaceResponse,
      CrmProposalsWorkspaceQuery
    >({
      query: (params) => ({ url: "/crm/proposals", params }),
      providesTags: ["Crm"],
    }),
    getCrmProposalDetail: builder.query<CrmProposalDetailApi, string>({
      query: (id) => ({ url: `/crm/proposals/${id}` }),
      providesTags: ["Crm"],
    }),
    createCrmProposal: builder.mutation<CrmProposalMutationResponse, FormData>({
      query: (body) => ({
        url: "/crm/proposals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Crm", "CrmOverview"],
    }),
    updateCrmProposal: builder.mutation<CrmProposalMutationResponse, { id: string; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/crm/proposals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Crm", "CrmOverview"],
    }),
    sendCrmProposal: builder.mutation<CrmProposalMutationResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/crm/proposals/${id}/send`,
        method: "POST",
      }),
      invalidatesTags: ["Crm", "CrmOverview"],
    }),
  }),
});

export const {
  useCreateCrmProposalMutation,
  useGetCrmProposalDetailQuery,
  useGetCrmProposalsWorkspaceQuery,
  useSendCrmProposalMutation,
  useUpdateCrmProposalMutation,
} = crmProposalsApi;
