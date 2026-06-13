// apps/web/features/departments/departmentsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
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

    createDepartment: builder.mutation<Department, CreateDepartmentInput>({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} = departmentsApi;
