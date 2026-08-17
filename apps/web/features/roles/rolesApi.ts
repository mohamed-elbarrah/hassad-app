import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface Role {
  id: string;
  name: string;
  permissions: Array<{
    permissionId: string;
    permission: { id: string; name: string };
  }>;
  _count?: { users: number };
}

export const rolesApi = createApi({
  reducerPath: "rolesApi",
  baseQuery,
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => "/roles",
      providesTags: ["Role"],
    }),

    createRole: builder.mutation<Role, { name: string }>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: ["Role"],
    }),

    updateRole: builder.mutation<Role, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Role"],
    }),

    assignPermissions: builder.mutation<
      Role,
      { roleId: string; permissionIds: string[] }
    >({
      query: ({ roleId, permissionIds }) => ({
        url: `/roles/${roleId}/permissions`,
        method: "POST",
        body: { permissionIds },
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignPermissionsMutation,
} = rolesApi;
