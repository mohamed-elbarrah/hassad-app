"use client";

import { useState, useMemo } from "react";
import { useGetPaymentsQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";
import { FinanceListToolbar } from "@/components/dashboard/finance/shared/FinanceListToolbar";
import { DataTable } from "@/components/design-system/DataTable";
import { StatCard } from "@/components/design-system/StatCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pagination } from "@/components/design-system/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import {
  Search,
  Download,
  ExternalLink,
  CreditCard,
  Banknote,
  Landmark,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PaymentStatus } from "@hassad/shared";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

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
    return <Landmark className="w-4 h-4 text-portal-note-text" />;
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
    const successful = payments.filter(
      (p) => p.status === PaymentStatus.SUCCESS,
    );
    const successfulAmount = successful.reduce((s, p) => s + p.amount, 0);
    const failed = payments.filter((p) => p.status === PaymentStatus.FAILED);
    const refunded = payments.filter(
      (p) => p.status === PaymentStatus.REFUNDED,
    );
    const pending = payments.filter((p) => p.status === PaymentStatus.PENDING);
    return {
      count: total,
      totalAmount,
      successfulAmount,
      failedCount: failed.length,
      refundedCount: refunded.length,
      pendingCount: pending.length,
      rate:
        totalAmount > 0
          ? Math.round((successfulAmount / totalAmount) * 100)
          : 0,
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

  const hasFilters = !!(search || tab !== "all");

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="تتبع المدفوعات"
        description="سجل شامل لجميع العمليات المالية الواردة والمعلقة."
        icon={CreditCard}
        actions={
          <ActionButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
          >
            تحميل كشف الحساب
          </ActionButton>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي العمليات"
          value={stats.count.toLocaleString()}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="الناجحة"
          value={<CurrencyDisplay amount={stats.successfulAmount} />}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="فاشلة / مسترجعة"
          value={stats.failedCount + stats.refundedCount}
          icon={AlertTriangle}
          variant={
            stats.failedCount + stats.refundedCount > 0 ? "danger" : "default"
          }
        />
        <StatCard
          title="نسبة النجاح"
          value={`${stats.rate}%`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Toolbar: tabs + search + export + clear */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search + clear */}
        <FinanceListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="بحث برقم العملية أو العميل..."
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch("");
            setTab("all");
          }}
        />
      </div>

      {/* Data Table */}
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
              <CurrencyDisplay amount={p.amount} />
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                {getMethodIcon(p.method)}
                <span className="text-sm text-portal-note-text">
                  {p.method}
                </span>
              </div>
            </td>
            <td className="px-5 py-4">
              <FinanceStatusBadge status={p.status} />
            </td>
            <td className="px-5 py-4 text-left text-xs text-portal-note-text">
              {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
