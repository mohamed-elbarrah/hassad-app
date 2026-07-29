"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, FileClock, FileText, SquareCheckBig, Users } from "lucide-react";
import { useGetAdminTaskByIdQuery } from "@/features/admin/adminTasksApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TASK_PRIORITY_AR, TASK_STATUS_AR } from "@hassad/shared";
import { formatDateTime, formatNumber } from "@/lib/format";

function statusVariant(status: string) {
  switch (status) {
    case "DONE":
      return "secondary";
    case "REVISION":
      return "destructive";
    default:
      return "outline";
  }
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex gap-4 p-6">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-40" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function field(label: string, value?: string | number | null) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task, isLoading, isError } = useGetAdminTaskByIdQuery(id);

  if (isLoading) return <LoadingState />;

  if (isError || !task) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <SquareCheckBig />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>المهمة غير موجودة</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذه المهمة.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/tasks">
                    <ArrowLeft />
                    العودة إلى المهام
                  </Link>
                </Button>
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
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/admin/tasks">المهام</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{task.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SquareCheckBig />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">تفاصيل المهمة</CardTitle>
                <CardDescription>
                  متابعة سياق التنفيذ والسجل والملفات المرتبطة.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/tasks">
                <ArrowLeft />
                العودة
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/projects/${task.project.id}`}>
                <FileClock />
                المشروع
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SquareCheckBig className="size-10" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">{task.title}</h2>
                <Badge variant="outline">{TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] || task.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{task.project.name}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">الأولوية {TASK_PRIORITY_AR[task.priority as keyof typeof TASK_PRIORITY_AR] || task.priority}</Badge>
                <Badge variant="outline">التعديلات {formatNumber(task.revisionCount)}</Badge>
                <Badge variant="outline">مرئي للعميل {task.isVisibleToClient ? "نعم" : "لا"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "الحالة", value: TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] || task.status, icon: SquareCheckBig },
            { label: "الأولوية", value: TASK_PRIORITY_AR[task.priority as keyof typeof TASK_PRIORITY_AR] || task.priority, icon: Clock3 },
            { label: "التعديلات", value: formatNumber(task.revisionCount), icon: FileText },
            { label: "مرئي للعميل", value: task.isVisibleToClient ? "نعم" : "لا", icon: Users },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-lg font-semibold">{item.value}</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>البيانات الأساسية</CardTitle>
            <CardDescription>المرجع التشغيلي للمهمة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("المشروع", task.project.name)}
            {field("القسم", task.department.name)}
            {field("المكلّف", task.assignee?.name || "—")}
            {field("المنشئ", task.creator.name)}
            {field("تاريخ البداية", formatDateTime(task.startedAt))}
            {field("تاريخ التسليم", formatDateTime(task.dueDate))}
            {field("تاريخ الإنشاء", formatDateTime(task.createdAt))}
            {field("آخر تحديث", formatDateTime(task.updatedAt))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>الملاحظات والمراحل</CardTitle>
            <CardDescription>ملخص التقدم والحالة الحالية.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("الوصف", task.description || "—")}
            {field("موثقة للعميل", task.isVisibleToClient ? "نعم" : "لا")}
            {field("أُرسلت", formatDateTime(task.submittedAt))}
            {field("أُعتمدت", formatDateTime(task.approvedAt))}
            {field("أرشفت", formatDateTime(task.archivedAt))}
            {field("المعرف الداخلي", task.id)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>سجل الحالة</CardTitle>
            <CardDescription>كل انتقالات الحالة في المهمة.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>بواسطة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.statusHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      لا يوجد سجل
                    </TableCell>
                  </TableRow>
                ) : (
                  task.statusHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.fromStatus || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(entry.toStatus)}>{entry.toStatus}</Badge>
                      </TableCell>
                      <TableCell>{entry.changer.name}</TableCell>
                      <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>التعليقات والملفات</CardTitle>
            <CardDescription>التواصل الداخلي والملفات المرتبطة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التعليق</TableHead>
                    <TableHead>بواسطة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {task.comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        لا توجد تعليقات
                      </TableCell>
                    </TableRow>
                  ) : (
                    task.comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>{comment.content}</TableCell>
                        <TableCell>{comment.user.name}</TableCell>
                        <TableCell>{formatDateTime(comment.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الملف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>الرفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {task.files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        لا توجد ملفات
                      </TableCell>
                    </TableRow>
                  ) : (
                    task.files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>{file.fileName}</TableCell>
                        <TableCell>{file.fileType}</TableCell>
                        <TableCell>{formatNumber(file.fileSize)}</TableCell>
                        <TableCell>{formatDateTime(file.uploadedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
