"use client";

import { useState } from "react";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { Select, SelectItem } from "@/components/design-system/Select";
import { StatCard } from "@/components/design-system/StatCard";
import { EmployeeTaskKanban } from "@/components/dashboard/employee/EmployeeTaskKanban";
import { EmptyState } from "@/components/common/EmptyState";
import { ClipboardList } from "lucide-react";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useAppSelector } from "@/lib/hooks";
import { TaskPriority } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );

  const { data: stats, isLoading: statsLoading } = useGetMyTaskStatsQuery();
  const { data: tasks, isLoading: tasksLoading } = useGetMyTasksQuery(
    {
      priority: priorityFilter === "all" ? undefined : priorityFilter,
    },
    { pollingInterval: 30000 },
  );

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">
        لوحة الموظف التنفيذي
      </h1>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DSSkeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="إجمالي المهام" value={stats.total} />
          <StatCard title="قيد التنفيذ" value={stats.inProgress} />
          <StatCard title="متأخرة" value={stats.overdue} variant="danger" />
          <StatCard title="منجزة" value={stats.done} variant="success" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}
          placeholder="كل الأولويات"
          triggerClassName="w-44"
        >
          <SelectItem value="all">كل الأولويات</SelectItem>
          {Object.values(TaskPriority).map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Kanban board */}
      {!tasksLoading && (!tasks || tasks.length === 0) ? (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد مهام مسندة"
          description="لم يتم إسناد أي مهمة إليك بعد. سيتم عرض المهام هنا عند إسنادها."
        />
      ) : (
        <EmployeeTaskKanban tasks={tasks ?? []} isLoading={tasksLoading} />
      )}
    </div>
  );
}
