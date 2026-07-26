"use client";

import { useState, useMemo } from "react";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { TeamTaskKanban } from "@/components/dashboard/team/TeamTaskKanban";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ClipboardList } from "lucide-react";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useAppSelector } from "@/lib/hooks";
import { TaskPriority } from "@hassad/shared";
import { TASK_PRIORITY_LABELS } from "@/lib/utils/task-status";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    priority: [],
  });

  const { data: stats, isLoading: statsLoading } = useGetMyTaskStatsQuery();
  const { data: tasks, isLoading: tasksLoading } = useGetMyTasksQuery(
    {},
    { pollingInterval: 30000 },
  );

  // Derive priority counts from tasks for the filter bar
  const filterGroups: FilterGroup[] = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(TaskPriority).forEach((p) => counts.set(p, 0));
    (tasks ?? []).forEach((t) => {
      counts.set(t.priority, (counts.get(t.priority) ?? 0) + 1);
    });

    return [
      {
        key: "priority",
        label: "الأولوية",
        options: Object.values(TaskPriority).map((p) => ({
          label: TASK_PRIORITY_LABELS[p],
          value: p,
          count: counts.get(p) ?? 0,
        })),
      },
    ];
  }, [tasks]);

  // Client-side priority filtering
  const filteredTasks = useMemo(() => {
    let result = [...(tasks ?? [])];
    const priorityFilters = activeFilters.priority ?? [];
    if (priorityFilters.length > 0) {
      result = result.filter((t) => priorityFilters.includes(t.priority));
    }
    return result;
  }, [tasks, activeFilters]);

  if (!user) return null;

  return (
    <div className="page-shell">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">قائمة المهام</h1>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DSSkeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="إجمالي المهام" value={stats.total} />
          <MetricCard title="قيد التنفيذ" value={stats.inProgress} />
          <MetricCard title="متأخرة" value={stats.overdue} variant="danger" />
          <MetricCard title="منجزة" value={stats.done} variant="success" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={(key, values) =>
            setActiveFilters((prev) => ({ ...prev, [key]: values }))
          }
        />
      </div>

      {/* Kanban board */}
      {!tasksLoading && filteredTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد مهام مسندة"
          description={
            (activeFilters.priority ?? []).length > 0
              ? "لا توجد مهام مطابقة للفلتر المحدد."
              : "لم يتم إسناد أي مهمة إليك بعد. سيتم عرض المهام هنا عند إسنادها."
          }
        />
      ) : (
        <TeamTaskKanban tasks={filteredTasks} isLoading={tasksLoading} />
      )}
    </div>
  );
}
