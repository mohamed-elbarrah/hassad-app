"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetPortalInvoicesQuery,
  useGetPortalFinanceSummaryQuery,
} from "@/features/portal/portalApi";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { PortalDataTable } from "@/components/portal/PortalDataTable";
import { PortalPagination } from "@/components/portal/PortalPagination";
import { PortalFilterPills } from "@/components/portal/PortalFilterPills";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { PaymentModal } from "@/components/portal/PaymentModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapFinanceStatusToUI } from "@/lib/utils/statusMapping";
import { Search, CreditCard, Receipt } from "lucide-react";

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

function fmtCurrency(n: number) {
  return n.toLocaleString("en-US");
}

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

function SummaryCard({
  title,
  value,
  date,
}: {
  title: string;
  value: string;
  date?: string;
}) {
  return (
    <div className="rounded-[24px] border-[1.5px] border-portal-card-border bg-natural-0 p-6">
      <p className="text-sm font-medium text-portal-icon mb-4">{title}</p>
      <div>
        {date ? (
          <p className="text-2xl font-bold text-natural-100">{date}</p>
        ) : (
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-sm font-medium text-portal-icon">ر.س</span>
            <span className="text-[28px] font-bold text-natural-100">
              {value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalFinancePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery();
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetPortalInvoicesQuery({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    });

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
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
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
      <PortalPageIntro
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
            <SummaryCard
              title="إجمالي المدفوعات"
              value={fmtCurrency(summary.totalInvoiced)}
            />
            <SummaryCard
              title="الفواتير المستحقة"
              value={fmtCurrency(summary.totalRemaining)}
            />
            <SummaryCard
              title="الفواتير المدفوعة"
              value={fmtCurrency(summary.totalPaid)}
            />
            <SummaryCard
              title="الفاتورة القادمة"
              value={fmtCurrency(summary.nextInvoiceAmount)}
              date={nextDate}
            />
          </>
        )}
      </div>

      <PortalSurfaceCard
        title="قائمة الفواتير"
        description="جميع فواتيرك مع حالة الدفع والإجراءات المتاحة"
        icon={Receipt}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2">
              <Search className="h-4 w-4 text-portal-icon" />
              <Input
                placeholder="البحث برقم الفاتورة..."
                className="border-none focus-visible:ring-0 text-sm bg-transparent h-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <PortalFilterPills
              options={STATUS_FILTER_OPTIONS}
              active={statusFilter}
              onChange={handleFilterChange}
            />
          </div>
        }
      >
        <PortalDataTable
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
                  <span className="text-xs font-normal text-portal-icon">
                    ر.س
                  </span>
                  <span>{fmtCurrency(invoice.amount)}</span>
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
                  <Button
                    size="sm"
                    onClick={() => handlePayClick(invoice)}
                    className="h-9 rounded-xl px-3 text-xs font-medium gap-1 bg-secondary-500 hover:bg-secondary-600 text-white"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    دفع
                  </Button>
                )}
              </td>
            </tr>
          )}
        />

        {!invoicesLoading && filteredInvoices.length > 0 && (
          <PortalPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </PortalSurfaceCard>

      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
        />
      )}
    </div>
  );
}
