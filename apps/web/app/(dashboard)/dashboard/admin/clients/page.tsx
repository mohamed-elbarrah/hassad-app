"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, UserPlus } from "lucide-react";
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
import {
  useGetAdminClientUsersQuery,
  type ClientUserItem,
} from "@/features/admin/adminClientsApi";
import { cn } from "@/lib/utils";

type SegmentTab = "all" | "new" | "active" | "stopped";

const SEGMENT_TABS: { key: SegmentTab; label: string }[] = [
  { key: "all", label: "كل العملاء" },
  { key: "new", label: "جدد" },
  { key: "active", label: "نشطون" },
  { key: "stopped", label: "موقوفون" },
];

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
  const [segment, setSegment] = useState<SegmentTab>("all");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const segmentParam = segment === "all" ? undefined : segment;
  const statusFilter = activeFilters.status?.[0];

  const { data, isLoading, isError } = useGetAdminClientUsersQuery({
    search: search || undefined,
    segment: segmentParam as "new" | "active" | "stopped" | undefined,
    status: statusFilter,
    page,
    limit: 20,
  });

  const clients = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    return { total };
  }, [data]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العملاء"
        description="إدارة حسابات العملاء: متابعة النشاط والمشاريع والفواتير"
        icon={Building2}
        actions={
          <ActionButton variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            إضافة عميل
          </ActionButton>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          { label: "جدد", value: clients.filter((c) => c.activeProjects === 0 && c.status !== "STOPPED").length, className: "bg-blue-100/50 border-blue-200 text-blue-600" },
          { label: "نشطون", value: clients.filter((c) => c.activeProjects > 0).length, className: "bg-success-100/50 border-success-200 text-success-600" },
          { label: "موقوفون", value: clients.filter((c) => c.status === "STOPPED").length, className: "bg-danger-100/50 border-danger-200 text-danger-600" },
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

      {/* Segment tabs */}
      <div className="flex gap-1 bg-portal-divider/30 rounded-xl p-1 w-fit">
        {SEGMENT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setSegment(tab.key); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              segment === tab.key
                ? "bg-white text-natural-100 shadow-sm"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SurfaceCard title="قائمة العملاء">
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
                  { label: "عميل محتمل", value: "LEAD" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "موقوف", value: "STOPPED" },
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
      </SurfaceCard>
    </div>
  );
}
