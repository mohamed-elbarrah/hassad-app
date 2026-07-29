"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleAlert,
  Clock3,
  RefreshCw,
  Search,
  SquareCheckBig,
  TimerReset,
} from "lucide-react";
import { useGetAdminTasksQuery } from "@/features/admin/adminTasksApi";
import type { AdminTaskItem } from "@/features/admin/adminTasksApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TASK_PRIORITY_AR, TASK_STATUS_AR, TaskPriority, TaskStatus } from "@hassad/shared";
import { formatDateTime, formatNumber } from "@/lib/format";

function statusVariant(status: string) {
  switch (status) {
    case TaskStatus.DONE:
      return "secondary";
    case TaskStatus.REVISION:
      return "destructive";
    default:
      return "outline";
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case TaskPriority.URGENT:
      return "destructive";
    case TaskPriority.HIGH:
      return "secondary";
    default:
      return "outline";
  }
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px] max-w-5xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    {Array.from({ length: 8 }).map((_, cell) => (
                      <TableCell key={cell}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminTasksQuery({
    limit: 100,
  });

  const tasks = data?.items ?? [];

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = status === "ALL" ? true : task.status === status;
      const matchesPriority = priority === "ALL" ? true : task.priority === priority;
      const matchesOverdue = overdueOnly ? task.isOverdue : true;
      const matchesSearch = !query
        ? true
        : [task.title, task.projectName, task.assigneeName, task.department, task.status, task.priority, task.id]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesPriority && matchesOverdue && matchesSearch;
    });
  }, [tasks, search, status, priority, overdueOnly]);

  const metrics = useMemo(
    () => ({
      total: tasks.length,
      overdue: tasks.filter((task) => task.isOverdue).length,
      inProgress: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
      inReview: tasks.filter((task) => task.status === TaskStatus.IN_REVIEW).length,
      done: tasks.filter((task) => task.status === TaskStatus.DONE).length,
    }),
    [tasks],
  );

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <SquareCheckBig />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل المهام</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب بيانات المهام. حاول مرة أخرى.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => refetch()}>إعادة المحاولة</Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">الرئيسية</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>المهام</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SquareCheckBig />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">قائمة المهام</CardTitle>
                <CardDescription>
                  متابعة التنفيذ والتأخير والتصحيح في مكان واحد.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "إجمالي المهام", value: formatNumber(metrics.total), hint: "كل المهام", icon: SquareCheckBig },
          { label: "المتأخرة", value: formatNumber(metrics.overdue), hint: "تحتاج تدخل", icon: CircleAlert },
          { label: "قيد التنفيذ", value: formatNumber(metrics.inProgress), hint: "عمل جاري", icon: Clock3 },
          { label: "منجزة", value: formatNumber(metrics.done), hint: "مهام مكتملة", icon: TimerReset },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-2xl font-semibold tracking-tight">{item.value}</span>
                <span className="text-sm text-muted-foreground">{item.hint}</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <item.icon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل المهام</CardTitle>
          <CardDescription>اضغط على السطر لفتح تفاصيل المهمة.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px] max-w-5xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بعنوان المهمة أو المشروع أو المكلّف"
                className="pr-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | TaskStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(TaskStatus) as TaskStatus[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {TASK_STATUS_AR[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as "ALL" | TaskPriority)}>
              <SelectTrigger>
                <SelectValue placeholder="كل الأولويات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأولويات</SelectItem>
                {(Object.values(TaskPriority) as TaskPriority[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {TASK_PRIORITY_AR[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={overdueOnly ? "default" : "outline"}
              onClick={() => setOverdueOnly((value) => !value)}
            >
              <CircleAlert />
              {overdueOnly ? "عرض المتأخرة فقط" : "المتأخرة فقط"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المهمة</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المكلّف</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الموعد</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task: AdminTaskItem) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/tasks/${task.id}`}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {task.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">{task.id}</div>
                      </TableCell>
                      <TableCell>{task.projectName}</TableCell>
                      <TableCell>{task.assigneeName}</TableCell>
                      <TableCell>{task.department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(task.status)}>
                          {TASK_STATUS_AR[task.status as TaskStatus] || task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant(task.priority)}>
                          {TASK_PRIORITY_AR[task.priority as TaskPriority] || task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.dueDate ? formatDateTime(task.dueDate) : "—"}</TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/tasks/${task.id}`}>
                            <ArrowUpRight />
                            فتح
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
