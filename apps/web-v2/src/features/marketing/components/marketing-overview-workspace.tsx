"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { BarChart3Icon, FileCheck2Icon, MegaphoneIcon, RotateCcwIcon } from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { GroupedKanbanBoard, type KanbanLane } from "@/components/patterns/grouped-kanban-board";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StateBlock } from "@/components/patterns/state-block";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTaskPriority, formatTaskStatus, getTaskPriorityTone, getTaskStatusTone } from "@/features/tasks/lib/task-directory";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useAppSelector } from "@/lib/store";
import { useGetMarketingOverviewQuery, useUpdateMarketingTaskStatusMutation, type MarketingTaskCard } from "@/lib/api/marketing-workspace-api";

const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.REVISION, TaskStatus.DONE];
function due(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value)); }

export function MarketingOverviewWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState(""); const [priority, setPriority] = useState("all");
  const [updateStatus] = useUpdateMarketingTaskStatusMutation();
  const query = useGetMarketingOverviewQuery({ search: search || undefined, priority: priority === "all" ? undefined : priority }, { skip: authStatus !== "authenticated" });
  const lanes = useMemo<KanbanLane<MarketingTaskCard>[]>(() => statuses.map((status) => ({ id: status, title: formatTaskStatus(status), tone: getTaskStatusTone(status), sections: [{ id: status, title: "Tasks", tone: getTaskStatusTone(status), items: query.data?.kanban?.[status] ?? [], emptyLabel: "No tasks in this stage." }] })), [query.data?.kanban]);
  return <PageScaffold title="Marketing Work" description="Assigned marketing tasks, strategy approvals, and campaign readiness." actions={<div className="flex flex-wrap gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search marketing tasks" aria-label="Search marketing tasks" className="sm:w-64" /><Select<string> value={priority} onValueChange={(value) => setPriority(value ?? "all")}><SelectTrigger size="sm" aria-label="Filter by priority"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">All priorities</SelectItem>{Object.values(TaskPriority).map((item) => <SelectItem key={item} value={item}>{formatTaskPriority(item)}</SelectItem>)}</SelectGroup></SelectContent></Select></div>}>
    {authStatus !== "authenticated" || (query.isLoading && !query.data) ? <WorkspaceQueryState kind="loading" loadingTitle="Loading marketing work" /> : query.isError && !query.data ? <WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /> : <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary icon={<FileCheck2Icon />} label="Waiting for client" value={query.data?.summary.strategiesWaitingForClient ?? 0} tone="warning" /><Summary icon={<RotateCcwIcon />} label="Strategy revisions" value={query.data?.summary.strategiesNeedingRevision ?? 0} tone="destructive" /><Summary icon={<MegaphoneIcon />} label="Active campaigns" value={query.data?.summary.activeCampaigns ?? 0} tone="active" /><Summary icon={<BarChart3Icon />} label="Needs optimization" value={query.data?.summary.campaignsNeedingOptimization ?? 0} tone="warning" /></section>
      <Card><CardHeader><CardTitle>Marketing task board</CardTitle></CardHeader><CardContent><GroupedKanbanBoard lanes={lanes} renderCard={(task) => <MarketingTaskCardView task={task} />} onMoveItem={async ({ itemId, toSectionId }) => { try { await updateStatus({ taskId: itemId, status: toSectionId as TaskStatus }).unwrap(); showCrmActionToast({ type: "success", title: "Task status updated", description: "The marketing task moved to its new stage." }); } catch (error) { showApiErrorToast(error); throw error; } }} emptyState={<StateBlock title="No marketing tasks" description="Marketing tasks assigned to you will appear here." />} /></CardContent></Card>
      <section className="grid gap-4 md:grid-cols-2"><Link href="/marketing/strategies" className="block"><Card className="h-full hover:border-primary/50"><CardHeader><CardTitle>Marketing Strategies</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Review strategy submissions, client decisions, and revision requests.</CardContent></Card></Link><Link href="/marketing/campaigns" className="block"><Card className="h-full hover:border-primary/50"><CardHeader><CardTitle>Campaigns</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Manage approved campaigns and performance snapshots.</CardContent></Card></Link></section>
    </div>}
  </PageScaffold>;
}

function Summary({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: "warning" | "destructive" | "active" }) { return <Card><CardContent className="flex items-center gap-3 pt-6"><span className="text-muted-foreground">{icon}</span><div><p className="text-sm text-muted-foreground">{label}</p><div className="flex items-center gap-2"><strong className="text-2xl tabular-nums">{value}</strong><StatusBadge tone={tone}>{label}</StatusBadge></div></div></CardContent></Card>; }
function MarketingTaskCardView({ task }: { task: MarketingTaskCard }) { return <div className="flex flex-col gap-3"><div className="flex items-start justify-between gap-2"><Link href={`/marketing/tasks/${task.id}`} className="min-w-0 font-medium hover:underline">{task.title}</Link><StatusBadge tone={getTaskPriorityTone(task.priority)}>{formatTaskPriority(task.priority)}</StatusBadge></div><div className="flex flex-col gap-1 text-sm text-muted-foreground"><span className="truncate">{task.project?.name ?? "No project"}</span><span className={task.isOverdue ? "text-destructive" : undefined}>Due {due(task.dueDate)}</span></div><div className="flex items-center justify-between gap-2">{task.revisionCount > 0 ? <StatusBadge tone="warning">{task.revisionCount} revision{task.revisionCount === 1 ? "" : "s"}</StatusBadge> : <span />}{task.status !== TaskStatus.DONE ? <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/marketing/tasks/${task.id}`} />}>Open task</Button> : null}</div></div>; }
