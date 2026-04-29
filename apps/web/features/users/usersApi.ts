// apps/web/features/users/usersApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  UserRole,
  TaskDepartment,
  CreateUserInput,
  UpdateUserInput,
} from "@hassad/shared";

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  department?: TaskDepartment | null;
  createdAt: string;
  updatedAt?: string;
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

export interface AssigneeSearchFilters {
  dept?: TaskDepartment;
  search?: string;
  limit?: number;
}

// UserDetail is now the same shape as UserSearchResult (backend always returns full shape)
export type UserDetail = UserSearchResult;

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

    searchTaskAssignees: builder.query<PaginatedUsers, AssigneeSearchFilters>({
      query: (filters = {}) => ({
        url: "/tasks/assignees",
        params: filters,
      }),
    }),

    createUser: builder.mutation<UserDetail, CreateUserInput>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    getUserById: builder.query<UserDetail, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    updateUser: builder.mutation<
      UserDetail,
      { id: string; body: UpdateUserInput }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    deactivateUser: builder.mutation<UserDetail, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    reactivateUser: builder.mutation<UserDetail, string>({
      query: (id) => ({ url: `/users/${id}/reactivate`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useSearchUsersQuery,
  useSearchTaskAssigneesQuery,
  useCreateUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
} = usersApi;
