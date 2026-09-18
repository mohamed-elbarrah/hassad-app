"use client";

import { useState } from "react";
import { InvoiceReviewWorkspace } from "@/components/shared/finance/InvoiceReviewWorkspace";
import {
  useApproveBankTransferMutation,
  useGetInvoicePaymentDetailsQuery,
  useGetInvoicesQuery,
  useRejectBankTransferMutation,
  type InvoiceFilters,
} from "@/features/finance/financeApi";

export default function FinanceInvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 25,
  });
  const { data, isLoading, isError, refetch } = useGetInvoicesQuery(filters);
  const { data: selectedInvoice, isFetching: isDetailLoading } =
    useGetInvoicePaymentDetailsQuery(selectedInvoiceId ?? "", {
      skip: !selectedInvoiceId,
    });
  const [approve, { isLoading: approving }] = useApproveBankTransferMutation();
  const [reject, { isLoading: rejecting }] = useRejectBankTransferMutation();

  return (
    <InvoiceReviewWorkspace
      title="فواتير العملاء"
      description="مراجعة الفواتير والمدفوعات والتحويلات البنكية من شاشة واحدة."
      invoices={data?.items ?? []}
      total={data?.total ?? 0}
      page={filters.page ?? 1}
      limit={filters.limit ?? 25}
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
