"use client";

import { baseApi } from "@/lib/api/base-api";

export type Gateway = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  configJson?: { fields?: Record<string, boolean>; isConfigured?: boolean };
};

export type BankAccount = {
  id: string;
  accountName: string;
  accountNumber?: string | null;
  iban: string;
  bankName: string;
  swiftCode?: string | null;
  instructions?: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type PaymentSettings = {
  gateways: Gateway[];
  bankTransfer: Gateway | null;
  bankAccounts: BankAccount[];
};

export type CurrencySetting = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  symbolType: "TEXT" | "SVG_URL" | "SVG_INLINE";
  svgKey?: string | null;
  svgUrl?: string | null;
  svgWidth?: number | null;
  svgHeight?: number | null;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
};

export type AiProvider = {
  id: string;
  name: string;
  displayName?: string | null;
  baseUrl?: string | null;
  apiKey: string;
  models: string[];
  priority: number;
  isActive: boolean;
  requestsPerMinute?: number | null;
  tokensPerMinute?: number | null;
  maxTokens?: number | null;
  temperature?: number | null;
};

export type GatewayInput = { name: string; isActive?: boolean; secretKey?: string; webhookSecret?: string; publishableKey?: string };
export type BankAccountInput = Omit<BankAccount, "id">;

export const adminConfigurationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPaymentSettings: builder.query<PaymentSettings, void>({ query: () => "/admin/settings/payments", providesTags: ["AdminSettings"] }),
    createAdminPaymentSettings: builder.mutation<Gateway, GatewayInput>({ query: (body) => ({ url: "/admin/settings/payments", method: "POST", body }), invalidatesTags: ["AdminSettings"] }),
    saveAdminPaymentSettings: builder.mutation<Gateway, GatewayInput>({ query: ({ name, ...body }) => ({ url: `/admin/settings/payments/${name}`, method: "PATCH", body }), invalidatesTags: ["AdminSettings"] }),
    deleteAdminPaymentSettings: builder.mutation<Gateway, string>({ query: (name) => ({ url: `/admin/settings/payments/${name}`, method: "DELETE" }), invalidatesTags: ["AdminSettings"] }),
    createAdminBankAccount: builder.mutation<BankAccount, BankAccountInput>({ query: (body) => ({ url: "/admin/settings/payments/bank-accounts", method: "POST", body }), invalidatesTags: ["AdminSettings"] }),
    updateAdminBankAccount: builder.mutation<BankAccount, { id: string; body: Partial<BankAccountInput> }>({ query: ({ id, body }) => ({ url: `/admin/settings/payments/bank-accounts/${id}`, method: "PATCH", body }), invalidatesTags: ["AdminSettings"] }),
    deleteAdminBankAccount: builder.mutation<BankAccount, string>({ query: (id) => ({ url: `/admin/settings/payments/bank-accounts/${id}`, method: "DELETE" }), invalidatesTags: ["AdminSettings"] }),
    getAdminCurrencies: builder.query<CurrencySetting[], void>({ query: () => "/admin/settings/currencies", providesTags: ["AdminSettings"] }),
    createAdminCurrency: builder.mutation<CurrencySetting, Partial<CurrencySetting>>({ query: (body) => ({ url: "/admin/settings/currencies", method: "POST", body }), invalidatesTags: ["AdminSettings"] }),
    updateAdminCurrency: builder.mutation<CurrencySetting, { id: string; body: Partial<CurrencySetting> }>({ query: ({ id, body }) => ({ url: `/admin/settings/currencies/${id}`, method: "PATCH", body }), invalidatesTags: ["AdminSettings"] }),
    deleteAdminCurrency: builder.mutation<CurrencySetting, string>({ query: (id) => ({ url: `/admin/settings/currencies/${id}`, method: "DELETE" }), invalidatesTags: ["AdminSettings"] }),
    uploadAdminCurrencySvg: builder.mutation<{ key: string; url: string }, File>({ query: (file) => { const body = new FormData(); body.append("file", file); return { url: "/admin/settings/currencies/upload-svg", method: "POST", body }; }, invalidatesTags: ["AdminSettings"] }),
    getAdminAiProviders: builder.query<AiProvider[], void>({ query: () => "/admin/settings/ai", providesTags: ["AdminSettings"] }),
    createAdminAiProvider: builder.mutation<AiProvider, Partial<AiProvider> & { apiKey: string }>({ query: (body) => ({ url: "/admin/settings/ai", method: "POST", body }), invalidatesTags: ["AdminSettings"] }),
    updateAdminAiProvider: builder.mutation<AiProvider, { id: string; body: Partial<AiProvider> }>({ query: ({ id, body }) => ({ url: `/admin/settings/ai/${id}`, method: "PATCH", body }), invalidatesTags: ["AdminSettings"] }),
    deleteAdminAiProvider: builder.mutation<void, string>({ query: (id) => ({ url: `/admin/settings/ai/${id}`, method: "DELETE" }), invalidatesTags: ["AdminSettings"] }),
    fetchAdminAiModels: builder.mutation<{ success: boolean; models: string[]; message?: string }, { name: string; apiKey: string; baseUrl?: string }>({ query: (body) => ({ url: "/admin/settings/ai/fetch-models", method: "POST", body }) }),
    testAdminAiProvider: builder.mutation<{ text: string; model: string }, string>({ query: (id) => ({ url: `/admin/settings/ai/${id}/test`, method: "POST" }) }),
  }),
});

export const {
  useGetAdminPaymentSettingsQuery,
  useCreateAdminPaymentSettingsMutation,
  useSaveAdminPaymentSettingsMutation,
  useDeleteAdminPaymentSettingsMutation,
  useCreateAdminBankAccountMutation,
  useUpdateAdminBankAccountMutation,
  useDeleteAdminBankAccountMutation,
  useGetAdminCurrenciesQuery,
  useCreateAdminCurrencyMutation,
  useUpdateAdminCurrencyMutation,
  useDeleteAdminCurrencyMutation,
  useUploadAdminCurrencySvgMutation,
  useGetAdminAiProvidersQuery,
  useCreateAdminAiProviderMutation,
  useUpdateAdminAiProviderMutation,
  useDeleteAdminAiProviderMutation,
  useFetchAdminAiModelsMutation,
  useTestAdminAiProviderMutation,
} = adminConfigurationApi;
