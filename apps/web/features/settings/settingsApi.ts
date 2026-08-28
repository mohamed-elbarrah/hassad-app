// apps/web/features/settings/settingsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export type CurrencySymbolType = "TEXT" | "SVG_URL" | "SVG_UPLOAD" | "SVG_INLINE";

type CurrencySettingBase = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  svgWidth: number | null;
  svgHeight: number | null;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * The API deliberately separates the durable source (`svgKey`) from the
 * short-lived presentation URL (`svgUrl`). The discriminated union keeps
 * inline markup, external URLs, and uploaded assets from being interchanged.
 * The default read route redacts an upload's key, hence its nullable key.
 */
export type CurrencySetting = CurrencySettingBase &
  (
    | { symbolType: "TEXT"; svgKey: null; svgUrl: null }
    | { symbolType: "SVG_INLINE"; svgKey: string; svgUrl: null }
    | { symbolType: "SVG_URL"; svgKey: string; svgUrl: string | null }
    | { symbolType: "SVG_UPLOAD"; svgKey: string | null; svgUrl: string | null }
  );

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
      providesTags: [{ type: "CurrencySetting", id: "LIST" }],
    }),

    getDefaultCurrency: builder.query<CurrencySetting | null, void>({
      query: () => "/currency-settings/default",
      providesTags: [{ type: "CurrencySetting", id: "DEFAULT" }],
    }),

    getCurrencySetting: builder.query<CurrencySetting, string>({
      query: (id) => `/admin/settings/currencies/${id}`,
      providesTags: (_r, _e, id) => [{ type: "CurrencySetting", id }],
    }),

    createCurrencySetting: builder.mutation<CurrencySetting, CreateCurrencySettingRequest>({
      query: (body) => ({ url: "/admin/settings/currencies", method: "POST", body }),
      invalidatesTags: [
        { type: "CurrencySetting", id: "LIST" },
        { type: "CurrencySetting", id: "DEFAULT" },
      ],
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
      invalidatesTags: (_r, _e, { id }) => [
        { type: "CurrencySetting", id },
        { type: "CurrencySetting", id: "LIST" },
        { type: "CurrencySetting", id: "DEFAULT" },
      ],
    }),

    deleteCurrencySetting: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admin/settings/currencies/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CurrencySetting", id },
        { type: "CurrencySetting", id: "LIST" },
        { type: "CurrencySetting", id: "DEFAULT" },
      ],
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
      // Uploading stages an asset; it does not change a currency setting.
      // Avoid refreshing unrelated queries and rotating signed URLs here.
      invalidatesTags: [],
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
