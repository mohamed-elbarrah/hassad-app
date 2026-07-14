import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  _count?: { members: number; activeRequests: number };
  createdAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  managerId?: string;
}

export interface DepartmentMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export const departmentsApi = createApi({
  reducerPath: "departmentsApi",
  baseQuery,
  tagTypes: ["Department"],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => "/departments",
      providesTags: [{ type: "Department", id: "LIST" }],
    }),

    getDepartment: builder.query<Department, string>({
      query: (id) => `/departments/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Department", id }],
    }),

    createDepartment: builder.mutation<Department, CreateDepartmentInput>({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    updateDepartment: builder.mutation<
      Department,
      { id: string; body: Partial<CreateDepartmentInput> }
    >({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Department", id },
        { type: "Department", id: "LIST" },
      ],
    }),

    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
