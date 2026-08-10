"use client";

import type {
  ProposalWorkspaceQuery,
  ProposalWorkspaceRecord,
} from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";

export type CrmProposalsWorkspaceQuery = Omit<ProposalWorkspaceQuery, "creatorId">;
export type CrmProposalsWorkspaceResponse = {
  items: Omit<ProposalWorkspaceRecord, "creator">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const crmProposalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmProposalsWorkspace: builder.query<
      CrmProposalsWorkspaceResponse,
      CrmProposalsWorkspaceQuery
    >({
      query: (params) => ({ url: "/crm/proposals", params }),
    }),
  }),
});

export const { useGetCrmProposalsWorkspaceQuery } = crmProposalsApi;
