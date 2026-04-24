import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Proposal,
  CreateProposalInput,
  UpdateProposalInput,
  ProposalResponseInput,
  ProposalStatus,
} from "@hassad/shared";

export interface ProposalListItem extends Proposal {
  client?: { id: string; name: string };
}

export interface PaginatedProposals {
  items: ProposalListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProposalFilters {
  status?: ProposalStatus;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const proposalsApi = createApi({
  reducerPath: "proposalsApi",
  baseQuery,
  tagTypes: ["Proposal"],
  endpoints: (builder) => ({
    getProposals: builder.query<PaginatedProposals, ProposalFilters>({
      query: (filters = {}) => ({ url: "/proposals", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Proposal" as const,
                id,
              })),
              { type: "Proposal", id: "LIST" },
            ]
          : [{ type: "Proposal", id: "LIST" }],
    }),

    getProposalById: builder.query<ProposalListItem, string>({
      query: (id) => `/proposals/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Proposal", id }],
    }),

    createProposal: builder.mutation<ProposalListItem, CreateProposalInput>({
      query: (body) => ({ url: "/proposals", method: "POST", body }),
      invalidatesTags: [{ type: "Proposal", id: "LIST" }],
    }),

    updateProposal: builder.mutation<
      ProposalListItem,
      { id: string; body: UpdateProposalInput }
    >({
      query: ({ id, body }) => ({
        url: `/proposals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Proposal", id },
        { type: "Proposal", id: "LIST" },
      ],
    }),

    sendProposal: builder.mutation<
      {
        id: string;
        status: ProposalStatus;
        shareToken: string;
        sentAt: string;
      },
      string
    >({
      query: (id) => ({ url: `/proposals/${id}/send`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Proposal", id },
        { type: "Proposal", id: "LIST" },
      ],
    }),

    getProposalByToken: builder.query<ProposalListItem, string>({
      query: (token) => `/proposals/share/${token}`,
    }),

    approveProposalByToken: builder.mutation<
      { id: string; status: ProposalStatus; approvedAt: string },
      { token: string; body: ProposalResponseInput }
    >({
      query: ({ token, body }) => ({
        url: `/proposals/share/${token}/approve`,
        method: "POST",
        body,
      }),
    }),

    requestRevisionByToken: builder.mutation<
      { id: string; status: ProposalStatus; revisionNotes: string | null },
      { token: string; body: ProposalResponseInput }
    >({
      query: ({ token, body }) => ({
        url: `/proposals/share/${token}/revision`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetProposalsQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useSendProposalMutation,
  useGetProposalByTokenQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} = proposalsApi;
