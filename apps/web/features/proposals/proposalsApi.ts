import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Proposal,
  UpdateProposalInput,
  ProposalResponseInput,
  ProposalStatus,
  DurationUnit,
} from "@hassad/shared";

export interface ProposalListItem extends Omit<Proposal, "shareLinkToken"> {
  filePath?: string | null;
  client?: {
    id: string;
    companyName: string;
  } | null;
  request?: {
    id: string;
    companyName: string;
    contactName?: string;
    businessName?: string;
    clientId?: string;
  } | null;
  creator?: { id: string; name: string };
}

export interface SalesProposalPerson {
  id: string;
  name: string;
  email?: string | null;
  phoneWhatsapp?: string | null;
}

export interface SalesProposalClientSummary {
  id: string;
  companyName: string;
  businessName: string;
  businessType: string;
  user?: SalesProposalPerson | null;
}

export interface SalesProposalContactLog {
  id: string;
  type: string;
  result: string;
  notes?: string | null;
  contactedAt: string;
  user: SalesProposalPerson;
}

export interface SalesProposalStatusHistory {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  changedAt: string;
  changer?: SalesProposalPerson | null;
}

export interface SalesProposalDetail extends Omit<Proposal, "shareLinkToken"> {
  creator?: SalesProposalPerson | null;
  client?: SalesProposalClientSummary | null;
  contract?: {
    id: string;
    title: string;
    status: string;
  } | null;
  request?: {
    id: string;
    clientId: string;
    assignedSalesId?: string | null;
    companyName: string;
    contactName: string;
    phoneWhatsapp: string;
    email?: string | null;
    businessName: string;
    businessType: string;
    source: string;
    notes?: string | null;
    status: string;
    contactAttemptCount: number;
    lastContactAt?: string | null;
    createdAt: string;
    updatedAt: string;
    client?: SalesProposalClientSummary | null;
    assignee?: SalesProposalPerson | null;
    contactLogs: SalesProposalContactLog[];
    statusHistory: SalesProposalStatusHistory[];
  } | null;
}

export interface PaginatedProposals {
  items: ProposalListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProposalCreateResult extends ProposalListItem {
  shareLinkToken?: string | null;
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

    getSalesProposals: builder.query<PaginatedProposals, ProposalFilters>({
      query: (filters = {}) => ({
        url: "/sales/proposals",
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Proposal" as const,
                id,
              })),
              { type: "Proposal", id: "SALES_LIST" },
            ]
          : [{ type: "Proposal", id: "SALES_LIST" }],
    }),

    getSalesProposalById: builder.query<ProposalListItem, string>({
      query: (id) => `/sales/proposals/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Proposal", id }],
    }),

    getSalesProposalDetail: builder.query<SalesProposalDetail, string>({
      query: (id) => `/sales/proposals/${id}/detail`,
      providesTags: (_result, _error, id) => [{ type: "Proposal", id }],
    }),

    /** One-step: multipart/form-data upload anchored to the request. */
    createProposal: builder.mutation<
      ProposalCreateResult,
      CreateProposalFormInput
    >({
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

        return { url: "/proposals", method: "POST", body: formData };
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

    createSalesProposal: builder.mutation<
      ProposalCreateResult,
      CreateProposalFormInput
    >({
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

        return { url: "/sales/proposals", method: "POST", body: formData };
      },
      invalidatesTags: [{ type: "Proposal", id: "SALES_LIST" }],
    }),

    updateSalesProposal: builder.mutation<
      ProposalListItem,
      { id: string; body: UpdateProposalInput }
    >({
      query: ({ id, body }) => ({
        url: `/sales/proposals/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Proposal", id },
        { type: "Proposal", id: "SALES_LIST" },
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
  useGetSalesProposalsQuery,
  useGetSalesProposalByIdQuery,
  useGetSalesProposalDetailQuery,
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useCreateSalesProposalMutation,
  useUpdateSalesProposalMutation,
  useSendProposalMutation,
  useGetProposalByTokenQuery,
  useGetMyProposalsQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} = proposalsApi;
