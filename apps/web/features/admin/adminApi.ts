import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminStats {
  activeClients: number;
  activeProjects: number;
  overdueTasks: number;
  monthlyRevenue: number;
  unpaidInvoicesCount: number;
  satisfactionRate: number;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery,
  tagTypes: ["AdminStats"],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
      providesTags: [{ type: "AdminStats", id: "STATS" }],
    }),
  }),
});

export const { useGetAdminStatsQuery } = adminApi;
