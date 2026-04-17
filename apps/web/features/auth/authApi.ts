import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store";
import type { LoginDto, RegisterDto, User } from "@hassad/shared";
import { logout, setCredentials } from "./authSlice";

interface AuthResponse {
  user: User;
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v1/auth`,
  credentials: "include", // Important for HttpOnly cookies
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // try to get a new token via refresh cookie
    const refreshResult = await baseQuery(
      { url: "/refresh", method: "POST" },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // Refresh succeeded, the browser now has the new 'token' cookie.
      // We don't need to manually update state here unless we want to trigger a re-render.
      // But retrying the original query will fail if we are not authenticated.
      // Let's retry the initial query now that we have the new cookie.
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginDto>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: {
        data: { user: User; accessToken: string };
      }) => ({
        user: response.data.user,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => "/me",
      transformResponse: (response: { data: User }) => response.data,
    }),
    register: builder.mutation<
      { message: string },
      {
        name: string;
        email: string;
        password: string;
        phone: string;
        businessType: string;
      }
    >({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: { message: string } }) =>
        response.data,
    }),
  }),
});

export const { useLoginMutation, useGetProfileQuery, useRegisterMutation } =
  authApi;
