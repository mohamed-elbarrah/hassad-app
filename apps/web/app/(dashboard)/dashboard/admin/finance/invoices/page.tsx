"use client";

import { useState } from "react";
import { InvoiceReviewWorkspace } from "@/components/shared/finance/InvoiceReviewWorkspace";
import {
  useApproveAdminBankTransferMutation,
  useGetAdminInvoicePaymentDetailsQuery,
  useGetAdminInvoicesQuery,
  useRejectAdminBankTransferMutation,
} from "@/features/admin/adminFinanceApi";

export default function AdminFinanceInvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    status?: string;
    method?: string;
    search?: string;
  }>({ page: 1, limit: 25 });
  const { data, isLoading, isError, refetch } =
    useGetAdminInvoicesQuery(filters);
  const { data: selectedInvoice, isFetching: isDetailLoading } =
    useGetAdminInvoicePaymentDetailsQuery(selectedInvoiceId ?? "", {
      skip: !selectedInvoiceId,
    });
  const [approve, { isLoading: approving }] =
    useApproveAdminBankTransferMutation();
  const [reject, { isLoading: rejecting }] =
    useRejectAdminBankTransferMutation();

  return (
    <InvoiceReviewWorkspace
      title="فواتير العملاء"
      description="مراجعة الفواتير والمدفوعات والتحويلات البنكية مع سجل التدقيق."
      invoices={data?.items ?? []}
      total={data?.total ?? 0}
      page={filters.page}
      limit={filters.limit}
      isLoading={isLoading}
      isError={isError}
      selectedInvoiceId={selectedInvoiceId}
      selectedInvoice={selectedInvoice ?? null}
      isDetailLoading={isDetailLoading}
      isReviewing={approving || rejecting}
      onSelectInvoice={setSelectedInvoiceId}
      onFiltersChange={(next) => setFilters({ page: 1, limit: 25, ...next })}
      onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      onRefresh={() => void refetch()}
      onApprove={async (paymentId, reason) => {
        await approve({ id: paymentId, reason }).unwrap();
      }}
      onReject={async (paymentId, reason) => {
        await reject({ id: paymentId, reason }).unwrap();
      }}
    />
  );
}
