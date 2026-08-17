"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarClockIcon, CheckCircle2Icon, ClipboardListIcon, RotateCcwIcon } from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";

import { GroupedKanbanBoard, type KanbanLane } from "@/components/patterns/grouped-kanban-board";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSelector } from "@/lib/store";
import { useGetTeamOverviewQuery, useUpdateTeamTaskStatusMutation, type TeamTaskCard } from "@/lib/api/team-tasks-api";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { formatTaskPriority, formatTaskStatus, getTaskPriorityTone, getTaskStatusTone } from "@/features/tasks/lib/task-directory";

const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.REVISION, TaskStatus.DONE];

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export function TeamOverviewWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [updateStatus] = useUpdateTeamTaskStatusMutation();
  const { data, error, isError, isLoading, refetch } = useGetTeamOverviewQuery(
    { search: search || undefined, priority: priority === "all" ? undefined : priority },
    { skip: authStatus !== "authenticated" },
  );

  const lanes = useMemo<KanbanLane<TeamTaskCard>[]>(() => statusOrder.map((status) => ({
    id: status,
    title: formatTaskStatus(status),
    tone: getTaskStatusTone(status),
    sections: [{
      id: status,
      title: "Tasks",
      tone: getTaskStatusTone(status),
      items: data?.kanban?.[status] ?? [],
      emptyLabel: "No tasks in this stage.",
    }],
  })), [data?.kanban]);

  return (
    <PageScaffold
      title="My Work"
      description="Your assigned work, delivery deadlines, and review actions in one workspace."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my tasks" aria-label="Search my tasks" className="sm:w-64" />
          <Select<string> value={priority} onValueChange={(value) => setPriority((value ?? "all") as typeof priority)}>
            <SelectTrigger size="sm" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="all">All priorities</SelectItem>
              {Object.values(TaskPriority).map((value) => <SelectItem key={value} value={value}>{formatTaskPriority(value)}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </div>
      }
    >
      {authStatus !== "authenticated" || (isLoading && !data) ? (
        <WorkspaceQueryState kind="loading" loadingTitle="Loading your work" loadingDescription="Retrieving assigned tasks." />
      ) : isError && !data ? (
        <WorkspaceQueryState kind="error" error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={<ClipboardListIcon />} label="Assigned tasks" value={data?.summary.total ?? 0} />
            <SummaryCard icon={<CalendarClockIcon />} label="Overdue" value={data?.summary.overdue ?? 0} tone="destructive" />
            <SummaryCard icon={<RotateCcwIcon />} label="Needs revision" value={data?.summary.revision ?? 0} tone="warning" />
            <SummaryCard icon={<CheckCircle2Icon />} label="In review" value={data?.summary.inReview ?? 0} tone="active" />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Task board</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupedKanbanBoard
                lanes={lanes}
                renderCard={(task) => <TeamTaskCardView task={task} />}
                onMoveItem={async ({ itemId, toSectionId }) => {
                  try {
                    await updateStatus({ taskId: itemId, status: toSectionId as TaskStatus }).unwrap();
                    showCrmActionToast({ type: "success", title: "Task status updated", description: "The task moved to its new workflow stage." });
                  } catch (mutationError) {
                    showApiErrorToast(mutationError);
                    throw mutationError;
                  }
                }}
                emptyState={<StateBlock title="No assigned tasks" description="Assigned tasks will appear here when a PM gives you work." />}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </PageScaffold>
  );
}

function SummaryCard({ icon, label, value, tone = "neutral" }: { icon: ReactNode; label: string; value: number; tone?: "neutral" | "destructive" | "warning" | "active" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="flex items-center gap-2"><strong className="text-2xl tabular-nums">{value}</strong><StatusBadge tone={tone}>{label}</StatusBadge></div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamTaskCardView({ task }: { task: TeamTaskCard }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/team/tasks/${task.id}`} className="min-w-0 font-medium hover:underline">{task.title}</Link>
        <StatusBadge tone={getTaskPriorityTone(task.priority)}>{formatTaskPriority(task.priority)}</StatusBadge>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="truncate">{task.project?.name ?? "No project"}</span>
        <span className={task.isOverdue ? "text-destructive" : undefined}>Due {formatDueDate(task.dueDate)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {task.revisionCount > 0 ? <StatusBadge tone="warning">{task.revisionCount} revision{task.revisionCount === 1 ? "" : "s"}</StatusBadge> : <span />}
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/team/tasks/${task.id}`} />}>Open task</Button>
      </div>
    </div>
  );
}
