// apps/web/features/users/usersApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { UserRole, TaskDepartment } from "@hassad/shared";

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PaginatedUsers {
  items: UserSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserSearchFilters {
  search?: string;
  role?: UserRole;
  department?: TaskDepartment;
  page?: number;
  limit?: number;
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    searchUsers: builder.query<PaginatedUsers, UserSearchFilters>({
      query: (filters = {}) => ({
        url: "/users",
        params: filters,
      }),
      providesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const { useSearchUsersQuery } = usersApi;
