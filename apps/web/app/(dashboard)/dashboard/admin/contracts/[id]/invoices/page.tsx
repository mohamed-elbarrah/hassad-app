"use client";

import { use } from "react";
import { Receipt, FileText } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminContractByIdQuery } from "@/features/admin/adminContractsApi";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-SA");
}

export default function ContractInvoicesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract } = useGetAdminContractByIdQuery(id);

  if (!contract) return null;

  if (!contract.invoices || contract.invoices.length === 0) {
    return (
      <AdminEmptyState
        icon={Receipt}
        title="لا توجد فواتير"
        description="لم يتم إصدار أي فواتير لهذا العقد بعد."
      />
    );
  }

  return (
    <SurfaceCard title={`الفواتير (${contract.invoices.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-portal-divider">
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                رقم الفاتورة
              </th>
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                المبلغ
              </th>
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                الحالة
              </th>
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                تاريخ الاستحقاق
              </th>
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                تاريخ الدفع
              </th>
              <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                تاريخ الإنشاء
              </th>
            </tr>
          </thead>
          <tbody>
            {contract.invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-portal-divider last:border-0"
              >
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-secondary-500 shrink-0" />
                    <span className="text-sm font-medium text-natural-100">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-sm text-natural-100">
                  {formatCurrency(invoice.amount)}
                </td>
                <td className="py-3 px-2 text-right">
                  <AdminStatusBadge domain="invoice" status={invoice.status} />
                </td>
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {formatDate(invoice.paidAt)}
                </td>
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {formatDate(invoice.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
