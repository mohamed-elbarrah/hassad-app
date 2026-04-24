// apps/web/lib/baseQuery.ts
// Shared RTK Query base query with envelope unwrapping and JWT auto-refresh.
// Extracted here so multiple API slices can reuse it without duplication.
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

const _rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
});

type RawResult = QueryReturnValue<
  unknown,
  FetchBaseQueryError,
  FetchBaseQueryMeta
>;

/** Strip the { success, data, timestamp } envelope from a successful response. */
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

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = unwrap(
    (await _rawBaseQuery(args, api, extraOptions)) as RawResult,
  );

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    const refreshResult = (await _rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    )) as RawResult;

    if (!refreshResult.error) {
      result = unwrap(
        (await _rawBaseQuery(args, api, extraOptions)) as RawResult,
      );
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
