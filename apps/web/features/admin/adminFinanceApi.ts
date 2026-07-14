import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface AdminFinanceSummary {
  revenue: number;
  revenueChange: number;
  pending: number;
  pendingLateCount: number;
  collectionRate: number;
  failedPaymentsValue: number;
  failedPaymentsCount: number;
  invoicesTotal: number;
  invoicesCount: number;
  invoicesChange: number;
  salariesTotal: number;
  salariesChange: number;
  activeClients: number;
  netProfit: number;
  netProfitChange: number;
  averageInvoice: number;
  period: { from: string; to: string };
}

export interface AdminFinanceAgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface AdminFinanceCashflowItem {
  label: string;
  income: number;
  expenses: number;
}

export interface AdminFinanceTopClient {
  clientId: string;
  companyName: string;
  revenue: number;
  paymentCount: number;
  invoiceCount: number;
  collectionRate: number;
}

export interface AdminFinanceRevenueTrendItem {
  label: string;
  income: number;
  invoiced: number;
}

export interface AdminFinanceAlert {
  id: string;
  type: "OVERDUE";
  client: string;
  amount: number;
  date: string;
  status: "UNPAID";
  severity: "HIGH";
}

export interface AdminFinanceOverview {
  summary: AdminFinanceSummary;
  metrics: AdminFinanceSummary;
  aging: AdminFinanceAgingBucket[];
  cashflow: AdminFinanceCashflowItem[];
  topClients: AdminFinanceTopClient[];
  revenueTrend: AdminFinanceRevenueTrendItem[];
  alerts: AdminFinanceAlert[];
  refundRate: number;
  paymentMethodSplit: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topOverdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  paidVsUnpaid: {
    paid: { count: number; amount: number };
    unpaid: { count: number; amount: number };
  };
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

export interface AdminWebhookLog {
  id: string;
  provider: string;
  eventType: string;
  payload: unknown;
  processed: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWebhookLogs {
  items: AdminWebhookLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPaymentEvent {
  id: string;
  paymentId: string;
  eventType: string;
  status: string;
  amount: number;
  metadata: unknown;
  createdAt: string;
  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
}

export const adminFinanceApi = createApi({
  reducerPath: "adminFinanceApi",
  baseQuery,
  tagTypes: ["AdminFinance", "AdminWebhookLogs", "AdminPaymentEvents", "AdminGateways", "AdminBankAccounts"],
  endpoints: (builder) => ({
    getAdminFinanceOverview: builder.query<AdminFinanceOverview, void>({
      query: () => "/admin/finance/overview",
      providesTags: ["AdminFinance"],
    }),

    getAdminInvoices: builder.query<
      { items: AdminFinanceInvoiceItem[]; total: number; page: number; limit: number; totalPages: number },
      { status?: string; clientId?: string; contractId?: string; page?: number; limit?: number } | void
    >({
      query: (filters) => {
        if (!filters) return "/invoices";
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.clientId) params.set("clientId", filters.clientId);
        if (filters.contractId) params.set("contractId", filters.contractId);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/invoices?${params.toString()}`;
      },
      providesTags: ["AdminFinance"],
    }),

    getAdminPayments: builder.query<
      { items: AdminFinancePaymentItem[]; total: number; page: number; limit: number; totalPages: number },
      { status?: string; method?: string; page?: number; limit?: number } | void
    >({
      query: (filters) => {
        if (!filters) return "/payments";
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.method) params.set("method", filters.method);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/payments?${params.toString()}`;
      },
      providesTags: ["AdminFinance"],
    }),

    getAdminPaymentEvents: builder.query<AdminPaymentEvent[], string | void>({
      query: (paymentId) =>
        paymentId
          ? `/admin/finance/payment-events?paymentId=${paymentId}`
          : "/admin/finance/payment-events",
      providesTags: ["AdminPaymentEvents"],
    }),

    getAdminWebhookLogs: builder.query<
      PaginatedWebhookLogs,
      { status?: string; provider?: string; page?: number; limit?: number } | void
    >({
      query: (filters) => {
        if (!filters) return "/admin/finance/webhook-logs";
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.provider) params.set("provider", filters.provider);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        return `/admin/finance/webhook-logs?${params.toString()}`;
      },
      providesTags: ["AdminWebhookLogs"],
    }),

    retryAdminWebhook: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/finance/webhook-logs/${id}/retry`,
        method: "POST",
      }),
      invalidatesTags: ["AdminWebhookLogs", "AdminFinance"],
    }),

    forceInvoiceStatus: builder.mutation<
      void,
      { id: string; status: string; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/admin/finance/invoices/${id}/force-status`,
        method: "POST",
        body: { status, reason },
      }),
      invalidatesTags: ["AdminFinance"],
    }),

    writeOffInvoice: builder.mutation<void, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/finance/invoices/${id}/write-off`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["AdminFinance"],
    }),

    refundInvoice: builder.mutation<void, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/finance/invoices/${id}/refund`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["AdminFinance"],
    }),

    getAdminGateways: builder.query<Array<{
      id: string; name: string; type: string; isActive: boolean;
      configJson: { fields: Record<string, boolean>; isConfigured: boolean } | null;
      createdAt: string; updatedAt: string;
    }>, void>({
      query: () => "/payments/gateways",
      providesTags: ["AdminGateways"],
    }),

    updateAdminGateway: builder.mutation<void, {
      name: string; isActive?: boolean;
      secretKey?: string; webhookSecret?: string; publishableKey?: string;
    }>({
      query: ({ name, ...body }) => ({
        url: `/payments/gateways/${name}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminGateways"],
    }),

    getAdminBankAccounts: builder.query<Array<{
      id: string; bankName: string; accountName: string;
      accountNumber: string | null; iban: string;
      swiftCode: string | null; instructions: string | null;
      isActive: boolean; createdAt: string;
    }>, void>({
      query: () => "/payments/bank-accounts",
      providesTags: ["AdminBankAccounts"],
    }),

    createAdminBankAccount: builder.mutation<void, {
      bankName: string; accountName: string;
      accountNumber?: string; iban: string;
      swiftCode?: string; instructions?: string;
    }>({
      query: (body) => ({
        url: "/payments/bank-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminBankAccounts"],
    }),

    updateAdminBankAccount: builder.mutation<void, {
      id: string; bankName?: string; accountName?: string;
      accountNumber?: string; iban?: string;
      swiftCode?: string; instructions?: string;
    }>({
      query: ({ id, ...body }) => ({
        url: `/payments/bank-accounts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminBankAccounts"],
    }),

    deleteAdminBankAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/payments/bank-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminBankAccounts"],
    }),

    getAdminGatewaysHealth: builder.query<Array<{
      id: string; name: string; type: string; isActive: boolean;
      status: string; lastCheckedAt: string | null; error: string | null;
    }>, void>({
      query: () => "/admin/finance/gateways-health",
      providesTags: ["AdminGateways"],
    }),

    checkAdminGatewaysHealth: builder.mutation<void, void>({
      query: () => ({
        url: "/admin/finance/gateways-health/check",
        method: "POST",
      }),
      invalidatesTags: ["AdminGateways"],
    }),
  }),
});

export const {
  useGetAdminFinanceOverviewQuery,
  useGetAdminInvoicesQuery,
  useGetAdminPaymentsQuery,
  useGetAdminPaymentEventsQuery,
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookMutation,
  useForceInvoiceStatusMutation,
  useWriteOffInvoiceMutation,
  useRefundInvoiceMutation,
  useGetAdminGatewaysQuery,
  useUpdateAdminGatewayMutation,
  useGetAdminBankAccountsQuery,
  useCreateAdminBankAccountMutation,
  useUpdateAdminBankAccountMutation,
  useDeleteAdminBankAccountMutation,
  useGetAdminGatewaysHealthQuery,
  useCheckAdminGatewaysHealthMutation,
} = adminFinanceApi;
