import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { PipelineStage } from "@hassad/shared";

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
}

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery,
  tagTypes: ["SalesMetrics"],
  endpoints: (builder) => ({
    getSalesMetrics: builder.query<SalesMetrics, void>({
      query: () => ({ url: "/sales/metrics" }),
      providesTags: [{ type: "SalesMetrics", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetSalesMetricsQuery } = salesApi;
