"use client";

import { use } from "react";
import { Receipt } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";

const COLUMNS: DataTableColumn[] = [
  { id: "invoiceNumber", label: "رقم الفاتورة", align: "right" },
  { id: "amount", label: "المبلغ", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "dueDate", label: "تاريخ الاستحقاق", align: "right" },
  { id: "createdAt", label: "تاريخ الإنشاء", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Receipt,
  message: "لا توجد فواتير",
  hint: "لم يتم إضافة أي فواتير لهذا العميل بعد.",
};

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
});

export default function ClientInvoicesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client } = useGetAdminClientByIdQuery(id);

  if (!client) return null;

  return (
    <SurfaceCard title="الفواتير">
      <DataTable
        columns={COLUMNS}
        data={client.invoices}
        isLoading={false}
        isError={false}
        emptyState={EMPTY_STATE}
        renderRow={(invoice) => (
          <tr
            key={invoice.id}
            className="border-b border-portal-divider last:border-0"
          >
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {invoice.invoiceNumber}
            </td>
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {currencyFormatter.format(invoice.amount)}
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="invoice" status={invoice.status} />
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}
            </td>
          </tr>
        )}
      />
    </SurfaceCard>
  );
}
