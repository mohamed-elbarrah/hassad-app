"use client";

import { useMemo, useState } from "react";
import { CheckSquare2Icon } from "lucide-react";
import { TaskDepartment, TaskPriority, TaskStatus } from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import { formatTaskDepartment, formatTaskPriority, formatTaskStatus } from "@/features/tasks/lib/task-directory";
import { mapTaskIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import { useGetPmTasksQuery } from "@/lib/api/pm-tasks-api";
import { useAppSelector } from "@/lib/store";

export function PmTasksWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all-statuses">("all-statuses");
  const [department, setDepartment] = useState<TaskDepartment | "all-departments">("all-departments");
  const [priority, setPriority] = useState<TaskPriority | "all-priorities">("all-priorities");
  const [queue, setQueue] = useState<"all" | "attention" | "in-review" | "unassigned">("all");

  const { data, error, isError, isLoading, refetch } = useGetPmTasksQuery(
    {
      search: search || undefined,
      status: status === "all-statuses" ? undefined : status,
      priority: priority === "all-priorities" ? undefined : priority,
      department: department === "all-departments" ? undefined : department,
      limit: 100,
    },
    { skip: authStatus !== "authenticated" },
  );

  const rows = useMemo(() => {
    return (data?.items ?? []).map(mapTaskIndexItem).filter((row) => {
      if (queue === "attention") return ["destructive", "attention", "warning"].includes(row.signalTone);
      if (queue === "in-review") return row.status === TaskStatus.IN_REVIEW;
      if (queue === "unassigned") return !row.assigneeName;
      return true;
    });
  }, [data?.items, queue]);

  return (
    <PageScaffold
      title="Tasks"
      description="PM task queue with table-first triage, workflow review, and ownership control."
      actions={
        <>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" className="sm:w-72" />
          <ToggleGroup value={[queue]} onValueChange={(value) => setQueue((value[0] as typeof queue) ?? "all")} variant="outline" size="sm">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="attention">Needs attention</ToggleGroupItem>
            <ToggleGroupItem value="in-review">In review</ToggleGroupItem>
            <ToggleGroupItem value="unassigned">Unassigned</ToggleGroupItem>
          </ToggleGroup>
          <Select<string> value={department} onValueChange={(value) => setDepartment(value as typeof department)}>
            <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-departments">All departments</SelectItem>
                {Object.values(TaskDepartment).map((value) => <SelectItem key={value} value={value}>{formatTaskDepartment(value)}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select<string> value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-statuses">All statuses</SelectItem>
                {Object.values(TaskStatus).map((value) => <SelectItem key={value} value={value}>{formatTaskStatus(value)}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select<string> value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
            <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-priorities">All priorities</SelectItem>
                {Object.values(TaskPriority).map((value) => <SelectItem key={value} value={value}>{formatTaskPriority(value)}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Task queue</CardTitle>
          <CardDescription>Table-first workspace for PM-owned delivery work.</CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState kind="loading" loadingTitle="Loading tasks" loadingDescription="Retrieving PM tasks." />
          ) : isError && !data ? (
            <WorkspaceQueryState kind="error" error={error} onRetry={() => void refetch()} />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><CheckSquare2Icon /></EmptyMedia>
                <EmptyTitle>No tasks match these filters</EmptyTitle>
                <EmptyDescription>Adjust search or filters to inspect another task segment.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <TasksTable rows={rows} hrefBase="/pm/tasks" />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
