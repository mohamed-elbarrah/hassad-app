import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import { getApiBaseUrl } from "@/lib/utils";
import type { ContractStatus, ContractType } from "@hassad/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractClient {
  id: string;
  companyName: string;
  contactName: string;
  leadId?: string | null;
}

export interface ContractItem {
  id: string;
  clientId: string;
  proposalId?: string | null;
  createdBy: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  filePath?: string | null;
  shareLinkToken?: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt?: string | null;
  createdAt: string;
  client?: ContractClient;
}

export interface PaginatedContracts {
  items: ContractItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Input for the FormData POST /contracts mutation */
export interface CreateContractFormInput {
  requestId: string;
  title: string;
  type: ContractType;
  monthlyValue: number;
  totalValue: number;
  startDate: string; // ISO date string e.g. "2026-05-01"
  endDate: string;
  file: File;
  proposalId?: string;
}

export interface SignContractInput {
  signedByName: string;
  signedByEmail?: string;
}

// ─── API slice ────────────────────────────────────────────────────────────────

export const contractsApi = createApi({
  reducerPath: "contractsApi",
  baseQuery,
  tagTypes: ["Contract"],
  endpoints: (builder) => ({
    getContracts: builder.query<PaginatedContracts, ContractFilters>({
      query: (filters = {}) => ({ url: "/contracts", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Contract" as const,
                id,
              })),
              { type: "Contract", id: "LIST" },
            ]
          : [{ type: "Contract", id: "LIST" }],
    }),

    getContractById: builder.query<ContractItem, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Contract", id }],
    }),

    /** One-step: multipart/form-data upload anchored to the request. */
    createContract: builder.mutation<ContractItem, CreateContractFormInput>({
      queryFn: async (input, _api, _extraOptions) => {
        if (!input.requestId) {
          return {
            error: {
              status: 400,
              data: { message: "requestId is required" },
            },
          };
        }

        const formData = new FormData();
        formData.append("requestId", input.requestId);
        formData.append("title", input.title);
        formData.append("type", input.type);
        formData.append("monthlyValue", String(input.monthlyValue));
        formData.append("totalValue", String(input.totalValue));
        formData.append("startDate", input.startDate);
        formData.append("endDate", input.endDate);
        formData.append("file", input.file, input.file.name);
        if (input.proposalId) formData.append("proposalId", input.proposalId);

        const apiBase =
          getApiBaseUrl() ||
          (typeof window !== "undefined"
            ? `${window.location.origin.replace(/\/+$/, "")}/v1`
            : "");

        const res = await fetch(`${apiBase}/contracts`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) {
          return { error: { status: res.status, data: json } };
        }
        // Unwrap envelope
        const data = json?.data !== undefined ? json.data : json;
        return { data };
      },
      invalidatesTags: [{ type: "Contract", id: "LIST" }],
    }),

    updateContract: builder.mutation<
      ContractItem,
      { id: string; body: Partial<ContractItem> }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    sendContract: builder.mutation<ContractItem, string>({
      query: (id) => ({ url: `/contracts/${id}/send`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    signContract: builder.mutation<
      ContractItem,
      { id: string; body: SignContractInput }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    // ─── Public token-based endpoints ───────────────────────────────────────

    getContractByToken: builder.query<ContractItem, string>({
      query: (token) => `/contracts/share/${token}`,
      providesTags: (_result, _error, token) => [
        { type: "Contract", id: `token:${token}` },
      ],
    }),

    /** CLIENT portal: contracts linked to the logged-in user's leads */
    getMyContracts: builder.query<ContractItem[], void>({
      query: () => `/contracts/my`,
      providesTags: [{ type: "Contract", id: "MY" }],
    }),

    signContractByToken: builder.mutation<
      ContractItem,
      { token: string; body: SignContractInput }
    >({
      query: ({ token, body }) => ({
        url: `/contracts/share/${token}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { token }) => [
        { type: "Contract", id: `token:${token}` },
        { type: "Contract", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useSendContractMutation,
  useSignContractMutation,
  useGetContractByTokenQuery,
  useGetMyContractsQuery,
  useSignContractByTokenMutation,
} = contractsApi;
