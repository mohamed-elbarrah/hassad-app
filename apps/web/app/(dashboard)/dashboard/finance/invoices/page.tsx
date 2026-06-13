"use client";

import { useState, useMemo } from "react";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { InvoiceToolbar } from "@/components/dashboard/finance/InvoiceToolbar";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import {
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  FileText,
  Search,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StatusFilter } from "@/components/dashboard/finance/InvoiceToolbar";
import Link from "next/link";

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

  // Stats computed from ALL loaded invoices on this page (backend paginated)
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
    const totalPaid = invoices.reduce(
      (s, inv) =>
        s +
        ((inv as any).payments?.reduce((p: number, x: any) => p + x.amount, 0) ||
          0),
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

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفواتير</h1>
          <p className="text-neutral-400 mt-1">
            عرض وإدارة فواتير العملاء وتحصيل المدفوعات.
          </p>
        </div>
        <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>
          فاتورة جديدة
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
              <p className="text-xs text-neutral-400">إجمالي الفواتير</p>
              <p className="text-xl font-bold">{stats.count.toLocaleString()}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <DollarSign className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">المحصل</p>
              <p className="text-xl font-bold text-success-600">
                {stats.totalPaid.toLocaleString()} ر.س
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
              <p className="text-xs text-neutral-400">متأخرة</p>
              <p className="text-xl font-bold text-danger-600">
                {stats.overdueCount} ({stats.overdueAmount.toLocaleString()} ر.س)
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
              <p className="text-xs text-neutral-400">نسبة التحصيل</p>
              <p className="text-xl font-bold">{stats.rate}%</p>
            </div>
            <ProgressBar value={stats.rate} size="sm" className="w-20" />
          </div>
        </SurfaceCard>
      </div>

      {/* Toolbar — no card, flush with page */}
      <InvoiceToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        onExport={() => {
          // TODO: implement CSV export
          alert("سيتم تصدير البيانات قريباً");
        }}
      />

      {/* Data Table — standalone, not nested in card */}
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
              <td className="px-5 py-4 text-neutral-400 text-sm">
                {(invoice as any).contract?.title || "N/A"}
              </td>
              <td className="px-5 py-4 font-bold">
                {invoice.amount.toLocaleString()} ر.س
              </td>
              <td className="px-5 py-4 text-success-600 dark:text-success-400 font-medium">
                {paidAmount.toLocaleString()} ر.س
              </td>
              <td className="px-5 py-4">
                <FinanceStatusBadge status={invoice.status} />
              </td>
              <td className="px-5 py-4 text-neutral-400 text-sm text-left">
                {new Date(invoice.dueDate).toLocaleDateString("ar-SA-u-nu-latn")}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ActionButton variant="ghost" size="sm" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </ActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-right">
                      <DropdownMenuLabel>إجراءات الفاتورة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer flex justify-end">
                        تسجيل دفعة
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex justify-end">
                        تحميل PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex justify-end">
                        إرسال للعميل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-danger-500 flex justify-end">
                        إلغاء الفاتورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            عرض {(page - 1) * (data?.limit || 20) + 1}–
            {Math.min(page * (data?.limit || 20), total)} من {total} فاتورة
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
