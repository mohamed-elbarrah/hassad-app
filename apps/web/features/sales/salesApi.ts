import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { PipelineStage, RequestStatus } from "@hassad/shared";

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
  tagTypes: ["SalesMetrics"],
  endpoints: (builder) => ({
    getSalesMetrics: builder.query<SalesMetrics, string | void>({
      query: (period) => ({
        url: "/sales/metrics",
        params: period ? { period } : {},
      }),
      providesTags: [{ type: "SalesMetrics", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetSalesMetricsQuery } = salesApi;
