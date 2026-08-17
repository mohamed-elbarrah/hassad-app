"use client";

import type { LoginDto } from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";
import type { AuthSession } from "@/lib/auth/auth-types";

type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneWhatsapp: string | null;
    avatarUrl: string | null;
    department: string | null;
    intakeCompleted: boolean;
    clientId?: string;
  };
  accessToken: string;
};

type LogoutResponse = {
  message: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginDto>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    getSession: builder.query<AuthSession, void>({
      query: () => ({
        url: "/auth/me",
      }),
      providesTags: ["Session"],
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Session"],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLazyGetSessionQuery,
  useLoginMutation,
  useLogoutMutation,
} = authApi;
