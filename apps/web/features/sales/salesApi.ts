import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { PipelineStage, RequestStatus } from "@hassad/shared";
import {
  requestsApi,
  type CreateRequestContactLogPayload,
  type CreateRequestForClientPayload,
  type CreateRequestPayload,
  type CreateSalesNewClientRequestPayload,
  type RequestContactLogItem,
  type RequestDetail,
  type RequestItem,
} from "@/features/requests/requestsApi";

export type SalesPipelineGroup =
  | "INTAKE"
  | "PROPOSAL"
  | "CONTRACT"
  | "WON"
  | "CANCELLED";

export interface SalesPipelineFilters {
  search?: string;
  statusGroup?: SalesPipelineGroup;
  page?: number;
  limit?: number;
  view?: "board" | "table";
}

export interface SalesPipelineStage {
  code: RequestStatus;
  order: number;
  groupCode: SalesPipelineGroup;
  isTerminal: boolean;
}

export type SalesPipelineItem = RequestItem & {
  allowedNextStatuses: RequestStatus[];
  capabilities: {
    canUpdateStatus: boolean;
    canLogContact: boolean;
  };
};

export interface SalesPipelineResponse {
  items: SalesPipelineItem[];
  stages: SalesPipelineStage[];
  summary: {
    openDeals: number;
    proposalFlow: number;
    contractFlow: number;
    wonThisMonth: number;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SalesPipelineStatusUpdateResponse {
  request: Pick<RequestItem, "id" | "status"> & {
    crmStage?: string;
  };
  allowedNextStatuses: RequestStatus[];
}

export interface SalesMetrics {
  totals: {
    totalLeads: number;
    activeClients: number;
    stoppedClients: number;
  };
  meetingsScheduled: number;
  proposalsSent: number;
  signedContracts: number;
  closeRate: number;
  stageBreakdown: Partial<Record<PipelineStage, number>>;
  pipelineValue: number;
  activeDeals: number;
  staleDeals: number;
  signedThisMonth: number;
  avgDealSize: number;
  dealsByStage: Partial<Record<RequestStatus, number>>;
  valueByStage: Record<string, number>;
}

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery,
  tagTypes: ["SalesMetrics", "SalesPipeline"],
  endpoints: (builder) => ({
    getSalesMetrics: builder.query<SalesMetrics, string | void>({
      query: (period) => ({
        url: "/sales/metrics",
        params: period ? { period } : {},
      }),
      providesTags: [{ type: "SalesMetrics", id: "SUMMARY" }],
    }),

    createSalesRequest: builder.mutation<RequestItem, CreateRequestPayload>({
      query: (body) => ({
        url: "/sales/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "SalesPipeline", id: "LIST" },
        { type: "SalesMetrics", id: "SUMMARY" },
      ],
    }),

    createSalesRequestForNewClient: builder.mutation<
      RequestItem,
      CreateSalesNewClientRequestPayload
    >({
      query: (body) => ({
        url: "/sales/requests/for-new-client",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "SalesPipeline", id: "LIST" },
        { type: "SalesMetrics", id: "SUMMARY" },
      ],
    }),

    createSalesRequestForClient: builder.mutation<
      RequestItem,
      CreateRequestForClientPayload
    >({
      query: (body) => ({
        url: "/sales/requests/for-client",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "SalesPipeline", id: "LIST" },
        { type: "SalesMetrics", id: "SUMMARY" },
      ],
    }),

    getSalesRequestById: builder.query<RequestDetail, string>({
      query: (id) => ({ url: `/sales/requests/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "SalesPipeline", id }],
    }),

    getSalesPipeline: builder.query<
      SalesPipelineResponse,
      SalesPipelineFilters | void
    >({
      query: (filters) => ({
        url: "/sales/pipeline",
        params: (filters ?? {}) as SalesPipelineFilters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "SalesPipeline" as const,
                id,
              })),
              { type: "SalesPipeline", id: "LIST" },
            ]
          : [{ type: "SalesPipeline", id: "LIST" }],
    }),

    addSalesPipelineContactLog: builder.mutation<
      RequestContactLogItem,
      { id: string; body: CreateRequestContactLogPayload }
    >({
      query: ({ id, body }) => ({
        url: `/sales/pipeline/${id}/contact-log`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SalesPipeline", id },
        { type: "SalesPipeline", id: "LIST" },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            requestsApi.util.invalidateTags([
              { type: "Request", id },
              { type: "Request", id: "LIST" },
            ]),
          );
        } catch {
          // The caller handles the mutation error and presents it to the user.
        }
      },
    }),

    updateSalesPipelineStatus: builder.mutation<
      SalesPipelineStatusUpdateResponse,
      { id: string; toStatus: RequestStatus; note?: string }
    >({
      query: ({ id, toStatus, note }) => ({
        url: `/sales/pipeline/${id}/status`,
        method: "POST",
        body: { toStatus, note },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SalesPipeline", id },
        { type: "SalesPipeline", id: "LIST" },
        { type: "SalesMetrics", id: "SUMMARY" },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            requestsApi.util.invalidateTags([
              { type: "Request", id },
              { type: "Request", id: "LIST" },
            ]),
          );
        } catch {
          // The page handles the mutation error; no cross-slice invalidation is needed.
        }
      },
    }),
  }),
});

export const {
  useCreateSalesRequestForClientMutation,
  useCreateSalesRequestForNewClientMutation,
  useCreateSalesRequestMutation,
  useGetSalesMetricsQuery,
  useGetSalesRequestByIdQuery,
  useGetSalesPipelineQuery,
  useAddSalesPipelineContactLogMutation,
  useUpdateSalesPipelineStatusMutation,
} = salesApi;
