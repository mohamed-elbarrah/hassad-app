// apps/web/features/clients/clientsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  UpdateStageInput,
  Project,
  ContactOutcome,
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

export interface HandoverInput {
  name: string;
  managerId: string;
  startDate: string;
  endDate: string;
}

export interface HandoverResult {
  client: Pick<Client, "id" | "name" | "stage" | "status" | "updatedAt">;
  project: Project;
}

export interface ContactAttemptInput {
  outcome: ContactOutcome;
  notes?: string;
}

export interface ContactAttemptResult {
  id: string;
  contactAttempts: number;
  lastContactAttemptAt: string | null;
  nextFollowUpAt: string | null;
  followUpStep: number;
  updatedAt: string;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const clientsApi = createApi({
  reducerPath: "clientsApi",
  baseQuery,
  tagTypes: ["Client", "Project"],
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

    /** PATCH /v1/clients/:id/requirements — save requirements form data */
    updateClientRequirements: builder.mutation<
      { id: string; requirements: Record<string, unknown>; updatedAt: string },
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/clients/${id}/requirements`,
        method: "PATCH",
        body: { requirements: body },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
      ],
    }),

    /** POST /v1/clients/:id/contact-attempts — log contact attempt */
    logContactAttempt: builder.mutation<
      ContactAttemptResult,
      { id: string; body: ContactAttemptInput }
    >({
      query: ({ id, body }) => ({
        url: `/clients/${id}/contact-attempts`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
      ],
    }),

    /**
     * POST /v1/clients/:id/handover
     * Atomically moves client to HANDOVER stage and creates a project.
     * Invalidates both Client and Project caches.
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
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useUpdateClientStageMutation,
  useUpdateClientRequirementsMutation,
  useLogContactAttemptMutation,
  useHandoverClientMutation,
} = clientsApi;
