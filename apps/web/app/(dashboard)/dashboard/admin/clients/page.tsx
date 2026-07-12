"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  UserPlus,
  Download,
} from "lucide-react";
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
import { useGetAdminClientsQuery } from "@/features/admin/adminClientsApi";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "اسم العميل", align: "right" },
  { id: "company", label: "الشركة", align: "right" },
  { id: "email", label: "البريد الإلكتروني", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "portal", label: "البوابة", align: "right" },
  { id: "counts", label: "العقود / المشاريع", align: "right" },
  { id: "revenue", label: "الإيرادات", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Building2,
  message: "لا يوجد عملاء",
  hint: "لم يتم إضافة أي عملاء بعد.",
};

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
});

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminClientsQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const clients = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = clients.filter((c) => c.isActive).length;
    const inactive = clients.filter((c) => !c.isActive).length;
    return { total, active, inactive };
  }, [data, clients]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العملاء"
        description="إدارة جميع عملاء المنصة: متابعة العقود والمشاريع والفواتير"
        icon={Building2}
        actions={
          <ActionButton variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            إضافة عميل
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
            label: "موقوف",
            value: statCards.inactive,
            className: "bg-danger-100/50 border-danger-200 text-danger-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard
        title="قائمة العملاء"
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
            searchPlaceholder="بحث باسم العميل أو الشركة..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "نشط", value: "true" },
                  { label: "موقوف", value: "false" },
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
          data={clients}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العملاء."
          emptyState={EMPTY_STATE}
          renderRow={(client) => (
            <tr
              key={client.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/clients/${client.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {client.name}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.companyName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.email || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="client" status={client.status} />
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge
                  domain="client"
                  status={client.portalAccess ? "ACTIVE" : "STOPPED"}
                />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.contractsCount} / {client.projectsCount}
              </td>
              <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                {currencyFormatter.format(client.totalRevenue)}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
