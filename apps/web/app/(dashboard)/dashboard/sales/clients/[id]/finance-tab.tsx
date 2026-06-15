"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/design-system/Pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { InvoiceStatus } from "@hassad/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, CreditCard, FileText, AlertCircle } from "lucide-react";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DUE]: "مستحقة",
  [InvoiceStatus.SENT]: "مرسلة",
  [InvoiceStatus.PAID]: "مدفوعة",
  [InvoiceStatus.PARTIAL]: "مدفوعة جزئياً",
  [InvoiceStatus.PENDING]: "معلقة",
  [InvoiceStatus.LATE]: "متأخرة",
  [InvoiceStatus.CANCELLED]: "ملغية",
};

const STATUS_TONE: Record<
  InvoiceStatus,
  import("@/components/design-system/Pill").PillTone
> = {
  [InvoiceStatus.DUE]: "warning",
  [InvoiceStatus.SENT]: "blue",
  [InvoiceStatus.PAID]: "success",
  [InvoiceStatus.PARTIAL]: "warning",
  [InvoiceStatus.PENDING]: "neutral",
  [InvoiceStatus.LATE]: "danger",
  [InvoiceStatus.CANCELLED]: "neutral",
};

interface FinanceTabProps {
  clientId: string;
}

export function FinanceTab({ clientId }: FinanceTabProps) {
  const { data, isLoading, isError } = useGetInvoicesQuery({ clientId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-neutral-300 text-center py-8">
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

  if (data.items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
        <p className="text-neutral-300">لا توجد فواتير لهذا العميل</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-300">
              إجمالي الفواتير
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalInvoiced)}
            </p>
            <p className="text-xs text-neutral-300 mt-1">
              {data.items.length} فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-300">
              المدفوع
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-300">
              فواتير معلقة
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-300">
              فواتير متأخرة
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <div className="rounded-[30px] border-[1.5px] border-portal-card-border overflow-hidden">
        <Table>
          <TableHeader className="[tr]:border-b-[1.5px] [tr]:border-portal-divider">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
                رقم الفاتورة
              </TableHead>
              <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
                المبلغ
              </TableHead>
              <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
                الحالة
              </TableHead>
              <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
                تاريخ الإصدار
              </TableHead>
              <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
                تاريخ الاستحقاق
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#f0f2f5] [&_tr:hover]:bg-black/[0.03]">
            {data.items.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="border-b-[1.5px] border-portal-divider hover:bg-transparent text-right"
              >
                <TableCell className="px-5 py-4 font-medium font-mono" dir="ltr">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell className="px-5 py-4">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Pill
                    tone={STATUS_TONE[invoice.status] ?? "neutral"}
                    className="text-xs h-6 px-2"
                  >
                    {STATUS_LABELS[invoice.status] ?? invoice.status}
                  </Pill>
                </TableCell>
                <TableCell className="px-5 py-4">
                  {formatDate(invoice.issueDate)}
                </TableCell>
                <TableCell className="px-5 py-4">
                  {formatDate(invoice.dueDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
