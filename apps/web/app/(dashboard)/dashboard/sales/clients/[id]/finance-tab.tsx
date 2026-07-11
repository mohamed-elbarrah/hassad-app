"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { SalesStatusBadge } from "@/components/dashboard/sales/shared/SalesStatusBadge";
import { formatShortDate } from "@/lib/format";
import { InvoiceStatus } from "@hassad/shared";
import { DollarSign, CreditCard, FileText, AlertCircle } from "lucide-react";

interface FinanceTabProps {
  clientId: string;
}

export function FinanceTab({ clientId }: FinanceTabProps) {
  const { data, isLoading, isError, error } = useGetInvoicesQuery({
    clientId,
  });

  const isPermissionDenied = isError && (error as any)?.status === 403;

  if (isPermissionDenied) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-portal-note-text mx-auto mb-3" />
        <p className="text-portal-note-text">
          ليس لديك صلاحية لعرض البيانات المالية
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SurfaceCard key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-portal-bg rounded" />
            <div className="h-8 w-32 bg-portal-bg rounded mt-2" />
          </SurfaceCard>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-portal-note-text text-center py-8">
        تعذر تحميل البيانات المالية
      </p>
    );
  }

  const totalInvoiced = data.items.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = data.items
    .filter((inv) => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = data.items.filter(
    (inv) => inv.status === InvoiceStatus.LATE,
  ).length;
  const pendingCount = data.items.filter(
    (inv) =>
      inv.status === InvoiceStatus.SENT ||
      inv.status === InvoiceStatus.PARTIAL ||
      inv.status === InvoiceStatus.PENDING ||
      inv.status === InvoiceStatus.DUE,
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-portal-note-text">إجمالي الفواتير</p>
            <DollarSign className="h-4 w-4 text-portal-note-text" />
          </div>
          <p className="text-2xl font-bold text-natural-100 mt-1">
            <CurrencyDisplay amount={totalInvoiced} />
          </p>
          <p className="text-xs text-portal-note-text mt-1">
            {data.items.length} فاتورة
          </p>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-portal-note-text">المدفوع</p>
            <CreditCard className="h-4 w-4 text-success-600" />
          </div>
          <p className="text-2xl font-bold text-success-600 mt-1">
            <CurrencyDisplay amount={totalPaid} />
          </p>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-portal-note-text">فواتير معلقة</p>
            <FileText className="h-4 w-4 text-action-blue" />
          </div>
          <p className="text-2xl font-bold text-natural-100 mt-1">
            {pendingCount}
          </p>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-portal-note-text">فواتير متأخرة</p>
            <AlertCircle className="h-4 w-4 text-danger-600" />
          </div>
          <p className="text-2xl font-bold text-danger-600 mt-1">
            {overdueCount}
          </p>
        </SurfaceCard>
      </div>

      {/* Invoices Table */}
      <DataTable
        columns={[
          { id: "invoiceNumber", label: "رقم الفاتورة" },
          { id: "amount", label: "المبلغ" },
          { id: "status", label: "الحالة" },
          { id: "issueDate", label: "تاريخ الإصدار" },
          { id: "dueDate", label: "تاريخ الاستحقاق" },
        ]}
        data={data.items}
        isLoading={false}
        isError={false}
        skeletonRows={5}
        emptyState={{
          icon: FileText,
          message: "لا توجد فواتير لهذا العميل",
          hint: "سيظهر هنا الفواتير المرتبطة بالعميل عند إنشائها.",
        }}
        renderCells={(invoice) => [
          <td key="invoiceNumber" className="px-5 py-3.5 align-middle">
            <span className="text-sm font-mono text-natural-100" dir="ltr">
              {invoice.invoiceNumber}
            </span>
          </td>,
          <td key="amount" className="px-5 py-3.5 align-middle">
            <CurrencyDisplay
              amount={invoice.amount}
              size="sm"
              className="text-sm font-semibold text-natural-100"
            />
          </td>,
          <td key="status" className="px-5 py-3.5 align-middle">
            <SalesStatusBadge domain="invoice" status={invoice.status} />
          </td>,
          <td key="issueDate" className="px-5 py-3.5 align-middle">
            <span className="text-sm text-portal-note-text">
              {formatShortDate(invoice.issueDate)}
            </span>
          </td>,
          <td key="dueDate" className="px-5 py-3.5 align-middle">
            <span className="text-sm text-portal-note-text">
              {formatShortDate(invoice.dueDate)}
            </span>
          </td>,
        ]}
      />
    </div>
  );
}
