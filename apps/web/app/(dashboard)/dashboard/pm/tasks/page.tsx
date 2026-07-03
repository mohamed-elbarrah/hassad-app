"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { PageIntro } from "@/components/design-system/PageIntro";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { ClipboardList } from "lucide-react";
import { TaskStatus, TaskPriority } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Labels ──────────────────────────────────────────────────────────────────

const PRIORITY_PILL_TONE: Record<string, import("@/components/design-system/Pill").PillTone> = {
  [TaskPriority.LOW]: "neutral",
  [TaskPriority.NORMAL]: "neutral",
  [TaskPriority.HIGH]: "warning",
  [TaskPriority.URGENT]: "danger",
};

const PRIORITY_LABELS: Record<string, string> = {
  [TaskPriority.LOW]: "منخفضة",
  [TaskPriority.NORMAL]: "عادية",
  [TaskPriority.HIGH]: "عالية",
  [TaskPriority.URGENT]: "عاجلة",
};

// ── Table columns ────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "المهمة", align: "right" },
  { id: "project", label: "المشروع", align: "right" },
  { id: "assignee", label: "المسؤول", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "priority", label: "الأولوية", align: "right" },
  { id: "dueDate", label: "تاريخ الاستحقاق", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: ClipboardList,
  message: "لا توجد مهام",
  hint: "لا توجد مهام مطابقة للفلتر المحدد.",
};

// ── Stat card tones ──────────────────────────────────────────────────────────

const STAT_TONES = [
  { key: "total", label: "إجمالي المهام", bg: "bg-action-blue-soft", border: "border-action-blue/30", text: "text-action-blue" },
  { key: "inProgress", label: "جارية", bg: "bg-success-100/50", border: "border-success-200", text: "text-success-600" },
  { key: "inReview", label: "بانتظار المراجعة", bg: "bg-alert-100/50", border: "border-alert-200", text: "text-alert-600" },
  { key: "overdue", label: "متأخرة", bg: "bg-danger-100/50", border: "border-danger-200", text: "text-danger-600" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PMTasksPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
    priority: [],
  });

  const { data: stats, isLoading: statsLoading } = useGetPmTaskStatsQuery();
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError,
  } = useGetPmTasksQuery({});

  const overdueCount = useMemo(() => {
    const now = new Date();
    return tasks.filter(
      (t) => new Date(t.dueDate) < now && t.status !== TaskStatus.DONE,
    ).length;
  }, [tasks]);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "status",
        label: "الحالة",
        options: [
          { label: "قيد المراجعة", value: TaskStatus.IN_REVIEW, count: stats?.inReview },
          { label: "جارية", value: TaskStatus.IN_PROGRESS, count: stats?.inProgress },
          { label: "للتنفيذ", value: TaskStatus.TODO, count: stats?.todo },
          { label: "تعديل", value: TaskStatus.REVISION },
          { label: "منجزة", value: TaskStatus.DONE, count: stats?.done },
          { label: "متأخرة", value: "OVERDUE", count: overdueCount },
        ],
      },
      {
        key: "priority",
        label: "الأولوية",
        options: [
          { label: "عاجلة", value: TaskPriority.URGENT },
          { label: "عالية", value: TaskPriority.HIGH },
          { label: "عادية", value: TaskPriority.NORMAL },
          { label: "منخفضة", value: TaskPriority.LOW },
        ],
      },
    ],
    [stats, overdueCount],
  );

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    const statusFilters = activeFilters.status ?? [];
    if (statusFilters.length > 0) {
      if (statusFilters.includes("OVERDUE")) {
        const now = new Date();
        const nonOverdueStatuses = statusFilters.filter((s) => s !== "OVERDUE");
        result = result.filter((t) => {
          const matchesOverdue = new Date(t.dueDate) < now && t.status !== TaskStatus.DONE;
          const matchesStatus = nonOverdueStatuses.length > 0 && nonOverdueStatuses.includes(t.status);
          if (statusFilters.includes("OVERDUE") && nonOverdueStatuses.length === 0) {
            return matchesOverdue;
          }
          if (nonOverdueStatuses.length > 0 && statusFilters.includes("OVERDUE")) {
            return matchesOverdue || matchesStatus;
          }
          return matchesStatus;
        });
      } else {
        result = result.filter((t) => statusFilters.includes(t.status));
      }
    }

    // Priority filter
    const priorityFilters = activeFilters.priority ?? [];
    if (priorityFilters.length > 0) {
      result = result.filter((t) => priorityFilters.includes(t.priority));
    }

    return result;
  }, [tasks, activeFilters]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مهام المشاريع"
        description="جميع المهام في مشاريعك، تابع تقدم الفريق ووافق على المراجعات."
        icon={ClipboardList}
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_TONES.map((tone) => {
          const value =
            tone.key === "total"
              ? stats?.total ?? 0
              : tone.key === "inProgress"
                ? stats?.inProgress ?? 0
                : tone.key === "inReview"
                  ? stats?.inReview ?? 0
                  : stats?.overdue ?? 0;

          return (
            <div
              key={tone.key}
              className={cn(
                "rounded-[30px] border-[1.5px] p-5",
                tone.bg,
                tone.border,
              )}
            >
              <p className="text-sm text-portal-note-text">{tone.label}</p>
              <p className={cn("text-2xl font-semibold mt-2", tone.text)}>
                {statsLoading ? "—" : value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Task Table ───────────────────────────────────────────────────── */}
      <SurfaceCard
        title="قائمة المهام"
        action={<FilterBar groups={filterGroups} activeFilters={activeFilters} onFilterChange={(key, values) => setActiveFilters((prev) => ({ ...prev, [key]: values }))} />}
      >
        <DataTable
          columns={COLUMNS}
          data={filteredTasks}
          isLoading={tasksLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل المهام."
          emptyState={EMPTY_STATE}
          renderRow={(task) => (
            <tr key={task.id} className="border-b border-portal-divider last:border-0">
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/pm/tasks/${task.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {task.title}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {task.project?.name ?? "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {task.assignee?.name ?? "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <PmStatusBadge domain="task" status={task.status} />
              </td>
              <td className="py-3 px-2 text-right">
                <Pill
                  tone={PRIORITY_PILL_TONE[task.priority] ?? "neutral"}
                  className="text-xs h-6 px-2"
                >
                  {PRIORITY_LABELS[task.priority] ?? task.priority}
                </Pill>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text" dir="ltr">
                {formatShortDate(task.dueDate)}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
