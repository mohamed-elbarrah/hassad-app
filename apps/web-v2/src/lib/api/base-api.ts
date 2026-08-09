"use client";

import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { clearSession } from "@/lib/auth/auth-slice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
});

type Envelope<T> = {
  success: boolean;
  data: T;
  error: unknown;
};

const baseQueryWithEnvelope: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.data && typeof result.data === "object" && "success" in result.data) {
    const envelope = result.data as Envelope<unknown>;
    return { data: envelope.data };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: (async (args, api, extraOptions) => {
    let result = await baseQueryWithEnvelope(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refreshResult = await baseQueryWithEnvelope(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions,
      );

      if (!refreshResult.error) {
        result = await baseQueryWithEnvelope(args, api, extraOptions);
      } else {
        api.dispatch(clearSession());
        api.dispatch(baseApi.util.resetApiState());
        await rawBaseQuery({ url: "/auth/logout", method: "POST" }, api, extraOptions);
      }
    }

    return result;
  }) as BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
  tagTypes: ["Overview", "Employees", "Clients", "Crm", "Delivery", "Session"],
  endpoints: () => ({}),
});
