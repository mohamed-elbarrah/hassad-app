import { createApi } from "@reduxjs/toolkit/query/react";

import type { LoginDto, User } from "@hassad/shared";
import { baseQuery } from "@/lib/baseQuery";

interface AuthResponse {
  user: User;
}

interface AuthCodeResponse {
  code: string;
}

interface AcceptInvitationResponse {
  code: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginDto & { rememberMe?: boolean }>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => "/auth/me",
    }),
    forgotPassword: builder.mutation<AuthCodeResponse, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      AuthCodeResponse,
      { token: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    acceptInvitation: builder.mutation<
      AcceptInvitationResponse,
      { token: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/accept-invitation",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<AuthCodeResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useAcceptInvitationMutation,
} = authApi;
