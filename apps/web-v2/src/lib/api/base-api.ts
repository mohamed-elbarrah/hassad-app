"use client";

import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { sessionExpired } from "@/lib/auth/auth-slice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

let refreshPromise: Promise<boolean> | null = null;

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
    if (!envelope.success) {
      return { error: { status: 400, data: envelope.error } };
    }
    return { data: envelope.data };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  baseQuery: (async (args, api, extraOptions) => {
    let result = await baseQueryWithEnvelope(args, api, extraOptions);

    if (result.error?.status === 401) {
      refreshPromise ??= (async () => {
        const refreshResult = await baseQueryWithEnvelope(
          { url: "/auth/refresh", method: "POST" },
          api,
          extraOptions,
        );
        return !refreshResult.error;
      })().finally(() => {
        refreshPromise = null;
      });

      const refreshed = await refreshPromise;
      if (refreshed) {
        result = await baseQueryWithEnvelope(args, api, extraOptions);
        if (result.error?.status !== 401) return result;
      }

      api.dispatch(sessionExpired());
      api.dispatch(baseApi.util.resetApiState());
      await rawBaseQuery({ url: "/auth/logout", method: "POST" }, api, extraOptions);
    }

    return result;
  }) as BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
  tagTypes: [
    "Overview",
    "Employees",
    "Clients",
    "Crm",
    "CrmOverview",
    "CrmRequests",
    "PmProjects",
    "PmTasks",
    "PmDisputes",
    "PmDisputeThreads",
    "Delivery",
    "Session",
    "Chat",
    "AdminChat",
    "CrmChat",
    "PmChat",
    "TeamChat",
    "MarketingChat",
    "TeamOverview",
    "TeamTasks",
    "TaskDetail",
    "TaskComments",
    "TaskFiles",
    "MarketingOverview",
    "MarketingTasks",
    "MarketingTaskDetail",
    "MarketingStrategies",
    "MarketingCampaigns",
    "ExecutionClients",
  ],
  endpoints: () => ({}),
});
