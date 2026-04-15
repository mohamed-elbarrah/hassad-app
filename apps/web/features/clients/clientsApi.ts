// apps/web/features/clients/clientsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  UpdateStageInput,
} from "@hassad/shared";
import type { ClientStatus, PipelineStage } from "@hassad/shared";

// ── Response types ────────────────────────────────────────────────────────────

export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientFilters {
  status?: ClientStatus;
  stage?: PipelineStage;
  search?: string;
  page?: number;
  limit?: number;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const clientsApi = createApi({
  reducerPath: "clientsApi",
  // Auth is cookie-based (HttpOnly). credentials:'include' sends the cookie on every request.
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
    credentials: "include",
  }),
  tagTypes: ["Client"],

  endpoints: (builder) => ({
    /** GET /v1/clients — paginated + filtered list */
    getClients: builder.query<PaginatedClients, ClientFilters>({
      query: (filters = {}) => ({
        url: "/clients",
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Client" as const,
                id,
              })),
              { type: "Client", id: "LIST" },
            ]
          : [{ type: "Client", id: "LIST" }],
    }),

    /** GET /v1/clients/:id — single client with full relations */
    getClientById: builder.query<Client, string>({
      query: (id) => `/clients/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Client", id }],
    }),

    /** POST /v1/clients — create a new client */
    createClient: builder.mutation<Client, CreateClientInput>({
      query: (body) => ({ url: "/clients", method: "POST", body }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),

    /** PATCH /v1/clients/:id — update general client fields */
    updateClient: builder.mutation<
      Client,
      { id: string; body: UpdateClientInput }
    >({
      query: ({ id, body }) => ({
        url: `/clients/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
      ],
    }),

    /** PATCH /v1/clients/:id/stage — dedicated pipeline stage transition */
    updateClientStage: builder.mutation<
      Client,
      { id: string; body: UpdateStageInput }
    >({
      query: ({ id, body }) => ({
        url: `/clients/${id}/stage`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useUpdateClientStageMutation,
} = clientsApi;
