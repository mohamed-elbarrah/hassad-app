"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ListFilter,
  PlayCircle,
} from "lucide-react";
import { TaskPriority } from "@hassad/shared";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamTaskKanban } from "@/components/dashboard/team/TeamTaskKanban";
import { useGetTeamOverviewQuery } from "@/features/team/teamApi";
import { useAppSelector } from "@/lib/hooks";
import { TASK_PRIORITY_LABELS } from "@/lib/utils/task-status";
import { PageHeader } from "@/components/common/PageHeader";

export default function TeamDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const { data: overview, isLoading: tasksLoading } = useGetTeamOverviewQuery(
    { priority: priority === "ALL" ? undefined : priority, page: 1, limit: 25 },
    { pollingInterval: 30000 },
  );
  const stats = overview?.summary;
  const tasks = overview?.items;
  const statsLoading = tasksLoading;
  const priorityCounts = useMemo(
    () =>
      (tasks ?? []).reduce<Record<string, number>>((counts, task) => {
        counts[task.priority] = (counts[task.priority] || 0) + 1;
        return counts;
      }, {}),
    [tasks],
  );
  const filteredTasks = tasks ?? [];
  if (!user) return null;
  const metrics = [
    { label: "إجمالي المهام", value: stats?.total ?? 0, icon: ClipboardList },
    { label: "قيد التنفيذ", value: stats?.inProgress ?? 0, icon: PlayCircle },
    { label: "متأخرة", value: stats?.overdue ?? 0, icon: AlertTriangle },
    { label: "منجزة", value: stats?.done ?? 0, icon: CheckCircle2 },
  ];
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="قائمة المهام"
        description="تابع مهامك المسندة وحدّث حالتها من لوحة كانبان."
        icon={ClipboardList}
        actions={<div className="w-full sm:w-60">
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as "ALL" | TaskPriority)
              }
            >
              <SelectTrigger>
                <ListFilter data-icon="inline-start" />
                <SelectValue placeholder="كل الأولويات" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">كل الأولويات</SelectItem>
                  {Object.values(TaskPriority).map((value) => (
                    <SelectItem key={value} value={value}>
                      {TASK_PRIORITY_LABELS[value]} (
                      {priorityCounts[value] || 0})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))
          : metrics.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-2xl font-semibold">{item.value}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon />
                  </div>
                </CardContent>
              </Card>
            ))}
      </section>
      {!tasksLoading && filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>لا توجد مهام مسندة</EmptyTitle>
                <EmptyDescription>
                  {priority !== "ALL"
                    ? "لا توجد مهام مطابقة للأولوية المحددة."
                    : "لم يتم إسناد أي مهمة إليك بعد. ستظهر المهام هنا عند إسنادها."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <TeamTaskKanban
          tasks={filteredTasks}
          isLoading={tasksLoading}
          filters={{ priority: priority === "ALL" ? undefined : priority }}
        />
      )}
    </main>
  );
}
