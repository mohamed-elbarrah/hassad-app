// apps/web/features/settings/settingsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface CurrencySetting {
  id: string;
  code: string;
  name: string;
  symbol: string;
  symbolType: "TEXT" | "SVG_URL" | "SVG_INLINE";
  svgKey?: string | null;
  svgWidth?: number | null;
  svgHeight?: number | null;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencySvgResponse {
  key: string;
  url: string;
  isCleaned: boolean;
}

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["CurrencySetting"],
  endpoints: (builder) => ({
    getCurrencySettings: builder.query<CurrencySetting[], void>({
      query: () => "/currency-settings",
      providesTags: ["CurrencySetting"],
    }),

    getDefaultCurrency: builder.query<CurrencySetting | null, void>({
      query: () => "/currency-settings/default",
      providesTags: ["CurrencySetting"],
    }),

    getCurrencySetting: builder.query<CurrencySetting, string>({
      query: (id) => `/currency-settings/${id}`,
      providesTags: (_r, _e, id) => [{ type: "CurrencySetting", id }],
    }),

    createCurrencySetting: builder.mutation<CurrencySetting, Partial<CurrencySetting>>({
      query: (body) => ({ url: "/currency-settings", method: "POST", body }),
      invalidatesTags: ["CurrencySetting"],
    }),

    updateCurrencySetting: builder.mutation<
      CurrencySetting,
      { id: string; body: Partial<CurrencySetting> }
    >({
      query: ({ id, body }) => ({
        url: `/currency-settings/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CurrencySetting"],
    }),

    deleteCurrencySetting: builder.mutation<void, string>({
      query: (id) => ({ url: `/currency-settings/${id}`, method: "DELETE" }),
      invalidatesTags: ["CurrencySetting"],
    }),

    uploadSvg: builder.mutation<
      CurrencySvgResponse,
      { file: File; key?: string }
    >({
      query: ({ file, key }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/currency-settings/upload-svg${key ? `?key=${encodeURIComponent(key)}` : ""}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["CurrencySetting"],
    }),
  }),
});

export const {
  useGetCurrencySettingsQuery,
  useGetDefaultCurrencyQuery,
  useGetCurrencySettingQuery,
  useCreateCurrencySettingMutation,
  useUpdateCurrencySettingMutation,
  useDeleteCurrencySettingMutation,
  useUploadSvgMutation,
} = settingsApi;
