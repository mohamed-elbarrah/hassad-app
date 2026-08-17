"use client";

import { baseApi } from "@/lib/api/base-api";

export type ExecutionClientView = {
  client: {
    id: string;
    companyName: string | null;
    businessName?: string | null;
    businessType?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status?: string | null;
  };
  profile: Record<string, unknown> | null;
};

export const executionClientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeamClientView: builder.query<ExecutionClientView, string>({ query: (id) => ({ url: `/team/clients/${id}` }), providesTags: ["ExecutionClients"] }),
    getMarketingClientView: builder.query<ExecutionClientView, string>({ query: (id) => ({ url: `/marketing/clients/${id}` }), providesTags: ["ExecutionClients"] }),
  }),
});

export const { useGetTeamClientViewQuery, useGetMarketingClientViewQuery } = executionClientsApi;
