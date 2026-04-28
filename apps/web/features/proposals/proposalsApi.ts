import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import { getApiBaseUrl } from "@/lib/utils";
import type {
  Proposal,
  UpdateProposalInput,
  ProposalResponseInput,
  ProposalStatus,
} from "@hassad/shared";

export interface ProposalListItem extends Proposal {
  filePath?: string | null;
  lead?: { id: string; contactName: string; companyName: string };
  creator?: { id: string; name: string };
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
  leadId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Input for one-step create+send via multipart/form-data */
export interface CreateProposalFormInput {
  leadId: string;
  title: string;
  file: File;
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

    /**
     * One-step: multipart/form-data upload (file + leadId + title).
     * Returns a SENT proposal with shareLinkToken populated.
     */
    createProposal: builder.mutation<ProposalListItem, CreateProposalFormInput>({
      queryFn: async (input) => {
        const formData = new FormData();
        formData.append("leadId", input.leadId);
        formData.append("title", input.title);
        formData.append("file", input.file, input.file.name);

        // Ensure we have a usable API base URL. In dev this may be missing
        // from env during client runtime, so fall back to window origin.
        const apiBase =
          getApiBaseUrl() ||
          (typeof window !== "undefined"
            ? `${window.location.origin.replace(/\/+$/, "")}/v1`
            : "");

        const res = await fetch(`${apiBase}/proposals`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) {
          return { error: { status: res.status, data: json } };
        }
        // Unwrap the { success, data, timestamp } envelope
        const data: ProposalListItem =
          json?.data !== undefined ? json.data : json;
        return { data };
      },
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
        shareLinkToken: string;
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

    /** CLIENT portal: proposals linked to the logged-in user's leads */
    getMyProposals: builder.query<ProposalListItem[], void>({
      query: () => `/proposals/my`,
      providesTags: [{ type: "Proposal", id: "MY" }],
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
  useGetMyProposalsQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} = proposalsApi;
