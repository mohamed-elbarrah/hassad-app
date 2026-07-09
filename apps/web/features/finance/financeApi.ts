import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Invoice,
  Payment,
  PaymentTicket,
  Employee,
  Salary,
  Ledger,
  InvoiceStatus,
  PaymentMethod,
  TicketStatus,
} from "@hassad/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedInvoices {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  contractId?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  contractId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export interface RegisterPaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  date?: string;
}

export interface FinanceMetrics {
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

export interface CashFlowItem {
  label: string;
  income: number;
  expenses: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface FinanceAction {
  id: string;
  type: "LATE_INVOICE" | "UNSENT_INVOICE" | "FAILED_PAYMENT" | "PENDING_SALARY";
  title: string;
  description: string;
  amount?: number;
  entityId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface TopClient {
  clientId: string;
  companyName: string;
  revenue: number;
  paymentCount: number;
  invoiceCount: number;
  collectionRate: number;
}

export interface RevenueTrendItem {
  label: string;
  income: number;
  invoiced: number;
}

export interface PaymentMethodDist {
  method: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinanceAlert {
  id: string;
  type: string;
  client: string;
  amount: number;
  date: string;
  status: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface PaginatedPayments {
  items: (Payment & { invoice: Invoice & { client: any } })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLedger {
  items: Ledger[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const financeApi = createApi({
  reducerPath: "financeApi",
  baseQuery,
  tagTypes: [
    "Invoice",
    "PaymentTicket",
    "Payment",
    "Employee",
    "Salary",
    "Ledger",
    "FinanceSummary",
    "PaymentGateway",
    "BankAccount",
  ],
  endpoints: (builder) => ({
    // Dashboard & Analytics
    getFinanceSummary: builder.query<FinanceMetrics, void>({
      query: () => "/finance/summary",
      providesTags: ["FinanceSummary"],
    }),
    getFinanceMetrics: builder.query<
      FinanceMetrics,
      { from?: string; to?: string; compareTo?: string }
    >({
      query: (params = {}) => ({ url: "/finance/metrics", params }),
      providesTags: ["FinanceSummary"],
    }),
    getCashFlow: builder.query<CashFlowItem[], { from?: string; to?: string }>({
      query: (params = {}) => ({ url: "/finance/cashflow", params }),
    }),
    getFinanceAlerts: builder.query<FinanceAlert[], void>({
      query: () => "/finance/alerts",
      providesTags: ["Invoice"],
    }),
    getAging: builder.query<AgingBucket[], void>({
      query: () => "/finance/aging",
      providesTags: ["Invoice"],
    }),
    getFinanceActions: builder.query<FinanceAction[], void>({
      query: () => "/finance/actions",
      providesTags: ["Invoice", "Payment", "Salary"],
    }),
    getTopClients: builder.query<
      TopClient[],
      { from?: string; to?: string; limit?: number }
    >({
      query: (params = {}) => ({ url: "/finance/top-clients", params }),
      providesTags: ["Payment"],
    }),
    getRevenueTrend: builder.query<
      RevenueTrendItem[],
      { from?: string; to?: string; groupBy?: "day" | "week" | "month" }
    >({
      query: (params = {}) => ({ url: "/finance/revenue-trend", params }),
      providesTags: ["Payment", "Invoice"],
    }),
    getPaymentMethods: builder.query<
      PaymentMethodDist[],
      { from?: string; to?: string }
    >({
      query: (params = {}) => ({ url: "/finance/payment-methods", params }),
      providesTags: ["Payment"],
    }),

    // Invoices
    getInvoices: builder.query<PaginatedInvoices, InvoiceFilters>({
      query: (filters = {}) => ({ url: "/invoices", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Invoice" as const,
                id,
              })),
              { type: "Invoice", id: "LIST" },
            ]
          : [{ type: "Invoice", id: "LIST" }],
    }),
    getInvoiceById: builder.query<Invoice, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Invoice", id }],
    }),
    createInvoice: builder.mutation<Invoice, CreateInvoiceInput>({
      query: (body) => ({ url: "/invoices", method: "POST", body }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }, "FinanceSummary"],
    }),
    sendInvoice: builder.mutation<Invoice, string>({
      query: (id) => ({ url: `/invoices/${id}/send`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    updateInvoice: builder.mutation<
      Invoice,
      { id: string; notes?: string; status?: InvoiceStatus }
    >({
      query: ({ id, ...body }) => ({
        url: `/invoices/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    sendInvoiceReminder: builder.mutation<
      { sent: boolean; reminderCount: number },
      string
    >({
      query: (id) => ({ url: `/invoices/${id}/remind`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Invoice", id }],
    }),
    getInvoicesByClient: builder.query<Invoice[], string>({
      query: (clientId) => `/invoices/client/${clientId}`,
      providesTags: ["Invoice"],
    }),
    getInvoicesByContractId: builder.query<Invoice[], string>({
      query: (contractId) => ({ url: "/invoices", params: { contractId } }),
      providesTags: ["Invoice"],
    }),

    // Payments
    getPayments: builder.query<
      PaginatedPayments,
      { page?: number; limit?: number; method?: string; status?: string }
    >({
      query: (params = {}) => ({ url: "/payments", params }),
      providesTags: ["Payment"],
    }),
    registerPayment: builder.mutation<Payment, RegisterPaymentInput>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      invalidatesTags: ["Payment", "Invoice", "FinanceSummary", "Ledger"],
    }),
    payInvoice: builder.mutation<
      Payment,
      { id: string; amount: number; method: PaymentMethod; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/invoices/${id}/pay`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Payment", "Invoice", "FinanceSummary", "Ledger"],
    }),
    payInvoicePublic: builder.mutation<
      Payment,
      { id: string; amount: number; method: PaymentMethod; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/invoices/${id}/pay-public`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payment", "Invoice"],
    }),

    // Payroll
    getEmployees: builder.query<Employee[], void>({
      query: () => "/payroll",
      providesTags: ["Employee"],
    }),
    getEmployeeById: builder.query<Employee, string>({
      query: (id) => `/payroll/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Employee", id }],
    }),
    paySalary: builder.mutation<Salary, { id: string; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/payroll/salaries/${id}/pay`,
        method: "POST",
        body: { notes },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Salary", id },
        { type: "Salary", id: "LIST" },
        "FinanceSummary",
        "Ledger",
      ],
    }),
    updateSalary: builder.mutation<
      Salary,
      { id: string; bonuses?: number; deductions?: number; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/payroll/salaries/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Salary", id },
        { type: "Salary", id: "LIST" },
        "FinanceSummary",
        "Ledger",
      ],
    }),
    runPayroll: builder.mutation<
      { generated: number },
      { month: number; year: number }
    >({
      query: (body) => ({ url: "/payroll/run", method: "POST", body }),
      invalidatesTags: ["Salary", "Ledger"],
    }),
    payAllSalaries: builder.mutation<
      { paid: number; total: number },
      { month: number; year: number }
    >({
      query: (body) => ({ url: "/payroll/pay-all", method: "POST", body }),
      invalidatesTags: ["Salary", "Ledger", "FinanceSummary"],
    }),
    previewPayroll: builder.query<
      {
        month: number;
        year: number;
        totalCost: number;
        pendingCount: number;
        notGenerated: number;
        employees: Array<{
          employeeId: string;
          name: string;
          role: string;
          payType: string;
          baseSalary: number;
          commissionRate?: number | null;
          amount: number;
          status: string;
          source: string;
          salaryId: string | null;
        }>;
      },
      { month: number; year: number }
    >({
      query: (params) => ({ url: "/payroll/preview", params }),
    }),
    createEmployee: builder.mutation<
      Employee,
      { name: string; role: string; baseSalary: number; userId?: string }
    >({
      query: (body) => ({ url: "/employees", method: "POST", body }),
      invalidatesTags: ["Employee"],
    }),
    updateEmployee: builder.mutation<
      Employee,
      {
        id: string;
        name?: string;
        role?: string;
        baseSalary?: number;
        payType?: string;
        commissionRate?: number;
        hourlyRate?: number;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Employee", id },
        "Employee",
      ],
    }),
    deleteEmployee: builder.mutation<Employee, string>({
      query: (id) => ({ url: `/employees/${id}`, method: "DELETE" }),
      invalidatesTags: ["Employee"],
    }),

    // Contracts
    getFinanceContracts: builder.query<any[], void>({
      query: () => "/finance/contracts",
      providesTags: ["Invoice"],
    }),

    // Ledger
    getLedger: builder.query<
      PaginatedLedger,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => ({ url: "/finance/ledger", params }),
      providesTags: ["Ledger"],
    }),

    // Payment Tickets (Legacy/Support)
    getPaymentTickets: builder.query<
      { items: PaymentTicket[]; total: number },
      any
    >({
      query: (params = {}) => ({ url: "/payment-tickets", params }),
      providesTags: ["PaymentTicket"],
    }),
    createPaymentTicket: builder.mutation<PaymentTicket, any>({
      query: (body) => ({ url: "/payment-tickets", method: "POST", body }),
      invalidatesTags: ["PaymentTicket"],
    }),
    resolvePaymentTicket: builder.mutation<PaymentTicket, string>({
      query: (id) => ({
        url: `/payment-tickets/${id}/resolve`,
        method: "PATCH",
      }),
      invalidatesTags: ["PaymentTicket"],
    }),

    // Payment Gateways
    getPaymentGateways: builder.query<any[], void>({
      query: () => "/payments/gateways",
      providesTags: ["PaymentGateway"],
    }),
    updatePaymentGateway: builder.mutation<any, { name: string; body: any }>({
      query: ({ name, body }) => ({
        url: `/payments/gateways/${name}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentGateway"],
    }),
    getPublicGateways: builder.query<string[], void>({
      query: () => "/payments/gateways-public",
    }),
    getBankAccounts: builder.query<any[], void>({
      query: () => "/payments/bank-accounts",
      providesTags: ["BankAccount"],
    }),
    createBankAccount: builder.mutation<any, any>({
      query: (body) => ({
        url: "/payments/bank-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BankAccount"],
    }),
    updateBankAccount: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/payments/bank-accounts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BankAccount"],
    }),
    deleteBankAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/payments/bank-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BankAccount"],
    }),
    createPaymentIntent: builder.mutation<
      any,
      {
        invoiceId: string;
        gatewayName: string;
        amount: number;
        currency?: string;
        successUrl?: string;
        cancelUrl?: string;
      }
    >({
      query: (body) => ({
        url: "/payments/create-intent",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payment", "Invoice"],
    }),

    createElementPaymentIntent: builder.mutation<
      { clientSecret: string; id: string },
      { invoiceId: string; amount: number; currency?: string }
    >({
      query: (body) => ({
        url: "/payments/create-element-intent",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payment", "Invoice"],
    }),

    uploadPaymentReceipt: builder.mutation<
      any,
      { paymentId: string; file: File }
    >({
      queryFn: async ({ paymentId, file }, _api, _extraOptions) => {
        const formData = new FormData();
        formData.append("receipt", file);
        formData.append("paymentId", paymentId);
        const apiBase =
          typeof window !== "undefined"
            ? `${window.location.origin.replace(/\/+$/, "")}/v1`
            : "";
        const res = await fetch(`${apiBase}/payments/upload-receipt`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) return { error: { status: res.status, data: json } };
        const data = json?.data !== undefined ? json.data : json;
        return { data };
      },
      invalidatesTags: ["Payment", "Invoice"],
    }),

    getStripePublishableKey: builder.query<
      { publishableKey: string | null; isActive: boolean },
      void
    >({
      query: () => "/payments/public-config",
    }),
  }),
});

export const {
  useGetFinanceSummaryQuery,
  useGetFinanceMetricsQuery,
  useGetCashFlowQuery,
  useGetFinanceAlertsQuery,
  useGetAgingQuery,
  useGetFinanceActionsQuery,
  useGetTopClientsQuery,
  useGetRevenueTrendQuery,
  useGetPaymentMethodsQuery,
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useSendInvoiceMutation,
  useUpdateInvoiceMutation,
  useSendInvoiceReminderMutation,
  useGetPaymentsQuery,
  useRegisterPaymentMutation,
  usePayInvoiceMutation,
  usePayInvoicePublicMutation,
  useCreatePaymentIntentMutation,
  useCreateElementPaymentIntentMutation,
  useUploadPaymentReceiptMutation,
  useGetStripePublishableKeyQuery,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  usePaySalaryMutation,
  useUpdateSalaryMutation,
  useRunPayrollMutation,
  usePayAllSalariesMutation,
  usePreviewPayrollQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetFinanceContractsQuery,
  useGetLedgerQuery,
  useGetPaymentTicketsQuery,
  useCreatePaymentTicketMutation,
  useResolvePaymentTicketMutation,
  useGetInvoicesByClientQuery,
  useGetInvoicesByContractIdQuery,
  useGetPaymentGatewaysQuery,
  useUpdatePaymentGatewayMutation,
  useGetPublicGatewaysQuery,
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} = financeApi;
