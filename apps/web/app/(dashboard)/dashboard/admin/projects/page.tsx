"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Download } from "lucide-react";
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
import { useGetAdminProjectsQuery } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "المشروع", align: "right" },
  { id: "client", label: "العميل", align: "right" },
  { id: "pm", label: "مدير المشروع", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "priority", label: "الأولوية", align: "right" },
  { id: "completion", label: "الإنجاز", align: "right" },
  { id: "dates", label: "المدة", align: "right" },
  { id: "value", label: "القيمة", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: FolderKanban,
  message: "لا توجد مشاريع",
  hint: "لم يتم إضافة أي مشاريع بعد.",
};

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminProjectsQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const projects = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    return { total, active, onHold, completed };
  }, [data, projects]);

  const cards = [
    { label: "الإجمالي", value: statCards.total, className: "" },
    {
      label: "نشط",
      value: statCards.active,
      className: "bg-success-100/50 border-success-200 text-success-600",
    },
    {
      label: "معلق",
      value: statCards.onHold,
      className: "bg-warning-100/50 border-warning-200 text-warning-600",
    },
    {
      label: "مكتمل",
      value: statCards.completed,
      className: "bg-info-100/50 border-info-200 text-info-600",
    },
  ];

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المشاريع"
        description="إدارة جميع المشاريع على المنصة"
        icon={FolderKanban}
        actions={
          <ActionButton variant="primary" size="md">
            <Plus className="h-4 w-4" />
            إضافة مشروع
          </ActionButton>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
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
        title="قائمة المشاريع"
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
            searchPlaceholder="بحث باسم المشروع أو العميل..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "تخطيط", value: "PLANNING" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "معلق", value: "ON_HOLD" },
                  { label: "بانتظار المراجعة", value: "AWAITING_REVIEW" },
                  { label: "مكتمل", value: "COMPLETED" },
                  { label: "ملغى", value: "CANCELLED" },
                ],
              },
              {
                key: "priority",
                label: "الأولوية",
                options: [
                  { label: "منخفض", value: "LOW" },
                  { label: "عادي", value: "NORMAL" },
                  { label: "عالي", value: "HIGH" },
                  { label: "عاجل", value: "URGENT" },
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
          data={projects}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل المشاريع."
          emptyState={EMPTY_STATE}
          renderRow={(project) => (
            <tr
              key={project.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/projects/${project.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {project.name}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {project.clientName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {project.pmName || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="project" status={project.status} />
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="task" status={project.priority} />
              </td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-portal-divider overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        project.completionPercentage >= 80
                          ? "bg-success-500"
                          : project.completionPercentage >= 40
                            ? "bg-secondary-500"
                            : "bg-warning-500",
                      )}
                      style={{ width: `${project.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-portal-note-text">
                    {project.completionPercentage}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString("ar-SA")
                  : "—"}
                {" - "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString("ar-SA")
                  : "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {project.totalValue.toLocaleString("ar-SA")} ر.س
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
