import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Contract,
  CreateContractInput,
  UpdateContractInput,
  SignContractInput,
  ContractStatus,
} from "@hassad/shared";

export interface ContractListItem extends Contract {
  client?: { id: string; name: string };
}

export interface PaginatedContracts {
  items: ContractListItem[];
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

    getContractById: builder.query<ContractListItem, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Contract", id }],
    }),

    createContract: builder.mutation<ContractListItem, CreateContractInput>({
      query: (body) => ({ url: "/contracts", method: "POST", body }),
      invalidatesTags: [{ type: "Contract", id: "LIST" }],
    }),

    updateContract: builder.mutation<
      ContractListItem,
      { id: string; body: UpdateContractInput }
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

    sendContract: builder.mutation<
      { id: string; status: ContractStatus; sentAt: string },
      string
    >({
      query: (id) => ({ url: `/contracts/${id}/send`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    signContract: builder.mutation<
      {
        id: string;
        status: ContractStatus;
        signedAt: string;
        signedByName: string;
      },
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
  }),
});

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useSendContractMutation,
  useSignContractMutation,
} = contractsApi;
