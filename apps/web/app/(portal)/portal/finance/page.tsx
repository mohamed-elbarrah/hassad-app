"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetPortalInvoicesQuery,
  useGetPortalFinanceSummaryQuery,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import {
  KpiPill,
  KpiCurrency,
} from "@/components/design-system/KpiPill";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterPills } from "@/components/design-system/FilterPills";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { PaymentSheet, type PayableInvoice } from "@/components/payments/PaymentSheet";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Input } from "@/components/design-system/Input";
import { mapFinanceStatusToUI } from "@/lib/utils/statusMapping";
import { Search, CreditCard, Receipt } from "lucide-react";

import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";

const PAGE_SIZE = 7;

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "الكل" },
  { value: "PAID", label: "مدفوعة" },
  { value: "PARTIAL", label: "مدفوعة جزئياً" },
  { value: "DUE", label: "قيد الانتظار" },
  { value: "LATE", label: "متأخرة" },
  { value: "SENT", label: "مُرسلة" },
  { value: "CANCELLED", label: "ملغاة" },
];

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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<PayableInvoice | null>(null);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery(undefined, { pollingInterval: 30_000 });
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetPortalInvoicesQuery({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    }, { pollingInterval: 30_000 });

  const invoices = invoicesData?.data ?? [];
  const total = invoicesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2">
              <Search className="h-4 w-4 text-portal-icon" />
              <Input
                placeholder="البحث برقم الفاتورة..."
                className="text-sm h-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <FilterPills
              options={STATUS_FILTER_OPTIONS}
              active={statusFilter}
              onChange={handleFilterChange}
            />
          </div>
        }
      >
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
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
