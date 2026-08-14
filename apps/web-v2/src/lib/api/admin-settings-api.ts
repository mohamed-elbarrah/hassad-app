"use client";

import { baseApi } from "@/lib/api/base-api";

export const adminSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSettings: builder.query<Record<string, unknown>, void>({ query: () => "/admin/settings", providesTags: ["AdminSettings"] }),
    updateAdminSettings: builder.mutation<Record<string, unknown>, Record<string, unknown>>({ query: (body) => ({ url: "/admin/settings", method: "POST", body }), invalidatesTags: ["AdminSettings"] }),
    seedAdminSettings: builder.mutation<Record<string, unknown>, void>({ query: () => ({ url: "/admin/settings/seed-defaults", method: "POST" }), invalidatesTags: ["AdminSettings"] }),
    getAdminFeatureFlags: builder.query<unknown, void>({ query: () => "/admin/feature-flags", providesTags: ["AdminSettings"] }),
    getAdminEnvironment: builder.query<unknown, void>({ query: () => "/admin/environment", providesTags: ["AdminSettings"] }),
    getAdminIntegrations: builder.query<unknown, void>({ query: () => "/admin/integrations/sync-status", providesTags: ["AdminSettings"] }),
  }),
});

export const {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useSeedAdminSettingsMutation,
  useGetAdminFeatureFlagsQuery,
  useGetAdminEnvironmentQuery,
  useGetAdminIntegrationsQuery,
} = adminSettingsApi;
