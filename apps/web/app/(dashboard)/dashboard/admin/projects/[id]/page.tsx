"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileClock,
  FolderKanban,
  History,
  Layers3,
  NotebookTabs,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatPortalDate, formatNumber } from "@/lib/format";
import { PROJECT_STATUS_AR, TaskPriority, TASK_PRIORITY_AR, TASK_STATUS_AR } from "@hassad/shared";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import type { AdminProjectDetail } from "@/features/admin/adminProjectsApi";

function statusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
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

function ProjectDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-28" /></div>
        </CardHeader>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card><CardContent className="flex gap-4 p-6"><Skeleton className="size-20 rounded-lg" /><div className="flex flex-1 flex-col gap-3"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-40" /><div className="flex flex-wrap gap-2"><Skeleton className="h-8 w-28" /><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-24" /></div></div></CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardContent className="flex items-start justify-between gap-4 p-5"><div className="flex flex-col gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-20" /><Skeleton className="h-4 w-32" /></div><Skeleton className="size-10 rounded-lg" /></CardContent></Card>)}</div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card><CardHeader className="gap-2"><Skeleton className="h-6 w-36" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}</CardContent></Card>
        <Card><CardHeader className="gap-2"><Skeleton className="h-6 w-36" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-lg" />)}</CardContent></Card>
      </div>
      <Card><CardHeader className="gap-2"><Skeleton className="h-6 w-36" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow>{Array.from({ length: 4 }).map((_, index) => <TableHead key={index}><Skeleton className="h-4 w-full" /></TableHead>)}</TableRow></TableHeader><TableBody>{Array.from({ length: 4 }).map((_, row) => <TableRow key={row}>{Array.from({ length: 4 }).map((_, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)}</TableBody></Table></CardContent></Card>
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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }>; }) {
  const { id } = use(params);
  const { data: project, isLoading, isError } = useGetAdminProjectByIdQuery(id);

  const sortedTasks = useMemo(() => [...(project?.tasks ?? [])].sort((a, b) => a.title.localeCompare(b.title)), [project]);

  if (isLoading) return <ProjectDetailLoading />;

  if (isError || !project) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><FolderKanban /></EmptyMedia><EmptyHeader><EmptyTitle>المشروع غير موجود</EmptyTitle><EmptyDescription>لم نتمكن من العثور على بيانات هذا المشروع.</EmptyDescription></EmptyHeader><EmptyContent><Button asChild><Link href="/dashboard/admin/projects"><ArrowLeft />العودة إلى المشاريع</Link></Button></EmptyContent></Empty></CardContent></Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard">الرئيسية</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/admin/projects">المشاريع</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{project.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FolderKanban /></div>
              <div className="flex flex-col gap-1"><CardTitle className="text-2xl">تفاصيل المشروع</CardTitle><CardDescription>معلومات تشغيلية ومالية ومتابعة الفريق في صفحة واحدة.</CardDescription></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/dashboard/admin/projects"><ArrowLeft />العودة</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href={`/dashboard/admin/clients/${project.clientId}`}><Building2 />العميل</Link></Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FolderKanban className="size-10" /></div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2><Badge variant={statusVariant(project.status)}>{PROJECT_STATUS_AR[project.status as keyof typeof PROJECT_STATUS_AR] || project.status}</Badge></div>
              <p className="text-sm text-muted-foreground">{project.description || "لا توجد ملاحظات وصفية إضافية."}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">الأولوية: {TASK_PRIORITY_AR[project.priority as TaskPriority] || project.priority}</Badge>
                <Badge variant="outline">التقدم: {formatNumber(project.completionPercentage)}%</Badge>
                <Badge variant="outline">المهام: {formatNumber(project.tasks.length)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "إجمالي القيمة", value: formatCurrency(project.totalValue), icon: CircleDollarSign },
            { label: "القيمة الشهرية", value: formatCurrency(project.monthlyValue), icon: CalendarDays },
            { label: "المهام", value: formatNumber(project.tasks.length), icon: NotebookTabs },
            { label: "المهام المتأخرة", value: formatNumber(project.tasks.filter((task) => task.status !== "DONE").length), icon: History },
          ].map((item) => <Card key={item.label}><CardContent className="flex items-start justify-between gap-4 p-5"><div className="flex flex-col gap-2"><span className="text-sm text-muted-foreground">{item.label}</span><span className="text-lg font-semibold">{item.value}</span></div><div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><item.icon /></div></CardContent></Card>)}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="gap-2"><CardTitle>البيانات الأساسية</CardTitle><CardDescription>المرجع الإداري المرتبط بالمشروع.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("العميل", project.client.companyName)}
            {field("مدير المشروع", project.manager?.name || "غير محدد")}
            {field("تاريخ البداية", formatPortalDate(project.startDate) || "—")}
            {field("تاريخ النهاية", formatPortalDate(project.endDate) || "—")}
            {field("المعرفة الداخلية", project.id)}
            {field("معرف الطلب", project.requestId || "—")}
            {field("معرف العقد", project.contractId || "—")}
            {field("آخر تحديث", formatDateTime(project.updatedAt))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2"><CardTitle>مؤشرات تشغيلية</CardTitle><CardDescription>قراءة سريعة لصحة التنفيذ داخل المشروع.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("التقدم", `${formatNumber(project.completionPercentage)}%`)}
            {field("الأرشفة", project.isArchived ? "مؤرشف" : "نشط")}
            {field("عدد الفترات", formatNumber(project.periods.length))}
            {field("المستحقات", formatCurrency(project.contract ? project.contract.totalValue - project.totalValue : project.totalValue))}
            {field("الفواتير", formatNumber(project.invoices.length))}
            {field("المدفوعات", formatNumber(project.payments.length))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-2"><CardTitle>أعضاء الفريق</CardTitle><CardDescription>المشاركون الفعليون في المشروع مع أدوارهم.</CardDescription></CardHeader>
          <CardContent className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>العضو</TableHead><TableHead>الدور</TableHead><TableHead>تاريخ الانضمام</TableHead></TableRow></TableHeader>
              <TableBody>
                {project.members.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا يوجد أعضاء مضافون</TableCell></TableRow> : project.members.map((member) => <TableRow key={member.id}><TableCell>{member.user.name}<div className="text-xs text-muted-foreground">{member.user.email}</div></TableCell><TableCell>{member.role}</TableCell><TableCell>{formatDateTime(member.joinedAt)}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2"><CardTitle>العقد والدفعات</CardTitle><CardDescription>الملف المالي المرتبط بالمشروع.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{field("العقد", project.contract ? `${formatCurrency(project.contract.totalValue)} / ${formatCurrency(project.contract.monthlyValue)}` : "—")}{field("الطلبات", project.requestId || "—")}{field("إجمالي القيمة", formatCurrency(project.totalValue))}{field("القيمة الشهرية", formatCurrency(project.monthlyValue))}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2"><CardTitle>المهام</CardTitle><CardDescription>تفاصيل مختصرة عن المهام المرتبطة بالمشروع.</CardDescription></CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>الحالة</TableHead><TableHead>الأولوية</TableHead><TableHead>الموعد</TableHead><TableHead>المكلّف</TableHead></TableRow></TableHeader>
            <TableBody>
              {sortedTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">لا توجد مهام</TableCell></TableRow> : sortedTasks.map((task) => <TableRow key={task.id}><TableCell>{task.title}</TableCell><TableCell><Badge variant={statusVariant(task.status)}>{TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] || task.status}</Badge></TableCell><TableCell><Badge variant={priorityVariant(task.priority)}>{TASK_PRIORITY_AR[task.priority as TaskPriority] || task.priority}</Badge></TableCell><TableCell>{formatPortalDate(task.dueDate) || "—"}</TableCell><TableCell>{task.assignedTo || "—"}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-2"><CardTitle>الملفات والاجتماعات</CardTitle><CardDescription>ملفات المشروع ومحاضره المجدولة.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>الملف</TableHead><TableHead>النوع</TableHead><TableHead>الرفع</TableHead></TableRow></TableHeader>
                <TableBody>{project.files.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد ملفات</TableCell></TableRow> : project.files.map((file) => <TableRow key={file.id}><TableCell>{file.fileName}</TableCell><TableCell>{file.filePath}</TableCell><TableCell>{formatDateTime(file.uploadedAt)}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>الاجتماع</TableHead><TableHead>الموعد</TableHead><TableHead>الملاحظات</TableHead></TableRow></TableHeader>
                <TableBody>{project.meetings.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد اجتماعات</TableCell></TableRow> : project.meetings.map((meeting) => <TableRow key={meeting.id}><TableCell>{meeting.title}</TableCell><TableCell>{formatDateTime(meeting.scheduledAt)}</TableCell><TableCell>{meeting.notes || "—"}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2"><CardTitle>الفترات والفواتير</CardTitle><CardDescription>سجل التواريخ والمحاسبة داخل المشروع.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>الفترة</TableHead><TableHead>الحالة</TableHead><TableHead>النطاق</TableHead><TableHead>الإنجاز</TableHead></TableRow></TableHeader>
                <TableBody>{project.periods.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد فترات</TableCell></TableRow> : project.periods.map((period) => <TableRow key={period.id}><TableCell>{period.periodNumber}</TableCell><TableCell>{period.status}</TableCell><TableCell>{formatPortalDate(period.startDate) || "—"} ← {formatPortalDate(period.endDate) || "—"}</TableCell><TableCell>{formatNumber(period.completionPercentage)}%</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>الفاتورة</TableHead><TableHead>القيمة</TableHead><TableHead>الحالة</TableHead><TableHead>الاستحقاق</TableHead></TableRow></TableHeader>
                <TableBody>{project.invoices.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد فواتير</TableCell></TableRow> : project.invoices.map((invoice) => <TableRow key={invoice.id}><TableCell>{invoice.invoiceNumber}</TableCell><TableCell>{formatCurrency(invoice.amount)}</TableCell><TableCell>{invoice.status}</TableCell><TableCell>{formatPortalDate(invoice.dueDate) || "—"}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>الدفعة</TableHead><TableHead>القيمة</TableHead><TableHead>الحالة</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader>
                <TableBody>{project.payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد دفعات</TableCell></TableRow> : project.payments.map((payment) => <TableRow key={payment.id}><TableCell>{payment.id}</TableCell><TableCell>{formatCurrency(payment.amount)}</TableCell><TableCell>{payment.status}</TableCell><TableCell>{formatDateTime(payment.createdAt)}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2"><CardTitle>سجل التغييرات</CardTitle><CardDescription>كل حركة إدارية على المشروع.</CardDescription></CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>الإجراء</TableHead><TableHead>المستخدم</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader>
            <TableBody>{project.history.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا يوجد سجل</TableCell></TableRow> : project.history.map((entry) => <TableRow key={entry.id}><TableCell>{entry.action}</TableCell><TableCell>{entry.userName}</TableCell><TableCell>{formatDateTime(entry.createdAt)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
