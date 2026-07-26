"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, UserPlus, Handshake } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminClientUsersQuery,
  useGetAdminClientStatsQuery,
  type ClientUserItem,
} from "@/features/admin/adminClientsApi";
import { CreateClientModal } from "@/components/dashboard/crm/CreateClientDialog";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "اسم العميل", align: "right" },
  { id: "company", label: "الشركة", align: "right" },
  { id: "email", label: "البريد الإلكتروني", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "projects", label: "المشاريع", align: "right" },
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
  const [createOpen, setCreateOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string[]>
  >({});

  const statusFilter = activeFilters.status?.[0];

  const { data, isLoading, isError } = useGetAdminClientUsersQuery({
    search: search || undefined,
    status: statusFilter,
    page,
    limit: 20,
  });

  const { data: clientStats, isLoading: statsLoading } =
    useGetAdminClientStatsQuery();

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  function handleFilterChange(groupKey: string, values: string[]) {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    setPage(1);
  }

  function renderStatCards() {
    return [
      {
        label: "الإجمالي",
        value: clientStats?.total ?? (statsLoading ? "—" : 0),
        className: "",
      },
      {
        label: "عميل محتمل",
        value: clientStats?.lead ?? (statsLoading ? "—" : 0),
        className: "bg-alert-100/50 border-alert-200 text-alert-600",
      },
      {
        label: "نشط",
        value: clientStats?.active ?? (statsLoading ? "—" : 0),
        className: "bg-success-100/50 border-success-200 text-success-600",
      },
      {
        label: "موقوف",
        value: clientStats?.inactive ?? (statsLoading ? "—" : 0),
        className: "bg-danger-100/50 border-danger-200 text-danger-600",
      },
    ];
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="العملاء"
        description="إدارة العملاء والعملاء المحتملين"
        icon={Handshake}
        actions={
          <ActionButton
            variant="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            إضافة عميل
          </ActionButton>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {renderStatCards().map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard title="قائمة العملاء">
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="بحث باسم العميل أو الشركة..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "عميل محتمل", value: "LEAD" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "موقوف", value: "STOPPED" },
                ],
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </div>

        <DataTable
          columns={COLUMNS}
          data={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العملاء."
          emptyState={EMPTY_STATE}
          renderRow={(client: ClientUserItem) => (
            <tr
              key={client.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/clients/${client.clientId || client.id}`}
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
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.activeProjects}/{client.totalProjects}
              </td>
              <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                {currencyFormatter.format(client.totalPaid)}
              </td>
            </tr>
          )}
        />

        {!isLoading && !isError && totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>

      <CreateClientModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
