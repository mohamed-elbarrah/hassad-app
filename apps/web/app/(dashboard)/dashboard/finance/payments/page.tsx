"use client";

import { useState, useMemo } from "react";
import { useGetPaymentsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import {
  Search,
  Download,
  ExternalLink,
  CreditCard,
  Banknote,
  Landmark,
  ArrowLeft,
  ArrowRight,
  X,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PaymentStatus } from "@hassad/shared";

const TABS: { value: "all" | PaymentStatus; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: PaymentStatus.SUCCESS, label: "ناجحة" },
  { value: PaymentStatus.FAILED, label: "فاشلة" },
  { value: PaymentStatus.REFUNDED, label: "مسترجعة" },
  { value: PaymentStatus.PENDING, label: "معلقة" },
];

function getMethodIcon(method: string) {
  if (method.includes("VISA") || method.includes("MADA"))
    return <CreditCard className="w-4 h-4 text-action-blue" />;
  if (method.includes("BANK_TRANSFER"))
    return <Landmark className="w-4 h-4 text-neutral-500" />;
  return <Banknote className="w-4 h-4 text-success-500" />;
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"all" | PaymentStatus>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetPaymentsQuery({ page });

  const payments = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Stats from all loaded payments
  const stats = useMemo(() => {
    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const successful = payments.filter((p) => p.status === PaymentStatus.SUCCESS);
    const successfulAmount = successful.reduce((s, p) => s + p.amount, 0);
    const failed = payments.filter((p) => p.status === PaymentStatus.FAILED);
    const refunded = payments.filter((p) => p.status === PaymentStatus.REFUNDED);
    const pending = payments.filter((p) => p.status === PaymentStatus.PENDING);
    return {
      count: total,
      totalAmount,
      successfulAmount,
      failedCount: failed.length,
      refundedCount: refunded.length,
      pendingCount: pending.length,
      rate: totalAmount > 0 ? Math.round((successfulAmount / totalAmount) * 100) : 0,
    };
  }, [payments, total]);

  // Client-side tab filter + search
  const filtered = useMemo(() => {
    let result = payments;
    if (tab !== "all") {
      result = result.filter((p) => p.status === tab);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
          p.invoice?.client?.companyName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [payments, tab, search]);

  const emptyState =
    search || tab !== "all"
      ? {
          icon: Search,
          message: "لا توجد نتائج مطابقة",
          hint: "جرب تعديل البحث أو إلغاء الفلاتر لعرض المزيد.",
        }
      : {
          icon: CreditCard,
          message: "لا توجد عمليات مسجلة",
          hint: "ستظهر المدفوعات هنا عند تسجيلها.",
        };

  const hasFilters = search || tab !== "all";

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تتبع المدفوعات</h1>
          <p className="text-neutral-400 mt-1">
            سجل شامل لجميع العمليات المالية الواردة والمعلقة.
          </p>
        </div>
        <ActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          تحميل كشف الحساب
        </ActionButton>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-50">
              <FileText className="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">إجمالي العمليات</p>
              <p className="text-xl font-bold">{stats.count.toLocaleString()}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">الناجحة</p>
              <p className="text-xl font-bold text-success-600">
                {stats.successfulAmount.toLocaleString()} ر.س
              </p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger-50">
              <AlertTriangle className="w-4 h-4 text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">فاشلة / مسترجعة</p>
              <p className="text-xl font-bold text-danger-600">
                {stats.failedCount + stats.refundedCount}
              </p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-50">
              <TrendingUp className="w-4 h-4 text-warning-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-400">نسبة النجاح</p>
              <p className="text-xl font-bold">{stats.rate}%</p>
            </div>
            <ProgressBar value={stats.rate} size="sm" className="w-20" />
          </div>
        </SurfaceCard>
      </div>

      {/* Toolbar: tabs + search + export + clear */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-portal-card-border bg-natural-0">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tab === t.value
                  ? "bg-secondary-500 text-white shadow-sm"
                  : "text-neutral-400 hover:text-natural-100 hover:bg-neutral-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <FormInputControl
            placeholder="بحث برقم العملية أو العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-natural-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {hasFilters && (
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setTab("all");
              }}
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </ActionButton>
          )}
        </div>
      </div>

      {/* Data Table — standalone */}
      <DataTable
        columns={[
          { id: "id", label: "رقم العملية" },
          { id: "invoice", label: "الفاتورة" },
          { id: "client", label: "العميل" },
          { id: "amount", label: "المبلغ" },
          { id: "method", label: "طريقة الدفع" },
          { id: "status", label: "الحالة" },
          { id: "date", label: "التاريخ", align: "left" },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={false}
        emptyState={emptyState}
        renderRow={(p) => (
          <tr className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 font-mono text-[10px] font-semibold">
              {p.id.substring(0, 8)}...
            </td>
            <td className="px-5 py-4">
              <Link
                href={`/dashboard/finance/invoices/${p.invoiceId}`}
                className="flex items-center hover:text-secondary-500 transition-colors"
              >
                {p.invoice?.invoiceNumber || "N/A"}
                <ExternalLink className="w-3 h-3 mr-1" />
              </Link>
            </td>
            <td className="px-5 py-4 font-medium">
              {p.invoice?.client?.companyName || "N/A"}
            </td>
            <td className="px-5 py-4 font-bold">
              {p.amount.toLocaleString()} ر.س
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                {getMethodIcon(p.method)}
                <span className="text-sm text-neutral-500">{p.method}</span>
              </div>
            </td>
            <td className="px-5 py-4">
              <FinanceStatusBadge status={p.status} />
            </td>
            <td className="px-5 py-4 text-left text-xs text-neutral-400">
              {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            عرض {(page - 1) * (data?.limit || 20) + 1}–
            {Math.min(page * (data?.limit || 20), total)} من {total} عملية
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              السابق
            </ActionButton>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pg: number;
                if (totalPages <= 5) pg = i + 1;
                else if (page <= 3) pg = i + 1;
                else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = page - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pg
                        ? "bg-secondary-500 text-white"
                        : "bg-natural-0 border border-portal-card-border hover:bg-neutral-50"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
            <ActionButton
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
