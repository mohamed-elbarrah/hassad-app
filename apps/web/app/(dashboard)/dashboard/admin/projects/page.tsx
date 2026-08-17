"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  FolderKanban,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { PROJECT_STATUS_AR, ProjectStatus, TaskPriority } from "@hassad/shared";
import { useGetAdminProjectsQuery } from "@/features/admin/adminProjectsApi";
import type { AdminProjectItem } from "@/features/admin/adminProjectsApi";

function badgeVariant(status: string) {
  switch (status) {
    case ProjectStatus.ACTIVE:
    case ProjectStatus.COMPLETED:
      return "secondary";
    case ProjectStatus.CANCELLED:
      return "destructive";
    default:
      return "outline";
  }
}

function priorityLabel(priority: string) {
  switch (priority) {
    case TaskPriority.URGENT:
      return "عاجل";
    case TaskPriority.HIGH:
      return "عالي";
    case TaskPriority.NORMAL:
      return "عادي";
    case TaskPriority.LOW:
      return "منخفض";
    default:
      return priority;
  }
}

function ProjectsLoading() {
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
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] max-w-2xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableHead key={index}><Skeleton className="h-4 w-full" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    {Array.from({ length: 8 }).map((_, cell) => (
                      <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>
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

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminProjectsQuery({
    limit: 1000,
  });

  const projects = data?.items ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = status === "ALL" ? true : project.status === status;
      const matchesPriority = priority === "ALL" ? true : project.priority === priority;
      const matchesOverdue = overdueOnly ? project.isBehindSchedule || project.overdueTasksCount > 0 : true;
      const matchesSearch = !query
        ? true
        : [
            project.name,
            project.clientName,
            project.pmName,
            project.status,
            project.priority,
            project.id,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesPriority && matchesOverdue && matchesSearch;
    });
  }, [projects, search, status, priority, overdueOnly]);

  const metrics = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((item) => item.status === ProjectStatus.ACTIVE).length,
      completed: projects.filter((item) => item.status === ProjectStatus.COMPLETED).length,
      behind: projects.filter((item) => item.isBehindSchedule || item.overdueTasksCount > 0).length,
      value: projects.reduce((sum, item) => sum + (item.totalValue || 0), 0),
    };
  }, [projects]);

  if (isLoading) return <ProjectsLoading />;

  if (isError) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل المشاريع</EmptyTitle>
                <EmptyDescription>حدث خطأ أثناء جلب بيانات المشاريع. حاول مرة أخرى.</EmptyDescription>
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
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard">الرئيسية</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>المشاريع</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FolderKanban /></div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-2xl">قائمة المشاريع</CardTitle>
                  <CardDescription>لوحة تشغيلية لمتابعة التقدم، التأخير، والقيمة الإجمالية لكل مشروع.</CardDescription>
                </div>
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
          { label: "إجمالي المشاريع", value: formatNumber(metrics.total), hint: "كل المشاريع المسجلة", icon: FolderKanban },
          { label: "النشطة", value: formatNumber(metrics.active), hint: "مشاريع قيد التنفيذ", icon: Users },
          { label: "المكتملة", value: formatNumber(metrics.completed), hint: "مشاريع منتهية", icon: CalendarDays },
          { label: "إجمالي القيمة", value: formatCurrency(metrics.value), hint: "القيمة التقديرية الإجمالية", icon: CircleDollarSign },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-2xl font-semibold tracking-tight">{item.value}</span>
                <span className="text-sm text-muted-foreground">{item.hint}</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><item.icon /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل المشاريع</CardTitle>
          <CardDescription>اضغط على اسم المشروع لفتح التفاصيل الكاملة.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المشروع أو العميل أو المدير" className="pr-10" />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | ProjectStatus)}>
              <SelectTrigger><SelectValue placeholder="كل الحالات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ProjectStatus) as ProjectStatus[]).map((value) => <SelectItem key={value} value={value}>{PROJECT_STATUS_AR[value]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(value) => setPriority(value as "ALL" | TaskPriority)}>
              <SelectTrigger><SelectValue placeholder="كل الأولويات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأولويات</SelectItem>
                {([TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT] as TaskPriority[]).map((value) => <SelectItem key={value} value={value}>{priorityLabel(value)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={overdueOnly ? "default" : "outline"} onClick={() => setOverdueOnly((value) => !value)}>
              <AlertTriangle />
              {overdueOnly ? "عرض المتأخرة فقط" : "المتأخرة فقط"}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border p-8">
              <Empty>
                <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج</EmptyTitle>
                  <EmptyDescription>لم نعثر على مشاريع تطابق البحث أو الفلتر الحالي.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={() => { setSearch(""); setStatus("ALL"); setPriority("ALL"); setOverdueOnly(false); }}>مسح الفلاتر</Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشروع</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>مدير المشروع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التقدم</TableHead>
                    <TableHead>المهام المتأخرة</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead className="text-left">التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((project: AdminProjectItem) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Link href={`/dashboard/admin/projects/${project.id}`} className="font-medium transition-colors hover:text-primary">{project.name}</Link>
                          <span className="text-xs text-muted-foreground">{project.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.clientName}</TableCell>
                      <TableCell>{project.pmName || "غير محدد"}</TableCell>
                      <TableCell><Badge variant={badgeVariant(project.status)}>{PROJECT_STATUS_AR[project.status as ProjectStatus] || project.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{formatNumber(project.completionPercentage)}%</span>
                          <span className="text-xs text-muted-foreground">{project.isBehindSchedule ? "متأخر" : "ضمن الخطة"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(project.overdueTasksCount)}</TableCell>
                      <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/projects/${project.id}`}>
                            <ArrowUpRight />
                            فتح
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
