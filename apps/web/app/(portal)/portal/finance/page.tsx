"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetPortalInvoicesQuery,
  useGetPortalFinanceSummaryQuery,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { KpiPill, KpiCurrency } from "@/components/design-system/KpiPill";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  PaymentSheet,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Input } from "@/components/design-system/Input";
import { mapFinanceStatusToUI } from "@/lib/utils/statusMapping";
import { Search, CreditCard, Receipt } from "lucide-react";

import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { value: "ALL", label: "الكل" },
      { value: "PAID", label: "مدفوعة" },
      { value: "PARTIAL", label: "مدفوعة جزئياً" },
      { value: "DUE", label: "قيد الانتظار" },
      { value: "LATE", label: "متأخرة" },
      { value: "SENT", label: "مُرسلة" },
      { value: "CANCELLED", label: "ملغاة" },
    ],
  },
];

const PAGE_SIZE = 7;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInvoiceStatus(status?: string) {
  switch (status) {
    case "PAID":
      return "PAID";
    case "PARTIAL":
      return "PARTIAL";
    case "LATE":
      return "LATE";
    case "CANCELLED":
      return "CANCELLED";
    case "SENT":
      return "SENT";
    default:
      return "DUE";
  }
}

export default function PortalFinancePage() {
  const { currency, fmtAmount } = useCurrency();
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<PayableInvoice | null>(
    null,
  );
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  const statusFilter = activeFilters["status"]?.[0] ?? "ALL";

  const { data: summaryData, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery(undefined, { pollingInterval: 30_000 });
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetPortalInvoicesQuery(
      {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      },
      { pollingInterval: 30_000 },
    );

  const invoices = invoicesData?.data ?? [];
  const total = invoicesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    setPage(1);
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter(
      (inv: any) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.contract?.title?.toLowerCase().includes(q),
    );
  }, [invoices, searchQuery]);

  const handlePayClick = useCallback((invoice: any) => {
    setSelectedInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
    });
    setIsPaymentSheetOpen(true);
  }, []);

  const summary = summaryData ?? {
    totalInvoiced: 0,
    totalPaid: 0,
    totalRemaining: 0,
    nextInvoiceDueDate: null,
    nextInvoiceAmount: 0,
  };
  const nextDate = summary.nextInvoiceDueDate
    ? fmtDate(summary.nextInvoiceDueDate)
    : "—";

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الفواتير والمدفوعات"
        description="استعرض جميع فواتيرك، حالة الدفع، المبالغ المستحقة، وقم بالدفع مباشرة."
        icon={Receipt}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          <>
            <Skeleton className="h-[112px] rounded-[24px]" />
            <Skeleton className="h-[112px] rounded-[24px]" />
            <Skeleton className="h-[112px] rounded-[24px]" />
            <Skeleton className="h-[112px] rounded-[24px]" />
          </>
        ) : (
          <>
            <KpiPill
              label="إجمالي المدفوعات"
              value={<KpiCurrency amount={summary.totalInvoiced} />}
            />
            <KpiPill
              label="الفواتير المستحقة"
              value={<KpiCurrency amount={summary.totalRemaining} />}
            />
            <KpiPill
              label="الفواتير المدفوعة"
              value={<KpiCurrency amount={summary.totalPaid} />}
            />
            <KpiPill
              label="الفاتورة القادمة"
              value={
                nextDate ? (
                  <span className="text-2xl font-bold text-natural-100">
                    {nextDate}
                  </span>
                ) : (
                  <KpiCurrency amount={summary.nextInvoiceAmount} />
                )
              }
            />
          </>
        )}
      </div>

      <SurfaceCard
        title="قائمة الفواتير"
        description="جميع فواتيرك مع حالة الدفع والإجراءات المتاحة"
        icon={Receipt}
        action={
          <FilterBar groups={FILTER_GROUPS} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
        }
      >
        {/* Toolbar inside card */}
        <div className="relative flex-1 mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <Input
            placeholder="ابحث برقم الفاتورة..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pr-9 h-10"
          />
        </div>

        <DataTable
          columns={[
            { id: "number", label: "رقم الفاتورة" },
            { id: "date", label: "التاريخ" },
            { id: "amount", label: "المبلغ" },
            { id: "status", label: "الحالة" },
            { id: "action", label: "الإجراءات" },
          ]}
          data={filteredInvoices}
          isLoading={invoicesLoading}
          isError={false}
          emptyState={{
            icon: Receipt,
            message: "لا توجد فواتير مطابقة.",
            hint: "ستظهر فواتيرك هنا حال إصدارها.",
          }}
          renderRow={(invoice: any) => (
            <tr
              key={invoice.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4 font-medium text-sm text-natural-100">
                {invoice.invoiceNumber ?? "—"}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {fmtDate(invoice.issueDate ?? invoice.dueDate)}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-baseline gap-1 justify-end font-medium text-natural-100">
                  <span>{fmtAmount(invoice.amount)}</span>
                  <SymbolRenderer
                    currency={currency}
                    className="text-xs font-light text-portal-icon"
                    width={18}
                    height={18}
                  />
                </div>
              </td>
              <td className="px-5 py-4">
                <StatusBadge
                  status={mapFinanceStatusToUI(
                    getInvoiceStatus(invoice.status),
                  )}
                />
              </td>
              <td className="px-5 py-4">
                {(invoice.status === "DUE" ||
                  invoice.status === "SENT" ||
                  invoice.status === "PARTIAL" ||
                  invoice.status === "LATE") && (
                  <ActionButton
                    variant="primary"
                    size="sm"
                    onClick={() => handlePayClick(invoice)}
                    className="h-9 rounded-xl px-3 text-xs font-medium gap-1 bg-secondary-500 hover:bg-secondary-600 text-white"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    دفع
                  </ActionButton>
                )}
              </td>
            </tr>
          )}
        />

        {!invoicesLoading && filteredInvoices.length > 0 && (
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>

      <PaymentSheet
        invoice={selectedInvoice}
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
      />
    </div>
  );
}
