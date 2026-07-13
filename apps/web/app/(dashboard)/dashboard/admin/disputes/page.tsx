"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Scale,
  MessageSquareWarning,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminDisputesQuery,
  useGetAdminDisputeStatsQuery,
} from "@/features/admin/adminDisputesApi";
import { cn } from "@/lib/utils";
import { DISPUTE_CATEGORY_AR, DISPUTE_PRIORITY_AR } from "@hassad/shared";

const COLUMNS: DataTableColumn[] = [
  { id: "ticketNumber", label: "رقم التذكرة", align: "right" },
  { id: "title", label: "العنوان", align: "right" },
  { id: "client", label: "العميل", align: "right" },
  { id: "project", label: "المشروع", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "priority", label: "الأولوية", align: "right" },
  { id: "pm", label: "مدير المشروع", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Scale,
  message: "لا يوجد نزاعات",
  hint: "لم يتم تسجيل أي نزاعات حتى الآن.",
};

const CATEGORY_OPTIONS = [
  { label: "تأخير", value: "DELAY" },
  { label: "جودة", value: "QUALITY" },
  { label: "تواصل", value: "COMMUNICATION" },
  { label: "ميزانية", value: "BUDGET" },
  { label: "نطاق العمل", value: "SCOPE" },
  { label: "تعامل", value: "ATTITUDE" },
  { label: "أخرى", value: "OTHER" },
];

const STATUS_OPTIONS = [
  { label: "بانتظار الموافقة", value: "PENDING_APPROVAL" },
  { label: "مرفوض", value: "REJECTED" },
  { label: "تمت الموافقة", value: "APPROVED" },
  { label: "قيد المعالجة", value: "IN_PROGRESS" },
  { label: "بانتظار تأكيد العميل", value: "PENDING_CLIENT" },
  { label: "تم التصعيد", value: "ESCALATED" },
  { label: "تم الحل", value: "RESOLVED" },
  { label: "مغلق", value: "CLOSED" },
];

const PRIORITY_OPTIONS = [
  { label: "منخفض", value: "LOW" },
  { label: "عادي", value: "NORMAL" },
  { label: "عالي", value: "HIGH" },
  { label: "عاجل", value: "URGENT" },
];

export default function AdminDisputesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filterStatus = activeFilters.status?.[0];
  const filterCategory = activeFilters.category?.[0];
  const filterPriority = activeFilters.priority?.[0];

  const { data, isLoading, isError } = useGetAdminDisputesQuery({
    status: filterStatus,
    category: filterCategory,
    priority: filterPriority,
    page,
    limit: 20,
  });

  const { data: stats, isLoading: statsLoading } =
    useGetAdminDisputeStatsQuery();

  const disputes = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "بانتظار الموافقة",
        value: stats.pendingApproval,
        icon: Clock,
        className: "bg-alert-100/50 border-alert-200 text-alert-600",
      },
      {
        label: "نشط",
        value: stats.active,
        icon: MessageSquareWarning,
        className: "bg-primary-100/50 border-primary-200 text-primary-600",
      },
      {
        label: "مصعّد",
        value: stats.escalated,
        icon: AlertTriangle,
        className: "bg-danger-100/50 border-danger-200 text-danger-600",
      },
      {
        label: "محلول",
        value: stats.resolved,
        icon: CheckCircle,
        className: "bg-success-100/50 border-success-200 text-success-600",
      },
      {
        label: "مغلق",
        value: stats.closed,
        icon: XCircle,
        className: "bg-neutral-100/50 border-neutral-200 text-neutral-600",
      },
    ];
  }, [stats]);

  const priorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-danger-100 text-danger-600 border-danger-200";
      case "HIGH":
        return "bg-alert-100 text-alert-600 border-alert-200";
      case "NORMAL":
        return "bg-primary-100 text-primary-600 border-primary-200";
      case "LOW":
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="النزاعات"
        description="إدارة نزاعات العملاء ومشاكل المشاريع"
        icon={Scale}
      />

      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="h-4 w-4" />
              <p className="text-sm text-portal-note-text">{card.label}</p>
            </div>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {statsLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard title="قائمة النزاعات" description={`${total} نزاع`}>
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="بحث برقم التذكرة أو العنوان..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: STATUS_OPTIONS,
              },
              {
                key: "category",
                label: "التصنيف",
                options: CATEGORY_OPTIONS,
              },
              {
                key: "priority",
                label: "الأولوية",
                options: PRIORITY_OPTIONS,
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
          data={disputes}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل النزاعات."
          emptyState={EMPTY_STATE}
          renderRow={(dispute) => (
            <tr
              key={dispute.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/disputes/${dispute.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  #{dispute.ticketNumber}
                </Link>
              </td>
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/disputes/${dispute.id}`}
                  className="hover:underline text-natural-100 font-medium text-sm"
                >
                  {dispute.title}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {dispute.client.companyName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {dispute.project.name}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="dispute" status={dispute.status} />
              </td>
              <td className="py-3 px-2 text-right">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    priorityBadgeClass(dispute.priority),
                  )}
                >
                  {DISPUTE_PRIORITY_AR[
                    dispute.priority as keyof typeof DISPUTE_PRIORITY_AR
                  ] || dispute.priority}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {dispute.pm.name}
              </td>
            </tr>
          )}
        />

        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-portal-note-text">إجمالي {total} نزاع</p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
