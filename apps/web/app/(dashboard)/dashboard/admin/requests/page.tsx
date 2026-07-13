"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download } from "lucide-react";
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
import { useGetAdminRequestsQuery } from "@/features/admin/adminRequestsApi";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "clientName", label: "اسم العميل", align: "right" },
  { id: "assignee", label: "المسؤول", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "services", label: "الخدمات", align: "center" },
  { id: "age", label: "العمر (أيام)", align: "center" },
  { id: "createdAt", label: "تاريخ الطلب", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: ClipboardList,
  message: "لا يوجد طلبات",
  hint: "لم يتم تقديم أي طلبات بعد.",
};

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filters = useMemo(() => {
    const f: Record<string, string | number | undefined> = {
      search: search || undefined,
      page,
      limit: 20,
    };
    if (activeFilters.status?.length) f.status = activeFilters.status[0];
    return f as any;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminRequestsQuery(filters);

  const requests = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const pending = requests.filter((r) =>
      [
        "SUBMITTED",
        "QUALIFYING",
        "PROPOSAL_IN_PROGRESS",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "CONTRACT_PREPARATION",
        "CONTRACT_SENT",
      ].includes(r.status),
    ).length;
    const completed = requests.filter((r) =>
      ["SIGNED", "PROJECT_CREATED"].includes(r.status),
    ).length;
    return { total, pending, completed };
  }, [data, requests]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الطلبات"
        description="إدارة طلبات العملاء الجديدة وطلبات الخدمات"
        icon={ClipboardList}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          {
            label: "قيد التنفيذ",
            value: statCards.pending,
            className: "bg-amber-100/50 border-amber-200 text-amber-600",
          },
          {
            label: "مكتمل",
            value: statCards.completed,
            className: "bg-success-100/50 border-success-200 text-success-600",
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
        title="قائمة الطلبات"
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
            searchPlaceholder="بحث باسم العميل..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "مقدم", value: "SUBMITTED" },
                  { label: "قيد التأهيل", value: "QUALIFYING" },
                  { label: "إعداد العرض", value: "PROPOSAL_IN_PROGRESS" },
                  { label: "أرسل العرض", value: "PROPOSAL_SENT" },
                  { label: "تفاوض", value: "NEGOTIATION" },
                  { label: "إعداد العقد", value: "CONTRACT_PREPARATION" },
                  { label: "أرسل العقد", value: "CONTRACT_SENT" },
                  { label: "موقّع", value: "SIGNED" },
                  { label: "تم إنشاء المشروع", value: "PROJECT_CREATED" },
                  { label: "ملغي", value: "CANCELLED" },
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
          data={requests}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الطلبات."
          emptyState={EMPTY_STATE}
          renderRow={(request) => (
            <tr
              key={request.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/requests/${request.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {request.clientName}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {request.assigneeName || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="request" status={request.status} />
              </td>
              <td className="py-3 px-2 text-center text-sm text-portal-note-text">
                {request.servicesCount}
              </td>
              <td className="py-3 px-2 text-center text-sm text-portal-note-text">
                {request.ageDays}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(request.createdAt).toLocaleDateString("ar-SA")}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
