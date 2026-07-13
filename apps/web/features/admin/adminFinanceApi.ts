import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminFinanceOverview {
  summary: {
    totalRevenue: number;
    totalInvoiced: number;
    totalPending: number;
    totalOverdue: number;
  } | null;
  paidVsUnpaid: {
    paid: { count: number; amount: number };
    unpaid: { count: number; amount: number };
  };
  topOverdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  paymentMethodSplit: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export interface AdminFinanceInvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName?: string;
  amount: number;
  remainingAmount: number;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminFinancePaymentItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  invoiceNumber: string | null;
  invoiceId: string | null;
}

export const adminFinanceApi = createApi({
  reducerPath: "adminFinanceApi",
  baseQuery,
  tagTypes: ["AdminFinance"],
  endpoints: (builder) => ({
    getAdminFinanceOverview: builder.query<AdminFinanceOverview, void>({
      query: () => "/admin/finance/overview",
      providesTags: ["AdminFinance"],
    }),
  }),
});

export const { useGetAdminFinanceOverviewQuery } = adminFinanceApi;
