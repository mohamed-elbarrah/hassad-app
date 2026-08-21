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
import type { ClientKind, ClientStatus } from "@hassad/shared";

// ── V2 Profile Types (unified with IntakeFormV2) ────────────────────────────────

export interface CommunicationInfo {
  // Personal identity (name/email/phone) now lives on `User`,
  // not on `ClientProfile.communicationInfo`. Schema-level
  // enforcement: `CommunicationInfoSchema` (in @hassad/shared)
  // only accepts business fields.
  businessName?: string;
  industry?: string;
}

export interface ProductInfo {
  productStory?: string;
  detailedDescription?: string;
  valueProposition?: string;
  advantages?: string;
  benefits?: string[];
  contentDirection?: string;
}

export interface FaqPair {
  question?: string;
  answer?: string;
}

export interface AudienceInfo {
  customerAnalysis?: string;
  faq?: FaqPair[];
}

export interface BrandVoice {
  toneOfVoice?: string;
  boundaries?: string;
  verbalSlogan?: string;
  appearanceMethod?: string;
}

export interface CustomerJourney {
  orderMethods?: string[];
  followUpTools?: string;
}

export interface CampaignInfo {
  campaignGoal?: string;
  campaignDetails?: string;
  campaignOffer?: string;
  guarantees?: string;
  campaignSeason?: string;
  competitors?: string;
}

export interface PastPerformance {
  bestCampaigns?: string;
  pastPerformance?: string;
  trackingSetup?: string;
}

export interface BudgetInfo {
  budgetRange?: number;
  previousReports?: string[];
}

export interface VisualIdentityBrandAssets {
  logoUrl?: string;
  brandColors?: string[];
  fonts?: string[];
  guidelinesUrl?: string;
}

export interface VisualIdentityInfo {
  hasVisualIdentity?: boolean;
  brandAssets?: VisualIdentityBrandAssets;
  pastDesigns?: string;
  productPhotos?: string[];
  visualDirection?: string[];
}

export interface ClientProfileV2 {
  id: string;
  clientId: string;
  communicationInfo?: CommunicationInfo | null;
  productInfo?: ProductInfo | null;
  audienceInfo?: AudienceInfo | null;
  brandVoice?: BrandVoice | null;
  customerJourney?: CustomerJourney | null;
  campaignInfo?: CampaignInfo | null;
  pastPerformance?: PastPerformance | null;
  budgetInfo?: BudgetInfo | null;
  visualIdentityInfo?: VisualIdentityInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertClientProfileV2Input {
  communicationInfo?: CommunicationInfo;
  productInfo?: ProductInfo;
  audienceInfo?: AudienceInfo;
  brandVoice?: BrandVoice;
  customerJourney?: CustomerJourney;
  campaignInfo?: CampaignInfo;
  pastPerformance?: PastPerformance;
  budgetInfo?: BudgetInfo;
  visualIdentityInfo?: VisualIdentityInfo;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientFilters {
  kind?: ClientKind;
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
  tagTypes: [
    "Client",
    "ClientProfile",
    "Project",
    "AdminClientUsers",
    "AdminClientStats",
  ],
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

    /** GET /v1/sales/clients — sales-owned paginated + filtered list */
    getSalesClients: builder.query<PaginatedClients, ClientFilters>({
      query: (filters = {}) => ({ url: "/sales/clients", params: filters }),
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
      invalidatesTags: [
        { type: "Client", id: "LIST" },
        "AdminClientUsers",
        "AdminClientStats",
      ],
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

    /** GET /v1/sales/clients/:id — sales-owned detail */
    getSalesClientById: builder.query<Client, string>({
      query: (id) => `/sales/clients/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Client", id }],
    }),

    /** GET /v1/sales/clients/:id/profile */
    getSalesClientProfile: builder.query<ClientProfile | null, string>({
      query: (id) => `/sales/clients/${id}/profile`,
      providesTags: (_result, _err, id) => [{ type: "ClientProfile", id }],
    }),

    /** GET /v1/clients/:id/profile */
    getClientProfile: builder.query<ClientProfile, string>({
      query: (id) => `/clients/${id}/profile`,
      providesTags: (_result, _err, id) => [{ type: "ClientProfile", id }],
    }),

    /** GET /v1/clients/:id/team-view — filtered client + profile for team roles */
    getClientTeamView: builder.query<
      { client: Client; profile: ClientProfile | null },
      string
    >({
      query: (id) => `/clients/${id}/team-view`,
      providesTags: (_result, _err, id) => [
        { type: "Client", id },
        { type: "ClientProfile", id },
      ],
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

    /**
     * GET /v1/clients/:id/profile/v2
     * Returns V2 profile data (unified with IntakeFormV2 structure)
     */
    getClientProfileV2: builder.query<ClientProfileV2, string>({
      query: (id) => `/clients/${id}/profile/v2`,
      providesTags: (_result, _err, id) => [{ type: "ClientProfile", id }],
    }),

    /**
     * PUT /v1/clients/:id/profile/v2
     * Upserts V2 profile data (same structure as IntakeFormV2)
     * This is the canonical endpoint for updating client profile from both
     * intake form submission and profile edit.
     */
    upsertSalesClientProfileV2: builder.mutation<
      ClientProfile,
      { id: string; data: UpsertClientProfileV2Input }
    >({
      query: ({ id, data }) => ({
        url: `/sales/clients/${id}/profile/v2`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "ClientProfile", id },
        { type: "Client", id },
      ],
    }),

    upsertClientProfileV2: builder.mutation<
      ClientProfile,
      { id: string; data: UpsertClientProfileV2Input }
    >({
      query: ({ id, data }) => ({
        url: `/clients/${id}/profile/v2`,
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
  useGetSalesClientsQuery,
  useGetSalesClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useHandoverClientMutation,
  useGetClientProfileQuery,
  useGetSalesClientProfileQuery,
  useGetClientTeamViewQuery,
  useUpsertClientProfileMutation,
  useGetClientProfileV2Query,
  useUpsertClientProfileV2Mutation,
  useUpsertSalesClientProfileV2Mutation,
} = clientsApi;
