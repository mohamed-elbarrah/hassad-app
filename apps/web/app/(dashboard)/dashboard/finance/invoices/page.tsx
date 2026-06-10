"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetInvoicesQuery({ page });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <SurfaceCard
          className="border-none shadow-md"
          contentClassName="space-y-3"
        >
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </SurfaceCard>
      </div>
    );
  }

  const invoices = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفواتير</h1>
          <p className="text-neutral-300">
            عرض وإدارة فواتير العملاء وتحصيل المدفوعات.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
          >
            تصدير الكل
          </ActionButton>
          <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>
            فاتورة جديدة
          </ActionButton>
        </div>
      </div>

      <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
        <div className="px-5 py-4 border-b border-portal-divider">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <FormInputControl
                placeholder="البحث عن فاتورة أو عميل..."
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="outline"
                size="sm"
                icon={<Filter className="w-4 h-4" />}
              >
                تصفية
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[150px]">رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>العقد</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const paidAmount =
                  (invoice as any).payments?.reduce(
                    (sum: number, p: any) => sum + p.amount,
                    0,
                  ) || 0;

                return (
                  <TableRow
                    key={invoice.id}
                    className="group transition-colors"
                  >
                    <TableCell className="font-mono text-sm font-semibold">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.client?.companyName || "N/A"}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {(invoice as any).contract?.title || "N/A"}
                    </TableCell>
                    <TableCell className="font-bold">
                      {invoice.amount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell className="text-success-600 dark:text-success-400 font-medium">
                      {paidAmount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {new Date(invoice.dueDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/finance/invoices/${invoice.id}`}
                        >
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
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </ActionButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="text-right"
                          >
                            <DropdownMenuLabel>
                              إجراءات الفاتورة
                            </DropdownMenuLabel>
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
                    </TableCell>
                  </TableRow>
                );
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-neutral-300"
                  >
                    لا توجد فواتير حالياً.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
