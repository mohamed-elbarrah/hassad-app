// apps/web/features/settings/settingsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export type CurrencySymbolType = "TEXT" | "SVG_URL" | "SVG_UPLOAD" | "SVG_INLINE";

/** The public currency representation returned by the API. */
export interface CurrencySetting {
  id: string;
  code: string;
  name: string;
  symbol: string;
  symbolType: CurrencySymbolType;
  /** Durable source/reference; never a presigned URL. */
  svgKey: string | null;
  /** Fresh short-lived presentation URL for uploaded SVGs. */
  svgUrl: string | null;
  svgWidth: number | null;
  svgHeight: number | null;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencySettingRequest {
  code: string;
  name: string;
  symbol: string;
  symbolType?: CurrencySymbolType;
  svgKey?: string;
  svgWidth?: number;
  svgHeight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  exchangeRate?: number;
}

export interface UpdateCurrencySettingRequest {
  code?: string;
  name?: string;
  symbol?: string;
  symbolType?: CurrencySymbolType;
  svgKey?: string;
  svgWidth?: number;
  svgHeight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  exchangeRate?: number;
}

export interface CurrencySvgResponse {
  url: string;
  reference: string;
  isCleaned: boolean;
}

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["CurrencySetting"],
  endpoints: (builder) => ({
    getCurrencySettings: builder.query<CurrencySetting[], void>({
      query: () => "/admin/settings/currencies",
      providesTags: ["CurrencySetting"],
    }),

    getDefaultCurrency: builder.query<CurrencySetting | null, void>({
      query: () => "/currency-settings/default",
      providesTags: ["CurrencySetting"],
    }),

    getCurrencySetting: builder.query<CurrencySetting, string>({
      query: (id) => `/admin/settings/currencies/${id}`,
      providesTags: (_r, _e, id) => [{ type: "CurrencySetting", id }],
    }),

    createCurrencySetting: builder.mutation<CurrencySetting, CreateCurrencySettingRequest>({
      query: (body) => ({ url: "/admin/settings/currencies", method: "POST", body }),
      invalidatesTags: ["CurrencySetting"],
    }),

    updateCurrencySetting: builder.mutation<
      CurrencySetting,
      { id: string; body: UpdateCurrencySettingRequest }
    >({
      query: ({ id, body }) => ({
        url: `/admin/settings/currencies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CurrencySetting"],
    }),

    deleteCurrencySetting: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admin/settings/currencies/${id}`, method: "DELETE" }),
      invalidatesTags: ["CurrencySetting"],
    }),

    uploadSvg: builder.mutation<
      CurrencySvgResponse,
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/admin/settings/currencies/upload-svg",
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
