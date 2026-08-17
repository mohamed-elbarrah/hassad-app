import { createApi } from "@reduxjs/toolkit/query/react";

import type { LoginDto, User } from "@hassad/shared";
import { baseQuery } from "@/lib/baseQuery";

interface AuthResponse {
  user: User;
}

interface AuthCodeResponse {
  code: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessType: string;
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
    register: builder.mutation<AuthCodeResponse, RegisterInput>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
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
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
