// apps/web/features/clients/clientsApi.ts
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  UpdateStageInput,
  Project,
} from "@hassad/shared";
import type { ClientStatus, PipelineStage } from "@hassad/shared";
import { logout } from "../auth/authSlice";

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

// ── Base query — unwraps ResponseInterceptor envelope + auto-refresh on 401 ──
//
// The NestJS ResponseInterceptor wraps every response as:
//   { success: true, data: <actual_payload>, timestamp: "..." }
// We strip that wrapper here once so every endpoint receives the raw payload.
//
// On 401 (expired access token), this wrapper calls POST /auth/refresh to get a
// new access token (stored in the `token` HttpOnly cookie) and retries once.

const _rawBaseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
  credentials: "include",
});

type RawResult = QueryReturnValue<
  unknown,
  FetchBaseQueryError,
  FetchBaseQueryMeta
>;

/** Strip the { success, data, timestamp } envelope from a successful response. */
function unwrap(result: RawResult): RawResult {
  if (
    !result.error &&
    result.data !== undefined &&
    result.data !== null &&
    typeof result.data === "object" &&
    "data" in (result.data as object)
  ) {
    return { data: (result.data as { data: unknown }).data, meta: result.meta };
  }
  return result;
}

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = unwrap(await _rawBaseQuery(args, api, extraOptions));

  // Auto-refresh when the access token has expired
  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    const refreshResult = await _rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // New access token cookie is now set — retry the original request
      result = unwrap(await _rawBaseQuery(args, api, extraOptions));
    } else {
      // Refresh failed (refresh token expired) — force logout
      api.dispatch(logout());
    }
  }

  return result;
};

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
  useHandoverClientMutation,
} = clientsApi;
