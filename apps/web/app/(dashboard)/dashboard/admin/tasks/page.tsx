"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, FileDown } from "lucide-react";
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
import { useGetAdminTasksQuery } from "@/features/admin/adminTasksApi";
import { cn } from "@/lib/utils";
import { TASK_STATUS_AR, TASK_PRIORITY_AR } from "@hassad/shared";

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "المهمة", align: "right" },
  { id: "project", label: "المشروع", align: "right" },
  { id: "assignee", label: "المسند إليه", align: "right" },
  { id: "department", label: "القسم", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "priority", label: "الأولوية", align: "right" },
  { id: "dueDate", label: "تاريخ الاستحقاق", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: CheckSquare,
  message: "لا يوجد مهام",
  hint: "لم يتم إضافة أي مهام بعد.",
};

function getPriorityVariant(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "bg-danger-100/50 border-danger-200 text-danger-600";
    case "HIGH":
      return "bg-warning-100/50 border-warning-200 text-warning-600";
    case "NORMAL":
      return "bg-success-100/50 border-success-200 text-success-600";
    case "LOW":
      return "bg-badge-gray-bg/50 border-badge-gray-border text-badge-gray-text";
    default:
      return "bg-badge-gray-bg/50 border-badge-gray-border text-badge-gray-text";
  }
}

export default function AdminTasksPage() {
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
    if (activeFilters.priority?.length) f.priority = activeFilters.priority[0];
    return f as any;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminTasksQuery(filters);

  const tasks = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const overdue = tasks.filter((t) => t.isOverdue).length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    return { total, overdue, inProgress };
  }, [data, tasks]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المهام"
        description="إدارة جميع مهام المنصة"
        icon={CheckSquare}
        actions={
          <ActionButton variant="primary" size="md">
            <FileDown className="h-4 w-4" />
            تصدير CSV
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          {
            label: "قيد التنفيذ",
            value: statCards.inProgress,
            className: "bg-success-100/50 border-success-200 text-success-600",
          },
          {
            label: "متأخرة",
            value: statCards.overdue,
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

      <SurfaceCard title="قائمة المهام">
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالعنوان أو المسؤول..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "قيد الانتظار", value: "TODO" },
                  { label: "قيد التنفيذ", value: "IN_PROGRESS" },
                  { label: "قيد المراجعة", value: "IN_REVIEW" },
                  { label: "مكتمل", value: "DONE" },
                  { label: "مراجعة", value: "REVISION" },
                ],
              },
              {
                key: "priority",
                label: "الأولوية",
                options: [
                  { label: "عاجل", value: "URGENT" },
                  { label: "عالي", value: "HIGH" },
                  { label: "عادي", value: "NORMAL" },
                  { label: "منخفض", value: "LOW" },
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
          data={tasks}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل المهام."
          emptyState={EMPTY_STATE}
          renderRow={(task) => (
            <tr
              key={task.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/tasks/${task.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {task.title}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {task.projectName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {task.assigneeName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {task.department || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="task" status={task.status} />
              </td>
              <td className="py-3 px-2 text-right">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border",
                    getPriorityVariant(task.priority),
                  )}
                >
                  {TASK_PRIORITY_AR[
                    task.priority as keyof typeof TASK_PRIORITY_AR
                  ] || task.priority}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-sm">
                <span
                  className={cn(
                    task.isOverdue && "text-danger-600 font-medium",
                  )}
                >
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                    : "—"}
                </span>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
