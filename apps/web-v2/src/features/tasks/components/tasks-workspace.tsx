"use client";

import { useMemo, useState } from "react";
import { CheckSquare2Icon } from "lucide-react";
import { TaskDepartment, TaskPriority, TaskStatus } from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import {
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  type TaskDirectoryRecord,
  type TaskDirectoryDueFilter,
  type TaskDirectoryQueueFilter,
  type TaskDirectoryVisibilityFilter,
} from "@/features/tasks/lib/task-directory";
import { mapTaskIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import { useGetTasksIndexQuery } from "@/lib/api/admin-index-api";
import { useAppSelector } from "@/lib/store";

export function TasksWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<TaskDirectoryQueueFilter>("all");
  const [department, setDepartment] = useState<TaskDepartment | "all-departments">(
    "all-departments"
  );
  const [status, setStatus] = useState<TaskStatus | "all-statuses">(
    "all-statuses"
  );
  const [priority, setPriority] = useState<TaskPriority | "all-priorities">(
    "all-priorities"
  );
  const [due, setDue] = useState<TaskDirectoryDueFilter>("all-dates");
  const [visibility, setVisibility] =
    useState<TaskDirectoryVisibilityFilter>("all-visibility");

  const { data, error, isError, isLoading, refetch } = useGetTasksIndexQuery(
    {
      search: search || undefined,
      status: status === "all-statuses" ? undefined : status,
      priority: priority === "all-priorities" ? undefined : priority,
      department: department === "all-departments" ? undefined : department,
      overdueOnly: due === "overdue" ? "true" : undefined,
      limit: 100,
    },
    { skip: authStatus !== "authenticated" },
  );

  const rows = useMemo<TaskDirectoryRecord[]>(() => {
    const items = (data?.items ?? []).map(mapTaskIndexItem);

    return items
      .filter((row: TaskDirectoryRecord) => {
        if (queue === "attention") {
          return ["destructive", "attention", "warning"].includes(row.signalTone);
        }
        if (queue === "in-review") {
          return row.status === TaskStatus.IN_REVIEW;
        }
        if (queue === "unassigned") {
          return !row.assigneeName;
        }
        return true;
      })
      .filter((row: TaskDirectoryRecord) => {
        if (due === "today") return row.dueOffsetDays === 0;
        if (due === "next-7-days") {
          return row.dueOffsetDays >= 0 && row.dueOffsetDays <= 7;
        }
        return true;
      })
      .filter((row: TaskDirectoryRecord) => {
        if (visibility === "client-visible") return row.isClientVisible;
        if (visibility === "internal-only") return !row.isClientVisible;
        return true;
      });
  }, [data?.items, due, queue, visibility]);

  return (
    <PageScaffold
      title="Tasks"
      description="Organization-wide task queue for reassignment, delivery exceptions, and workflow intervention across every active project."
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task, project, client, assignee, or period"
            aria-label="Search tasks"
            className="sm:w-80"
          />

          <ToggleGroup
            value={[queue]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "attention" ||
                nextValue === "in-review" ||
                nextValue === "unassigned"
              ) {
                setQueue(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="attention">Needs attention</ToggleGroupItem>
            <ToggleGroupItem value="in-review">In review</ToggleGroupItem>
            <ToggleGroupItem value="unassigned">Unassigned</ToggleGroupItem>
          </ToggleGroup>

          <Select<string>
            value={department}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-departments" ||
                Object.values(TaskDepartment).includes(value as TaskDepartment)
              ) {
                setDepartment(value as TaskDepartment | "all-departments");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter tasks by department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-departments">All departments</SelectItem>
                {Object.values(TaskDepartment).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatTaskDepartment(value)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={status}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-statuses" ||
                Object.values(TaskStatus).includes(value as TaskStatus)
              ) {
                setStatus(value as TaskStatus | "all-statuses");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter tasks by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-statuses">All statuses</SelectItem>
                {Object.values(TaskStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatTaskStatus(value)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={priority}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-priorities" ||
                Object.values(TaskPriority).includes(value as TaskPriority)
              ) {
                setPriority(value as TaskPriority | "all-priorities");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter tasks by priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-priorities">All priorities</SelectItem>
                {Object.values(TaskPriority).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatTaskPriority(value)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={due}
            onValueChange={(value) => {
              if (
                value === "all-dates" ||
                value === "overdue" ||
                value === "today" ||
                value === "next-7-days"
              ) {
                setDue(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter tasks by due date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-dates">All due dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due today</SelectItem>
                <SelectItem value="next-7-days">Next 7 days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={visibility}
            onValueChange={(value) => {
              if (
                value === "all-visibility" ||
                value === "client-visible" ||
                value === "internal-only"
              ) {
                setVisibility(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter tasks by client visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-visibility">All visibility</SelectItem>
                <SelectItem value="client-visible">Client visible</SelectItem>
                <SelectItem value="internal-only">Internal only</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Task queue</CardTitle>
          <CardDescription>
            Every row shows the workflow state, due risk, project period, and
            intervention signal that matters before opening task detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle="Loading tasks"
              loadingDescription="Retrieving the latest task queue from the admin API."
            />
          ) : isError && !data ? (
            <WorkspaceQueryState
              kind="error"
              error={error}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckSquare2Icon />
                </EmptyMedia>
                <EmptyTitle>No tasks match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the queue, department, due date, or visibility filters to inspect another operational segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <TasksTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
