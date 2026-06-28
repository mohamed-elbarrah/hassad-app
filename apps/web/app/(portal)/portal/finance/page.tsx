"use client";

import { useState, useCallback, useMemo } from "react";
import { Receipt } from "lucide-react";
import {
  useGetPortalInvoicesQuery,
  useGetPortalFinanceSummaryQuery,
  type PortalInvoiceSummary,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import {
  PaymentSheet,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";
import {
  FinanceSummaryKpis,
  FinanceToolbar,
  renderInvoiceRowCells,
  type InvoiceRowProps,
} from "@/components/portal/finance";

const PAGE_SIZE = 7;

export default function PortalFinancePage() {
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<PayableInvoice | null>(
    null,
  );
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  const statusFilter = activeFilters["status"]?.[0] ?? "ALL";

  const { data: summaryData, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery(undefined, { pollingInterval: 120_000 });

  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetPortalInvoicesQuery(
      {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      },
      { pollingInterval: 120_000 },
    );

  const invoices: PortalInvoiceSummary[] = invoicesData?.data ?? [];
  const total = invoicesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    setPage(1);
  }, []);

  // Server already filtered by status; we only do search locally.
  const visibleInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.contract?.title.toLowerCase().includes(q) ?? false),
    );
  }, [invoices, searchQuery]);

  const handlePayClick = useCallback((invoice: PayableInvoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentSheetOpen(true);
  }, []);

  const hasActiveSearchOrFilter =
    searchQuery.trim().length > 0 || statusFilter !== "ALL";

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الفواتير والمدفوعات"
        description="استعرض جميع فواتيرك، حالة الدفع، المبالغ المستحقة، وقم بالدفع مباشرة."
        icon={Receipt}
      />

      <FinanceSummaryKpis
        data={summaryData}
        isLoading={summaryLoading}
      />

      <FinanceToolbar
        search={searchQuery}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        invoices={invoices}
        totalCount={total}
        visibleCount={visibleInvoices.length}
      />

      <DataTable
        columns={[
          { id: "number", label: "رقم الفاتورة" },
          { id: "date", label: "التاريخ" },
          { id: "amount", label: "المبلغ", align: "left" },
          { id: "status", label: "الحالة" },
          { id: "action", label: "", align: "left", width: "140px" },
        ]}
        data={visibleInvoices}
        isLoading={invoicesLoading}
        isError={false}
        skeletonRows={PAGE_SIZE}
        emptyState={{
          icon: Receipt,
          message: hasActiveSearchOrFilter
            ? "لا توجد فواتير مطابقة"
            : "لا توجد فواتير حتى الآن.",
          hint: hasActiveSearchOrFilter
            ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
            : "ستظهر فواتيرك هنا حال إصدارها.",
        }}
        renderCells={(invoice) =>
          renderInvoiceRowCells(invoice, {
            onPay: handlePayClick,
          } satisfies Pick<InvoiceRowProps, "onPay">)
        }
      />

      {!invoicesLoading && visibleInvoices.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <PaymentSheet
        invoice={selectedInvoice}
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
      />
    </div>
  );
}