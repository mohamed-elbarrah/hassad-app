"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Download } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminContractsQuery } from "@/features/admin/adminContractsApi";

const CONTRACT_TYPE_AR: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع ثابت",
  ONE_TIME_SERVICE: "خدمة لمرة واحدة",
};

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "العنوان", align: "right" },
  { id: "clientName", label: "العميل", align: "right" },
  { id: "type", label: "النوع", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "monthlyValue", label: "القيمة الشهرية", align: "right" },
  { id: "totalValue", label: "القيمة الإجمالية", align: "right" },
  { id: "startDate", label: "تاريخ البداية", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: FileText,
  message: "لا يوجد عقود",
  hint: "لم يتم إضافة أي عقود بعد.",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const statusFilter = activeFilters.status?.[0];
  const typeFilter = activeFilters.type?.[0];

  const { data, isLoading, isError } = useGetAdminContractsQuery({
    search: search || undefined,
    status: statusFilter,
    type: typeFilter,
    page,
    limit: 20,
  });

  const contracts = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = contracts.filter((c) => c.status === "ACTIVE").length;
    const draft = contracts.filter((c) => c.status === "DRAFT").length;
    return { total, active, draft };
  }, [data, contracts]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العقود"
        description="إدارة جميع عقود المنصة: العقود النشطة والمسودات"
        icon={FileText}
        actions={
          <ActionButton variant="primary" size="md">
            <Plus className="h-4 w-4" />
            إضافة عقد
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          {
            label: "نشط",
            value: statCards.active,
            className: "bg-success-100/50 border-success-200 text-success-600",
          },
          {
            label: "مسودة",
            value: statCards.draft,
            className: "bg-warning-100/50 border-warning-200 text-warning-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-[30px] border-[1.5px] border-portal-card-border p-5 ${card.className}`}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard
        title="قائمة العقود"
        action={
          <ActionButton variant="outline" size="sm">
            <Download className="h-4 w-4" />
            تصدير CSV
          </ActionButton>
        }
      >
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالعنوان أو اسم العميل..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "مسودة", value: "DRAFT" },
                  { label: "مرسل", value: "SENT" },
                  { label: "موقّع", value: "SIGNED" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "معلق", value: "ON_HOLD" },
                  { label: "مكتمل", value: "COMPLETED" },
                  { label: "منتهي", value: "EXPIRED" },
                  { label: "ملغي", value: "CANCELLED" },
                ],
              },
              {
                key: "type",
                label: "النوع",
                options: [
                  { label: "اشتراك شهري", value: "MONTHLY_RETAINER" },
                  { label: "مشروع ثابت", value: "FIXED_PROJECT" },
                  { label: "خدمة لمرة واحدة", value: "ONE_TIME_SERVICE" },
                ],
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
        </div>

        <DataTable
          columns={COLUMNS}
          data={contracts}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العقود."
          emptyState={EMPTY_STATE}
          renderRow={(contract) => (
            <tr
              key={contract.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/contracts/${contract.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {contract.title}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {contract.clientName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {CONTRACT_TYPE_AR[contract.type] || contract.type}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="contract" status={contract.status} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {contract.monthlyValue > 0
                  ? formatCurrency(contract.monthlyValue)
                  : "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {formatCurrency(contract.totalValue)}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {contract.startDate
                  ? new Date(contract.startDate).toLocaleDateString("ar-SA")
                  : "—"}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
