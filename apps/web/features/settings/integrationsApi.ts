import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface IntegrationSettings {
  whatsappPhone: string | null;
  whatsappUrl: string | null;
  r2: {
    endpoint: string | null;
    bucket: string | null;
    publicDomain: string | null;
    hasCredentials: boolean;
  };
}

export interface R2SettingsInput {
  endpoint?: string;
  bucket?: string;
  publicDomain?: string | null;
  accessKey?: string;
  secretKey?: string;
}

export interface UpdateIntegrationSettingsRequest {
  whatsappPhone?: string | null;
  r2?: R2SettingsInput;
}

export interface PublicConfig {
  whatsappUrl?: string | null;
}

export const integrationsApi = createApi({
  reducerPath: "integrationsApi",
  baseQuery,
  tagTypes: ["IntegrationSettings"],
  endpoints: (builder) => ({
    getIntegrationSettings: builder.query<IntegrationSettings, void>({
      query: () => "/admin/settings/integrations",
      providesTags: ["IntegrationSettings"],
    }),
    updateIntegrationSettings: builder.mutation<
      IntegrationSettings & { code: string },
      UpdateIntegrationSettingsRequest
    >({
      query: (body) => ({
        url: "/admin/settings/integrations",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["IntegrationSettings"],
    }),
    testR2: builder.mutation<{ code?: string }, R2SettingsInput | void>({
      query: (body) => ({
        url: "/admin/settings/integrations/test-r2",
        method: "POST",
        body: body ?? {},
      }),
    }),
    getPublicConfig: builder.query<PublicConfig, void>({
      query: () => "/public/config",
    }),
  }),
});

export const {
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useTestR2Mutation,
  useGetPublicConfigQuery,
} = integrationsApi;
