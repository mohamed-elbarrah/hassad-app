"use client";

import type {
  AdminClientsWorkspaceQuery,
  AdminCrmWorkspaceQuery,
  AdminDeliveryWorkspaceQuery,
  AdminEmployeesWorkspaceQuery,
  AdminOverviewQuery,
  AdminOverviewResponse,
  ClientsWorkspaceResponse,
  CrmWorkspaceResponse,
  DeliveryWorkspaceResponse,
  EmployeesWorkspaceResponse,
} from "@hassad/shared";
import type { EmployeeFormValues } from "@/features/employees/lib/employee-admin";
import { baseApi } from "@/lib/api/base-api";

export const adminWorkspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<AdminOverviewResponse, AdminOverviewQuery>({
      query: (params) => ({ url: "/admin/overview", params }),
      providesTags: ["Overview"],
    }),
    getEmployeesWorkspace: builder.query<
      EmployeesWorkspaceResponse,
      AdminEmployeesWorkspaceQuery
    >({
      query: (params) => ({ url: "/admin/users/workspace", params }),
      providesTags: ["Employees"],
    }),
    createEmployee: builder.mutation<unknown, EmployeeFormValues>({
      query: (body) => ({ url: "/admin/users", method: "POST", body }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: builder.mutation<
      unknown,
      { id: string; values: EmployeeFormValues }
    >({
      query: ({ id, values }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body: values,
      }),
      invalidatesTags: ["Employees"],
    }),
    suspendEmployee: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/suspend`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Employees"],
    }),
    reactivateEmployee: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/reactivate`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Employees"],
    }),
    getClientsWorkspace: builder.query<
      ClientsWorkspaceResponse,
      AdminClientsWorkspaceQuery
    >({
      query: (params) => ({ url: "/admin/clients/workspace", params }),
      providesTags: ["Clients"],
    }),
    getCrmWorkspace: builder.query<CrmWorkspaceResponse, AdminCrmWorkspaceQuery>({
      query: (params) => ({ url: "/admin/crm/workspace", params }),
      providesTags: ["Crm"],
    }),
    getDeliveryWorkspace: builder.query<
      DeliveryWorkspaceResponse,
      AdminDeliveryWorkspaceQuery
    >({
      query: (params) => ({ url: "/admin/delivery/workspace", params }),
      providesTags: ["Delivery"],
    }),
  }),
});

export const {
  useCreateEmployeeMutation,
  useGetAdminOverviewQuery,
  useGetClientsWorkspaceQuery,
  useGetCrmWorkspaceQuery,
  useGetDeliveryWorkspaceQuery,
  useGetEmployeesWorkspaceQuery,
  useReactivateEmployeeMutation,
  useSuspendEmployeeMutation,
  useUpdateEmployeeMutation,
} = adminWorkspacesApi;
