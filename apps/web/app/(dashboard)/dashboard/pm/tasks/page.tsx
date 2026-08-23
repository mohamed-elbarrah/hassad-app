"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, Columns3, List, Table2 } from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { PmTasksKanban } from "@/components/dashboard/pm/PmTasksKanban";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { formatShortDate } from "@/lib/format";
import { pmErrorMessage } from "@/lib/i18n";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/utils/task-status";

export default function PMTasksPage() {
  const [status, setStatus] = useState<"ALL" | TaskStatus | "OVERDUE">("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(1);
  const { data: stats, isLoading: statsLoading } = useGetPmTaskStatsQuery();
  const {
    data: taskResponse,
    isLoading,
    isError,
    error,
  } = useGetPmTasksQuery({
    status: status !== "ALL" && status !== "OVERDUE" ? status : undefined,
    priority: priority !== "ALL" ? priority : undefined,
    overdue: status === "OVERDUE" ? true : undefined,
    page,
    limit: 100,
  });

  const tasks = taskResponse?.items ?? [];
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus =
          status === "ALL" ||
          (status === "OVERDUE"
            ? new Date(task.dueDate) < new Date() &&
              task.status !== TaskStatus.DONE
            : task.status === status);
        return (
          matchesStatus && (priority === "ALL" || task.priority === priority)
        );
      }),
    [tasks, status, priority],
  );

  const metrics = [
    { label: "إجمالي المهام", value: stats?.total ?? 0 },
    { label: "جارية", value: stats?.inProgress ?? 0 },
    { label: "بانتظار المراجعة", value: stats?.inReview ?? 0 },
    { label: "متأخرة", value: stats?.overdue ?? 0 },
  ];

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="مهام المشاريع"
        description="جميع المهام في مشاريعك، تابع تقدم الفريق ووافق على المراجعات."
        icon={List}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-sm text-muted-foreground">
                {metric.label}
              </span>
              <span className="text-2xl font-semibold">
                {statsLoading ? "-" : metric.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-col gap-3 border-b pb-6 lg:flex-row lg:items-center">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as "ALL" | TaskStatus | "OVERDUE");
            setPage(1);
          }}
        >
          <SelectTrigger className="lg:w-56" aria-label="تصفية حسب الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              <SelectItem value="OVERDUE">متأخرة</SelectItem>
              {Object.values(TaskStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {TASK_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(value) => {
            setPriority(value as "ALL" | TaskPriority);
            setPage(1);
          }}
        >
          <SelectTrigger className="lg:w-56" aria-label="تصفية حسب الأولوية">
            <SelectValue placeholder="كل الأولويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">كل الأولويات</SelectItem>
              {Object.values(TaskPriority).map((value) => (
                <SelectItem key={value} value={value}>
                  {TASK_PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Tabs
          value={view}
          onValueChange={(value) => {
            if (value === "table" || value === "kanban") setView(value);
          }}
          aria-label="طريقة عرض المهام"
          className="lg:mr-auto"
        >
          <TabsList>
            <TabsTrigger value="kanban">
              <Columns3 data-icon="inline-start" />
              كانبان
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 data-icon="inline-start" />
              جدول
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "kanban" ? (
        <PmTasksKanban
          tasks={filteredTasks}
          isLoading={isLoading}
          isError={isError}
        />
      ) : isLoading ? (
        <TaskSkeleton />
      ) : isError ? (
        <TaskEmpty
          title="تعذر تحميل المهام"
          description={pmErrorMessage(error)}
        />
      ) : filteredTasks.length === 0 ? (
        <TaskEmpty
          title="لا توجد مهام"
          description="لا توجد مهام مطابقة للفلتر المحدد."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <caption className="sr-only">قائمة مهام المشاريع</caption>
            <TableHeader>
              <TableRow>
                <TableHead>المهمة</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الاستحقاق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/pm/tasks/${task.id}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>{task.project?.name ?? "-"}</TableCell>
                  <TableCell>{task.assignee?.name ?? "-"}</TableCell>
                  <TableCell>
                    <PmStatusBadge domain="task" status={task.status} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.priority === TaskPriority.URGENT
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr">
                    {formatShortDate(task.dueDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {(taskResponse?.meta.totalPages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {taskResponse?.meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= (taskResponse?.meta.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
          >
            التالي
          </Button>
        </div>
      ) : null}
    </main>
  );
}

function TaskSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: 6 }).map((_, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardList aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
