"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetPortalInvoicesQuery,
  useGetPortalFinanceSummaryQuery,
} from "@/features/portal/portalApi";
import { PaymentModal } from "@/components/portal/PaymentModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  SlidersHorizontal,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Constants ─────────────────────────────────────────────────────────── */

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

const STATUS_CONFIG: Record<string, { text: string; label: string }> = {
  PAID: { text: "text-success-500", label: "مدفوعة" },
  PARTIAL: { text: "text-alert-500", label: "مدفوعة جزئياً" },
  DUE: { text: "text-danger-500", label: "قيد الانتظار" },
  SENT: { text: "text-success-500", label: "مُرسلة" },
  LATE: { text: "text-danger-500", label: "متأخرة" },
  PENDING: { text: "text-alert-500", label: "معلقة" },
  CANCELLED: { text: "text-neutral-500", label: "ملغاة" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "الكل" },
  { value: "PAID", label: "مدفوعة" },
  { value: "PARTIAL", label: "مدفوعة جزئياً" },
  { value: "DUE", label: "قيد الانتظار" },
  { value: "LATE", label: "متأخرة" },
  { value: "SENT", label: "مُرسلة" },
  { value: "CANCELLED", label: "ملغاة" },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtCurrency(n: number) {
  return n.toLocaleString("en-US"); // Use English numerals for the value as per design
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

function getInvoiceStatus(invoice: any) {
  if (invoice.status === "PAID") return "PAID";
  if (invoice.status === "PARTIAL") return "PARTIAL";
  if (invoice.status === "LATE") return "LATE";
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.status === "SENT") return "SENT";
  return "DUE";
}

/* ── Components ────────────────────────────────────────────────────────── */

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
    <Card className="rounded-[24px] border-[1.5px] border-portal-card-border bg-white shadow-none">
      <CardContent className="p-6 text-right">
        <p className="text-[14px] font-medium text-portal-icon mb-4">{title}</p>
        <div>
          {date ? (
            <p className="text-[24px] font-bold text-natural-100">{date}</p>
          ) : (
            <div className="flex items-baseline justify-start gap-1">
              <span className="text-[14px] font-medium text-portal-icon">
                ر.س
              </span>
              <span className="text-[28px] font-bold text-natural-100">
                {value}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusText({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DUE;
  return (
    <span className={cn("text-[15px] font-medium", cfg.text)}>{cfg.label}</span>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-portal-divider">
      <p className="text-sm font-medium text-portal-icon">
        الصفحة {page} من {totalPages} (إجمالي {total})
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-portal-card-border text-portal-icon disabled:opacity-30"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -mr-2" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-portal-card-border text-portal-icon disabled:opacity-30"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-badge-gray-bg text-secondary-500 font-bold text-sm">
          {page}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-portal-card-border text-portal-icon disabled:opacity-30"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-portal-card-border text-portal-icon disabled:opacity-30"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -mr-2" />
        </Button>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function PortalFinancePage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(7);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: summaryData, isLoading: summaryLoading } =
    useGetPortalFinanceSummaryQuery();

  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetPortalInvoicesQuery({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit,
    });

  const invoices = invoicesData?.data ?? [];
  const total = invoicesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

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

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
    },
    [setPage],
  );

  const handleLimitChange = useCallback(
    (val: string) => {
      setLimit(Number(val));
      setPage(1);
    },
    [setLimit, setPage],
  );

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
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg">
            <ArrowRightLeft className="h-7 w-7 text-secondary-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold leading-[1.2] text-natural-100 lg:text-[32px]">
              الفواتير والمدفوعات
            </h1>
            <p className="max-w-xl text-base leading-7 text-portal-note-text">
              جميع فواتيرك، مدفوعاتك، وعقودك في مكان واحد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch lg:self-auto">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-xl border-portal-card-border text-portal-icon hover:bg-neutral-100"
          >
            <FileDown className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
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

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mt-2">
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-10 w-[110px] rounded-xl border-portal-card-border text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  صفحة / {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-portal-icon" />
            <Input
              placeholder="البحث برقم الفاتورة..."
              className="h-10 w-[240px] rounded-xl border-portal-card-border pr-9 text-sm focus-visible:ring-secondary-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 rounded-xl border-portal-card-border px-4 font-medium",
              showFilters && "bg-neutral-100",
            )}
            onClick={() => setShowFilters((s) => !s)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            تصفية
          </Button>
        </div>
      </div>

      {/* ── Filters Row (collapsible) ───────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white border border-portal-card-border p-3">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-neutral-100 text-natural-100"
                  : "text-portal-icon hover:bg-neutral-100",
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card className="rounded-[20px] border-[1.5px] border-portal-card-border bg-white overflow-hidden shadow-none" dir="ltr">
        <Table>
          <TableHeader className="bg-portal-bg">
            <TableRow className="hover:bg-transparent border-b-portal-divider">
              <TableHead className="w-[120px] text-right font-bold text-natural-100">
                الإجراءات
              </TableHead>
              <TableHead className="text-right font-bold text-natural-100">
                الحالة
              </TableHead>
              <TableHead className="text-right font-bold text-natural-100">
                المبلغ
              </TableHead>
              <TableHead className="text-right font-bold text-natural-100">
                التاريخ
              </TableHead>
              <TableHead className="text-right font-bold text-natural-100">
                رقم الفاتورة
              </TableHead>
              <TableHead className="w-[60px] text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-portal-card-border"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-right">
            {invoicesLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i} className="border-b-portal-divider">
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-4 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-portal-note-text"
                >
                  لا توجد فواتير مطابقة للبحث.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice: any) => {
                const statusKey = getInvoiceStatus(invoice);
                const showPayBtn =
                  statusKey === "DUE" ||
                  statusKey === "SENT" ||
                  statusKey === "PARTIAL" ||
                  statusKey === "LATE";

                return (
                  <TableRow
                    key={invoice.id}
                    className="group border-b-portal-divider hover:bg-portal-bg/30 transition-colors"
                  >
                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {showPayBtn && (
                          <Button
                            size="sm"
                            className="h-8 gap-1 rounded-lg text-xs bg-secondary-500 hover:bg-secondary-600 text-white font-bold"
                            onClick={() => handlePayClick(invoice)}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            دفع
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusText status={statusKey} />
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <div className="flex items-baseline gap-1 justify-end font-medium text-natural-100">
                        <span className="text-xs font-normal text-portal-icon">
                          ر.س
                        </span>
                        <span>{fmtCurrency(invoice.amount)}</span>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-portal-date">
                      {fmtDate(invoice.issueDate ?? invoice.dueDate)}
                    </TableCell>

                    {/* Invoice Number */}
                    <TableCell className="font-bold text-natural-100">
                      {invoice.invoiceNumber}
                    </TableCell>

                    {/* Checkbox */}
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-portal-card-border"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {!invoicesLoading && (
          <div className="px-5 py-4 bg-white">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* ── Payment Modal ────────────────────────────────────────────────── */}
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
