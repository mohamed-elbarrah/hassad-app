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
import { useGetAdminTasksQuery } from "@/lib/api/admin-tasks-api";
import { useAppSelector } from "@/lib/store";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

export function TasksWorkspace() {
  const { locale, t } = useTranslations();
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

  const { data, error, isError, isLoading, refetch } = useGetAdminTasksQuery(
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
      title={t("tasks")}
      description={t("taskQueueDescription")}
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchTasks")}
            aria-label={t("searchTasksLabel")}
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
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="attention">{t("needsAttention")}</ToggleGroupItem>
            <ToggleGroupItem value="in-review">{t("stateAwaitingReview")}</ToggleGroupItem>
            <ToggleGroupItem value="unassigned">{t("noAssignee")}</ToggleGroupItem>
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
            <SelectTrigger size="sm" aria-label={t("department")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-departments">{t("allDepartments")}</SelectItem>
                {Object.values(TaskDepartment).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatTaskDepartment(value))}
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
            <SelectTrigger size="sm" aria-label={t("status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-statuses">{t("allStatuses")}</SelectItem>
                {Object.values(TaskStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatTaskStatus(value))}
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
            <SelectTrigger size="sm" aria-label={t("priority")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-priorities">{t("allPriorities")}</SelectItem>
                {Object.values(TaskPriority).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatTaskPriority(value))}
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
            <SelectTrigger size="sm" aria-label={t("due")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-dates">{t("allDueDates")}</SelectItem>
                <SelectItem value="overdue">{t("overdue")}</SelectItem>
                <SelectItem value="today">{t("dueToday")}</SelectItem>
                <SelectItem value="next-7-days">{t("next7Days")}</SelectItem>
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
            <SelectTrigger size="sm" aria-label={t("allVisibility")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-visibility">{t("allVisibility")}</SelectItem>
                <SelectItem value="client-visible">{t("clientVisible")}</SelectItem>
                <SelectItem value="internal-only">{t("internalOnly")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("taskQueue")}</CardTitle>
          <CardDescription>
            {t("taskQueueDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingTasks")}
              loadingDescription={t("loadingTasksDescription")}
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
                <EmptyTitle>{t("noTasks")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustTaskFilters")}
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
