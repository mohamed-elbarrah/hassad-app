import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { CampaignStatus, CampaignPlatform, DataSource } from "@hassad/shared";

export interface CampaignClient {
  id: string;
  companyName: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  projectId?: string | null;
  managedBy: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  startDate: string;
  endDate?: string | null;
  budgetTotal: number;
  budgetSpent: number;
  createdAt: string;
  updatedAt: string;
  client?: CampaignClient;
}

export interface PaginatedCampaigns {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  clientId?: string;
  page?: number;
  limit?: number;
}

/** Matches DB `CampaignKpiSnapshot` model exactly */
export interface CampaignKpiSnapshot {
  id: string;
  campaignId: string;
  recordedBy: string;
  snapshotDate: string;
  impressions: number;
  clicks: number;
  messagesReceived: number;
  ordersCount: number;
  leadsCount: number;
  conversionRate: number;
  cac: number;
  ctr: number;
  dataSource: DataSource;
  isApprovedByManager: boolean;
  createdAt: string;
}

/** managedBy is auto-populated from the authenticated user */
export interface CreateCampaignInput {
  clientId: string;
  name: string;
  platform: CampaignPlatform;
  startDate: string;
  budgetTotal: number;
  projectId?: string;
  endDate?: string;
}

/** Matches DB fields; ctr and conversionRate are computed server-side */
export interface AddCampaignKpiInput {
  snapshotDate: string;
  impressions: number;
  clicks: number;
  messagesReceived: number;
  ordersCount: number;
  leadsCount: number;
  dataSource: DataSource;
}

export const campaignsApi = createApi({
  reducerPath: "campaignsApi",
  baseQuery,
  tagTypes: ["Campaign", "CampaignKpi"],
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedCampaigns, CampaignFilters>({
      query: (filters = {}) => ({ url: "/campaigns", params: filters }),
      providesTags: (result) =>
        result
          ? [...result.items.map(({ id }) => ({ type: "Campaign" as const, id })), { type: "Campaign", id: "LIST" }]
          : [{ type: "Campaign", id: "LIST" }],
    }),
    getCampaignById: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Campaign", id }],
    }),
    createCampaign: builder.mutation<Campaign, CreateCampaignInput>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),
    startCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({ url: `/campaigns/${id}/start`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Campaign", id }, { type: "Campaign", id: "LIST" }],
    }),
    pauseCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({ url: `/campaigns/${id}/pause`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Campaign", id }, { type: "Campaign", id: "LIST" }],
    }),
    endCampaign: builder.mutation<Campaign, string>({
      query: (id) => ({ url: `/campaigns/${id}/end`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Campaign", id }, { type: "Campaign", id: "LIST" }],
    }),
    getCampaignKpis: builder.query<CampaignKpiSnapshot[], string>({
      query: (campaignId) => `/campaigns/${campaignId}/kpis`,
      providesTags: (_r, _e, campaignId) => [{ type: "CampaignKpi", id: campaignId }],
    }),
    addCampaignKpi: builder.mutation<CampaignKpiSnapshot, { campaignId: string; body: AddCampaignKpiInput }>({
      query: ({ campaignId, body }) => ({ url: `/campaigns/${campaignId}/kpis`, method: "POST", body }),
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignKpi", id: campaignId }],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignByIdQuery,
  useCreateCampaignMutation,
  useStartCampaignMutation,
  usePauseCampaignMutation,
  useEndCampaignMutation,
  useGetCampaignKpisQuery,
  useAddCampaignKpiMutation,
} = campaignsApi;
