"use client";

import type { AdminEmployeesWorkspaceQuery, EmployeesWorkspaceResponse } from "@hassad/shared";
import type { EmployeeFormValues } from "@/features/employees/lib/employee-admin";
import { baseApi } from "@/lib/api/base-api";

export const adminEmployeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeesWorkspace: builder.query<EmployeesWorkspaceResponse, AdminEmployeesWorkspaceQuery>({
      query: (params) => ({ url: "/admin/users/workspace", params }),
      providesTags: ["Employees"],
    }),
    createEmployee: builder.mutation<unknown, EmployeeFormValues>({
      query: (body) => ({ url: "/admin/users", method: "POST", body }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation<unknown, { id: string; values: EmployeeFormValues }>({
      query: ({ id, values }) => ({ url: `/admin/users/${id}`, method: "PATCH", body: values }),
      invalidatesTags: ["Employees"],
    }),
    suspendEmployee: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/suspend`, method: "POST", body: { reason } }),
      invalidatesTags: ["Employees"],
    }),
    reactivateEmployee: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/reactivate`, method: "POST", body: { reason } }),
      invalidatesTags: ["Employees"],
    }),
  }),
});

export const { useGetEmployeesWorkspaceQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useSuspendEmployeeMutation, useReactivateEmployeeMutation } = adminEmployeesApi;
