// Shared RTK Query transport with envelope unwrapping and cookie-based auth refresh.
import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { logout } from "@/features/auth/authSlice";
import { getApiBaseUrl } from "@/lib/utils";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
});

type RawResult = QueryReturnValue<
  unknown,
  FetchBaseQueryError,
  FetchBaseQueryMeta
>;

function unwrap(result: RawResult): RawResult {
  if (
    !result.error &&
    result.data !== undefined &&
    result.data !== null &&
    typeof result.data === "object" &&
    "data" in (result.data as object)
  ) {
    return { data: (result.data as { data: unknown }).data, meta: result.meta };
  }
  return result;
}

function isNetworkError(result: RawResult): boolean {
  return (
    result.error?.status === "FETCH_ERROR" ||
    result.error?.status === "TIMEOUT_ERROR"
  );
}

async function requestWithNetworkRetry(
  args: string | FetchArgs,
  api: any,
  extraOptions: any,
): Promise<RawResult> {
  let result = unwrap(
    (await rawBaseQuery(args, api, extraOptions)) as RawResult,
  );

  for (let attempt = 0; attempt < 2 && isNetworkError(result); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = unwrap((await rawBaseQuery(args, api, extraOptions)) as RawResult);
  }

  return result;
}

let refreshPromise: Promise<RawResult> | null = null;

function refreshAccessToken(api: any, extraOptions: any): Promise<RawResult> {
  if (!refreshPromise) {
    refreshPromise = (
      rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions,
      ) as Promise<RawResult>
    ).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function clearSession(api: any, extraOptions: any): Promise<void> {
  api.dispatch(logout());
  await rawBaseQuery(
    { url: "/auth/logout", method: "POST" },
    api,
    extraOptions,
  );
}

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await requestWithNetworkRetry(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const refreshResult = await refreshAccessToken(api, extraOptions);
  if (refreshResult.error) {
    await clearSession(api, extraOptions);
    return result;
  }

  // Exactly one retry after a successful refresh. A second 401 ends the session.
  const retriedResult = unwrap(
    (await rawBaseQuery(args, api, extraOptions)) as RawResult,
  );

  if (retriedResult.error?.status === 401) {
    await clearSession(api, extraOptions);
  }

  return retriedResult;
};
