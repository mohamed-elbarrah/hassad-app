"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Download,
  MoreHorizontal,
  FileText,
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
          <ActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
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

        <DataTable
          columns={[
            { id: "number", label: "رقم الفاتورة", width: "150px" },
            { id: "client", label: "العميل" },
            { id: "contract", label: "العقد" },
            { id: "amount", label: "المبلغ الإجمالي" },
            { id: "paid", label: "المدفوع" },
            { id: "status", label: "الحالة" },
            { id: "due", label: "تاريخ الاستحقاق" },
            { id: "actions", label: "الإجراءات", align: "left" },
          ]}
          data={invoices}
          isLoading={isLoading}
          isError={false}
          emptyState={{
            icon: FileText,
            message: "لا توجد فواتير حالياً",
            hint: "قم بإنشاء فاتورة جديدة لتبدأ.",
          }}
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
                <td className="px-5 py-4 text-neutral-400">
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
                <td className="px-5 py-4 text-neutral-400 text-sm">
                  {new Date(invoice.dueDate).toLocaleDateString("ar-SA-u-nu-latn")}
                </td>
                <td className="px-5 py-4 text-left">
                  <div className="flex items-center justify-end gap-2">
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
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8"
                        >
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
      </div>
    </div>
  );
}
