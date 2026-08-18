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
  if (result.error) return result;

  if (result.data === undefined || result.data === null) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        data: {
          success: false,
          error: {
            code: "INVALID_API_RESPONSE",
            details: {},
          },
        },
        error: "Expected a standard API response envelope",
      },
    };
  }

  if (typeof result.data !== "object") {
    return {
      error: {
        status: "CUSTOM_ERROR",
        data: {
          success: false,
          error: {
            code: "INVALID_API_RESPONSE",
            details: {},
          },
        },
        error: "Expected a standard API response envelope",
      },
    };
  }

  const envelope = result.data as { success?: unknown; data?: unknown };
  if (envelope.success !== true || !("data" in envelope)) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        data: {
          success: false,
          error: {
            code: "INVALID_API_RESPONSE",
            details: {},
          },
        },
        error: "Invalid standard API response envelope",
      },
    };
  }

  return { data: envelope.data, meta: result.meta };
}

function normalizeError(result: RawResult): RawResult {
  if (!result.error) return result;

  const data = result.error.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "object"
  ) {
    return result;
  }

  const code =
    result.error.status === 401
      ? "AUTHENTICATION_REQUIRED"
      : result.error.status === 403
        ? "PERMISSION_DENIED"
        : "REQUEST_FAILED";

  return {
    ...result,
    error: {
      ...result.error,
      data: {
        success: false,
        error: { code, details: {} },
      },
    },
  };
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
  let result = normalizeError(
    unwrap((await rawBaseQuery(args, api, extraOptions)) as RawResult),
  );

  for (let attempt = 0; attempt < 2 && isNetworkError(result); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = normalizeError(
      unwrap((await rawBaseQuery(args, api, extraOptions)) as RawResult),
    );
  }

  return result;
}

let refreshPromise: Promise<RawResult> | null = null;

function refreshAccessToken(api: any, extraOptions: any): Promise<RawResult> {
  if (!refreshPromise) {
    refreshPromise = Promise.resolve(
      rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions),
    )
      .then((result) => unwrap(result as RawResult))
      .finally(() => {
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
  const retriedResult = normalizeError(
    unwrap((await rawBaseQuery(args, api, extraOptions)) as RawResult),
  );

  if (retriedResult.error?.status === 401) {
    await clearSession(api, extraOptions);
  }

  return retriedResult;
};
