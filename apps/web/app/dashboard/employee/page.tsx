"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/dashboard/employee/StatsCard";
import { EmployeeTaskKanban } from "@/components/dashboard/employee/EmployeeTaskKanban";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useAppSelector } from "@/lib/hooks";
import { TaskPriority, UserRole } from "@hassad/shared";

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
  const [showArchived, setShowArchived] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetMyTaskStatsQuery();
  const { data: tasks, isLoading: tasksLoading } = useGetMyTasksQuery({
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    archived: showArchived || undefined,
  });

  if (!user) return null;

  // Marketing users get a "coming soon" stub
  if (user.role === UserRole.MARKETING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <h2 className="text-xl font-semibold">قريبًا</h2>
        <p className="text-muted-foreground text-sm">
          لوحة تحكم التسويق قيد التطوير وستكون متاحة قريبًا.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">لوحتي</h1>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="إجمالي المهام" value={stats.total} />
          <StatsCard
            label="قيد التنفيذ"
            value={stats.inProgress}
            variant="default"
          />
          <StatsCard
            label="متأخرة"
            value={stats.overdue}
            variant="destructive"
          />
          <StatsCard label="منجزة" value={stats.done} variant="success" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الأولويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            {Object.values(TaskPriority).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            id="show-archived"
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="cursor-pointer"
          />
          <Label htmlFor="show-archived" className="text-sm cursor-pointer">
            عرض المؤرشف
          </Label>
        </div>
      </div>

      {/* Kanban board */}
      <EmployeeTaskKanban tasks={tasks ?? []} isLoading={tasksLoading} />
    </div>
  );
}
