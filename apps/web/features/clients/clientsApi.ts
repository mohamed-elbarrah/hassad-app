// apps/web/features/clients/clientsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Client,
  ClientProfile,
  CreateClientInput,
  UpdateClientInput,
  UpsertClientProfileInput,
  Project,
} from "@hassad/shared";
import type { ClientStatus } from "@hassad/shared";

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
  search?: string;
  page?: number;
  limit?: number;
}

export interface HandoverInput {
  name: string;
  managerId: string;
  startDate: string;
  endDate: string;
}

export interface HandoverResult {
  client: Pick<Client, "id" | "status" | "updatedAt">;
  project: Project;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const clientsApi = createApi({
  reducerPath: "clientsApi",
  baseQuery,
  tagTypes: ["Client", "ClientProfile", "Project"],
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

    /**
     * POST /v1/clients/:id/handover
     * Atomically moves client to ACTIVE status and creates a project.
     */
    handoverClient: builder.mutation<
      HandoverResult,
      { id: string; body: HandoverInput }
    >({
      query: ({ id, body }) => ({
        url: `/clients/${id}/handover`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "Project", id: "LIST" },
      ],
    }),

    /** GET /v1/clients/:id/profile */
    getClientProfile: builder.query<ClientProfile, string>({
      query: (id) => `/clients/${id}/profile`,
      providesTags: (_result, _err, id) => [{ type: "ClientProfile", id }],
    }),

    /** PUT /v1/clients/:id/profile */
    upsertClientProfile: builder.mutation<
      ClientProfile,
      { id: string; data: UpsertClientProfileInput }
    >({
      query: ({ id, data }) => ({
        url: `/clients/${id}/profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "ClientProfile", id },
        { type: "Client", id },
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useHandoverClientMutation,
  useGetClientProfileQuery,
  useUpsertClientProfileMutation,
} = clientsApi;
