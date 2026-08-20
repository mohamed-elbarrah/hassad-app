import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Proposal,
  UpdateProposalInput,
  ProposalResponseInput,
  ProposalStatus,
  DurationUnit,
} from "@hassad/shared";

export interface ProposalListItem extends Proposal {
  filePath?: string | null;
  client?: {
    id: string;
    companyName: string;
  } | null;
  request?: {
    id: string;
    companyName: string;
    contactName?: string;
    status?: string;
  } | null;
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

export interface ServiceItem {
  name: string;
  price: number;
  description?: string;
}

export interface CreateProposalFormInput {
  requestId: string;
  title: string;
  serviceDescription: string;
  file: File;
  servicesList: ServiceItem[];
  totalPrice: number;
  durationDays: number;
  durationUnit: DurationUnit;
  startDate: string;
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

    /** One-step: multipart/form-data upload anchored to the request. */
    createProposal: builder.mutation<ProposalListItem, CreateProposalFormInput>(
      {
        query: (input) => {
          const formData = new FormData();
          formData.append("requestId", input.requestId);
          formData.append("title", input.title);
          formData.append("serviceDescription", input.serviceDescription);
          formData.append("file", input.file, input.file.name);
          formData.append("servicesList", JSON.stringify(input.servicesList));
          formData.append("totalPrice", String(input.totalPrice));
          formData.append("durationDays", String(input.durationDays));
          formData.append("durationUnit", input.durationUnit);
          if (input.startDate) formData.append("startDate", input.startDate);

          return { url: "/proposals", method: "POST", body: formData };
        },
        invalidatesTags: [{ type: "Proposal", id: "LIST" }],
      },
    ),

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
      providesTags: (_result, _error, token) => [
        { type: "Proposal", id: `share-${token}` },
      ],
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
      invalidatesTags: (_result, _error, { token }) => [
        { type: "Proposal", id: `share-${token}` },
      ],
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
      invalidatesTags: (_result, _error, { token }) => [
        { type: "Proposal", id: `share-${token}` },
      ],
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
