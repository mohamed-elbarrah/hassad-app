"use client";

import { baseApi } from "@/lib/api/base-api";

export type AdminFinanceListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  clientId?: string;
  contractId?: string;
};

export type AdminFinanceListResponse<T = unknown> = {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type AdminPaymentIssuesResponse = {
  page: number;
  limit: number;
  invoices: unknown[];
  payments: unknown[];
  webhooks: unknown[];
  totals: {
    lateInvoices: number;
    failedPayments: number;
    failedWebhooks: number;
    total: number;
  };
};

export const adminFinanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminFinanceOverview: builder.query<unknown, void>({
      query: () => "/admin/finance/overview",
      providesTags: ["AdminFinance"],
    }),
    getAdminInvoices: builder.query<AdminFinanceListResponse, AdminFinanceListQuery | void>({
      query: (params) => ({ url: "/admin/finance/invoices", params: params ?? undefined }),
      providesTags: ["AdminInvoices"],
    }),
    getAdminPayments: builder.query<AdminFinanceListResponse, AdminFinanceListQuery | void>({
      query: (params) => ({ url: "/admin/finance/payments", params: params ?? undefined }),
      providesTags: ["AdminPayments"],
    }),
    getAdminPayroll: builder.query<AdminFinanceListResponse, void>({
      query: () => "/admin/finance/payroll",
      transformResponse: (response: { items: unknown[]; total: number }) => ({ ...response, page: 1, limit: response.total, totalPages: 1 }),
      providesTags: ["AdminPayroll"],
    }),
    getAdminPaymentIssues: builder.query<AdminPaymentIssuesResponse, AdminFinanceListQuery | void>({
      query: (params) => ({ url: "/admin/finance/payment-issues", params: params ?? undefined }),
      providesTags: ["AdminPaymentIssues"],
    }),
    forceAdminInvoiceStatus: builder.mutation<unknown, { id: string; status: string; reason: string }>({
      query: ({ id, status, reason }) => ({ url: `/admin/finance/invoices/${id}/force-status`, method: "POST", body: { status, reason } }),
      invalidatesTags: ["AdminFinance", "AdminInvoices", "AdminPaymentIssues"],
    }),
    writeOffAdminInvoice: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/admin/finance/invoices/${id}/write-off`, method: "POST", body: { reason } }),
      invalidatesTags: ["AdminFinance", "AdminInvoices", "AdminPaymentIssues"],
    }),
    refundAdminInvoice: builder.mutation<unknown, { id: string; amount: number; reason: string }>({
      query: ({ id, amount, reason }) => ({ url: `/admin/finance/invoices/${id}/refund`, method: "POST", body: { amount, reason } }),
      invalidatesTags: ["AdminFinance", "AdminInvoices", "AdminPayments", "AdminPaymentIssues"],
    }),
  }),
});

export const {
  useGetAdminFinanceOverviewQuery,
  useGetAdminInvoicesQuery,
  useGetAdminPaymentsQuery,
  useGetAdminPayrollQuery,
  useGetAdminPaymentIssuesQuery,
  useForceAdminInvoiceStatusMutation,
  useWriteOffAdminInvoiceMutation,
  useRefundAdminInvoiceMutation,
} = adminFinanceApi;
