"use client";

import { use } from "react";
import { FileText } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "العقد", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "value", label: "القيمة", align: "right" },
  { id: "startDate", label: "تاريخ البداية", align: "right" },
  { id: "endDate", label: "تاريخ النهاية", align: "right" },
  { id: "createdAt", label: "تاريخ الإنشاء", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: FileText,
  message: "لا توجد عقود",
  hint: "لم يتم إضافة أي عقود لهذا العميل بعد.",
};

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
});

export default function ClientContractsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client } = useGetAdminClientByIdQuery(id);

  if (!client) return null;

  return (
    <SurfaceCard title="العقود">
      <DataTable
        columns={COLUMNS}
        data={client.contracts}
        isLoading={false}
        isError={false}
        emptyState={EMPTY_STATE}
        renderRow={(contract) => (
          <tr
            key={contract.id}
            className="border-b border-portal-divider last:border-0"
          >
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {contract.title}
            </td>
            <td className="py-3 px-2 text-right">
              <AdminStatusBadge domain="contract" status={contract.status} />
            </td>
            <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
              {currencyFormatter.format(contract.totalValue)}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {contract.startDate
                ? new Date(contract.startDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {contract.endDate
                ? new Date(contract.endDate).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="py-3 px-2 text-right text-sm text-portal-note-text">
              {new Date(contract.createdAt).toLocaleDateString("ar-SA")}
            </td>
          </tr>
        )}
      />
    </SurfaceCard>
  );
}
