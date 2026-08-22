import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  ContractStatus,
  ContractType,
  UpdateContractInput,
  InvoiceStatus,
  PaymentMethod,
  ServiceItem,
  PaymentAmountType,
} from "@hassad/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractClient {
  id: string;
  companyName: string;
  // Personal identity now on `User` (joined via userId).
  user: { name: string; email: string; phoneWhatsapp: string | null } | null;
  leadId?: string | null;
}

export interface InvoiceItemSummary {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  status: string;
  date: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  paymentReference?: string | null;
  payments?: PaymentSummary[];
  items?: InvoiceItemSummary[];
}

export interface ContractItem {
  id: string;
  requestId?: string | null;
  clientId: string;
  proposalId?: string | null;
  createdBy: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  filePath?: string | null;
  shareLinkToken?: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt?: string | null;
  createdAt: string;
  downPaymentType?: string | null;
  downPaymentValue?: number | null;
  numberOfMonths?: number | null;
  initialPaymentRequired?: boolean;
  initialPaymentStatus?: string;
  initialPaymentAmount?: number | null;
  client?: ContractClient;
  servicesList?: ServiceItem[];
  proposal?: {
    id: string;
    title: string;
    servicesList?: ServiceItem[];
    totalPrice?: number;
  } | null;
  invoices?: InvoiceSummary[];
}

export interface PaginatedContracts {
  items: ContractItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SalesContractListItem = Omit<
  ContractItem,
  "shareLinkToken" | "filePath" | "servicesList" | "invoices"
>;

export interface SalesContractPaymentPlan {
  id: string;
  label: string;
  sequence: number;
  triggerType: string;
  amountType: string;
  amountValue: number;
  isRecurring: boolean;
  dueOffsetDays?: number | null;
  isActive: boolean;
  invoices?: Array<{ id: string; invoiceNumber: string; status: string }>;
}

export interface SalesContractStatusHistory {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  changedAt: string;
  reason?: string | null;
  changer?: { id: string; name: string } | null;
}

export interface SalesContractDetail extends SalesContractListItem {
  filePath?: string | null;
  currency?: string | null;
  downPaymentType?: string | null;
  downPaymentValue?: number | null;
  initialPaymentRequired?: boolean;
  initialPaymentStatus?: string;
  initialPaymentAmount?: number | null;
  numberOfMonths?: number | null;
  creator?: { id: string; name: string; email?: string | null } | null;
  salesPerson?: { id: string; name: string; email?: string | null } | null;
  servicesList?: ServiceItem[];
  proposal?: {
    id: string;
    title: string;
    serviceDescription?: string | null;
    servicesList?: ServiceItem[];
    totalPrice?: number;
    durationDays?: number;
  } | null;
  request?: {
    id: string;
    status: string;
    companyName?: string | null;
    contactName?: string | null;
    assignedSalesId?: string | null;
  } | null;
  project?: { id: string; name: string; status?: string | null } | null;
  invoices?: InvoiceSummary[];
  paymentPlans?: SalesContractPaymentPlan[];
  statusHistory?: SalesContractStatusHistory[];
  versions?: Array<{
    id: string;
    versionNumber: number;
    filePath?: string | null;
    createdAt: string;
    creator?: { id: string; name: string };
  }>;
}

export interface PaginatedSalesContracts {
  items: SalesContractListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SalesContractFilters {
  clientId?: string;
  status?: ContractStatus;
  type?: ContractType;
  renewal?: "30" | "60" | "90";
  search?: string;
  page?: number;
  limit?: number;
}

/** Input for the FormData POST /contracts mutation */
export interface CreateContractFormInput {
  requestId: string;
  title: string;
  type: ContractType;
  monthlyValue?: number;
  totalValue?: number;
  startDate?: string;
  endDate?: string;
  file: File;
  proposalId?: string;
  /** Billing fields for MONTHLY_RETAINER contracts */
  downPaymentType?: PaymentAmountType;
  downPaymentValue?: number;
  numberOfMonths?: number;
  initialPaymentRequired?: boolean;
  initialPaymentType?: PaymentAmountType;
  initialPaymentValue?: number;
}

export interface SignContractInput {
  signedByName: string;
  signedByEmail?: string;
}

function buildContractFormData(input: CreateContractFormInput) {
  const formData = new FormData();
  formData.append("requestId", input.requestId);
  formData.append("title", input.title);
  formData.append("type", input.type);
  if (input.monthlyValue !== undefined) {
    formData.append("monthlyValue", String(input.monthlyValue));
  }
  if (input.totalValue !== undefined) {
    formData.append("totalValue", String(input.totalValue));
  }
  if (input.startDate) formData.append("startDate", input.startDate);
  if (input.endDate) formData.append("endDate", input.endDate);

  const downPaymentType =
    input.initialPaymentRequired === false
      ? undefined
      : (input.downPaymentType ?? input.initialPaymentType);
  const downPaymentValue =
    input.initialPaymentRequired === false
      ? undefined
      : (input.downPaymentValue ?? input.initialPaymentValue);

  if (downPaymentType) {
    formData.append("downPaymentType", downPaymentType);
  }
  if (downPaymentValue !== undefined) {
    formData.append("downPaymentValue", String(downPaymentValue));
  }
  if (input.numberOfMonths !== undefined) {
    formData.append("numberOfMonths", String(input.numberOfMonths));
  }
  formData.append("file", input.file, input.file.name);
  if (input.proposalId) formData.append("proposalId", input.proposalId);

  return formData;
}

// ─── API slice ────────────────────────────────────────────────────────────────

export const contractsApi = createApi({
  reducerPath: "contractsApi",
  baseQuery,
  tagTypes: ["Contract"],
  endpoints: (builder) => ({
    getContracts: builder.query<PaginatedContracts, ContractFilters>({
      query: (filters = {}) => ({ url: "/contracts", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Contract" as const,
                id,
              })),
              { type: "Contract", id: "LIST" },
            ]
          : [{ type: "Contract", id: "LIST" }],
    }),

    getContractById: builder.query<ContractItem, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Contract", id }],
    }),

    getSalesContracts: builder.query<
      PaginatedSalesContracts,
      SalesContractFilters
    >({
      query: (filters = {}) => ({ url: "/sales/contracts", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Contract" as const,
                id,
              })),
              { type: "Contract", id: "SALES_LIST" },
            ]
          : [{ type: "Contract", id: "SALES_LIST" }],
    }),

    getSalesContractById: builder.query<SalesContractDetail, string>({
      query: (id) => `/sales/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Contract", id }],
    }),

    getSalesContractDetail: builder.query<SalesContractDetail, string>({
      query: (id) => `/sales/contracts/${id}/detail`,
      providesTags: (_result, _error, id) => [{ type: "Contract", id }],
    }),

    getSalesContractShareLink: builder.query<{ path: string }, string>({
      query: (id) => `/sales/contracts/${id}/share-link`,
    }),

    /** One-step: multipart/form-data upload anchored to the request. */
    createContract: builder.mutation<ContractItem, CreateContractFormInput>({
      query: (input) => ({
        url: "/contracts",
        method: "POST",
        body: buildContractFormData(input),
      }),
      invalidatesTags: [{ type: "Contract", id: "LIST" }],
    }),

    updateContract: builder.mutation<
      ContractItem,
      { id: string; body: UpdateContractInput }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    createSalesContract: builder.mutation<
      ContractItem,
      CreateContractFormInput
    >({
      query: (input) => ({
        url: "/sales/contracts",
        method: "POST",
        body: buildContractFormData(input),
      }),
      invalidatesTags: [{ type: "Contract", id: "SALES_LIST" }],
    }),

    updateSalesContract: builder.mutation<
      ContractItem,
      { id: string; body: UpdateContractInput }
    >({
      query: ({ id, body }) => ({
        url: `/sales/contracts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contract", id },
        { type: "Contract", id: "SALES_LIST" },
      ],
    }),

    sendContract: builder.mutation<ContractItem, string>({
      query: (id) => ({ url: `/contracts/${id}/send`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    signContract: builder.mutation<
      ContractItem,
      { id: string; body: SignContractInput }
    >({
      query: ({ id, body }) => ({
        url: `/contracts/${id}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contract", id },
        { type: "Contract", id: "LIST" },
      ],
    }),

    // ─── Public token-based endpoints ───────────────────────────────────────

    getContractByToken: builder.query<ContractItem, string>({
      query: (token) => `/contracts/share/${token}`,
      providesTags: (_result, _error, token) => [
        { type: "Contract", id: `token:${token}` },
      ],
    }),

    /** CLIENT portal: contracts linked to the logged-in user's leads */
    getMyContracts: builder.query<ContractItem[], void>({
      query: () => `/contracts/my`,
      providesTags: [{ type: "Contract", id: "MY" }],
    }),

    signContractByToken: builder.mutation<
      ContractItem,
      { token: string; body: SignContractInput }
    >({
      query: ({ token, body }) => ({
        url: `/contracts/share/${token}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { token }) => [
        { type: "Contract", id: `token:${token}` },
        { type: "Contract", id: "LIST" },
      ],
    }),

    generateInvoice: builder.mutation<InvoiceSummary, string>({
      query: (contractId) => ({
        url: `/contracts/${contractId}/generate-invoice`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, contractId) => [
        { type: "Contract", id: contractId },
        { type: "Contract", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useGetSalesContractsQuery,
  useGetSalesContractByIdQuery,
  useGetSalesContractDetailQuery,
  useLazyGetSalesContractShareLinkQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useCreateSalesContractMutation,
  useUpdateSalesContractMutation,
  useSendContractMutation,
  useSignContractMutation,
  useGetContractByTokenQuery,
  useGetMyContractsQuery,
  useSignContractByTokenMutation,
  useGenerateInvoiceMutation,
} = contractsApi;
