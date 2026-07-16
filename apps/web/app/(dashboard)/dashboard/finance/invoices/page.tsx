"use client";

import { useState, useMemo } from "react";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";
import { FinanceListToolbar } from "@/components/dashboard/finance/shared/FinanceListToolbar";
import { DataTable } from "@/components/design-system/DataTable";
import { MetricCard } from "@/components/design-system/MetricCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Popover } from "@/components/design-system/Popover";
import { Pagination } from "@/components/design-system/Pagination";
import {
  Plus,
  Eye,
  MoreHorizontal,
  FileText,
  Search,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import type { StatusFilter } from "@/components/dashboard/finance/InvoiceToolbar";
import Link from "next/link";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data, isLoading } = useGetInvoicesQuery({
    page,
    status: status === "all" ? undefined : status,
  });

  const invoices = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.trim().toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.client?.companyName?.toLowerCase().includes(q) ||
        (inv as any).contract?.title?.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  // Stats computed from ALL loaded invoices on this page
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
    const totalPaid = invoices.reduce(
      (s, inv) =>
        s +
        ((inv as any).payments?.reduce(
          (p: number, x: any) => p + x.amount,
          0,
        ) || 0),
      0,
    );
    const overdue = invoices.filter((inv) => {
      const isDue = ["DUE", "SENT", "PARTIAL"].includes(inv.status);
      return isDue && new Date(inv.dueDate) < new Date();
    });
    const overdueAmount = overdue.reduce((s, inv) => s + inv.amount, 0);
    return {
      count: total,
      totalAmount,
      totalPaid,
      rate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
      overdueCount: overdue.length,
      overdueAmount,
    };
  }, [invoices, total]);

  const emptyState =
    search || status !== "all"
      ? {
          icon: Search,
          message: "لا توجد نتائج مطابقة",
          hint: "جرب تعديل البحث أو إلغاء الفلاتر لعرض المزيد.",
        }
      : {
          icon: FileText,
          message: "لا توجد فواتير حالياً",
          hint: "قم بإنشاء فاتورة جديدة لتبدأ.",
        };

  const hasFilters = !!(search || status !== "all");

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="إدارة الفواتير"
        description="عرض وإدارة فواتير العملاء وتحصيل المدفوعات."
        icon={FileText}
        actions={
          <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>
            فاتورة جديدة
          </ActionButton>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي الفواتير"
          value={stats.count.toLocaleString()}
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="المحصل"
          value={<CurrencyDisplay amount={stats.totalPaid} />}
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="متأخرة"
          value={`${stats.overdueCount} (${stats.overdueAmount.toLocaleString()} ر.س)`}
          icon={AlertTriangle}
          variant={stats.overdueCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="نسبة التحصيل"
          value={`${stats.rate}%`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Toolbar */}
      <FinanceListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="بحث برقم الفاتورة أو العميل..."
        hasFilters={hasFilters}
        onClearFilters={() => {
          setSearch("");
          setStatus("all");
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={[
          { id: "number", label: "رقم الفاتورة", width: "150px" },
          { id: "client", label: "العميل" },
          { id: "contract", label: "العقد" },
          { id: "amount", label: "المبلغ الإجمالي" },
          { id: "paid", label: "المدفوع" },
          { id: "status", label: "الحالة" },
          { id: "due", label: "تاريخ الاستحقاق", align: "left" },
          { id: "actions", label: "", width: "80px", align: "left" },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={false}
        emptyState={emptyState}
        renderRow={(invoice) => {
          const paidAmount =
            (invoice as any).payments?.reduce(
              (sum: number, p: any) => sum + p.amount,
              0,
            ) || 0;

          return (
            <tr className="border-b-[1.5px] border-portal-divider">
              <td className="px-5 py-4 font-mono text-sm font-semibold">
                {invoice.invoiceNumber}
              </td>
              <td className="px-5 py-4 font-medium">
                {invoice.client?.companyName || "N/A"}
              </td>
              <td className="px-5 py-4 text-portal-note-text text-sm">
                {(invoice as any).contract?.title || "N/A"}
              </td>
              <td className="px-5 py-4 font-bold">
                <CurrencyDisplay amount={invoice.amount} />
              </td>
              <td className="px-5 py-4 text-success-600 font-medium">
                <CurrencyDisplay amount={paidAmount} />
              </td>
              <td className="px-5 py-4">
                <FinanceStatusBadge status={invoice.status} />
              </td>
              <td className="px-5 py-4 text-portal-note-text text-sm text-left">
                {new Date(invoice.dueDate).toLocaleDateString(
                  "ar-SA-u-nu-latn",
                )}
              </td>
              <td className="px-5 py-4 text-left">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/dashboard/finance/invoices/${invoice.id}`}>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 hover:bg-secondary-500/10 hover:text-secondary-500"
                    >
                      <Eye className="w-4 h-4" />
                    </ActionButton>
                  </Link>
                  <Popover
                    trigger={
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </ActionButton>
                    }
                    align="end"
                    contentClassName="p-2 min-w-[180px]"
                  >
                    <div className="flex flex-col gap-1 text-right">
                      <p className="text-xs font-semibold text-portal-note-text px-3 py-1">
                        إجراءات الفاتورة
                      </p>
                      <div className="border-t border-portal-divider my-1" />
                      <button className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-badge-gray-bg transition-colors cursor-pointer">
                        تسجيل دفعة
                      </button>
                      <button className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-badge-gray-bg transition-colors cursor-pointer">
                        تحميل PDF
                      </button>
                      <button className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-badge-gray-bg transition-colors cursor-pointer">
                        إرسال للعميل
                      </button>
                      <div className="border-t border-portal-divider my-1" />
                      <button className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-danger-50 text-danger-500 transition-colors cursor-pointer">
                        إلغاء الفاتورة
                      </button>
                    </div>
                  </Popover>
                </div>
              </td>
            </tr>
          );
        }}
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
