"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckSquare, Mail, ShieldCheck, Users } from "lucide-react";
import {
  CAMPAIGN_PLATFORM_AR,
  CAMPAIGN_STATUS_AR,
  PROJECT_STATUS_AR,
  TASK_DEPARTMENT_AR,
  TASK_STATUS_AR,
  USER_ROLE_AR,
} from "@hassad/shared";
import { useGetAdminUserOverviewQuery } from "@/features/admin/adminUsersApi";
import { adminEmployeeMetricLabel, adminEmployeeSectionTitle, adminErrorMessage } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader title="تفاصيل الموظف" description="جارٍ تحميل بيانات الموظف." icon={Users} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card><CardContent className="flex items-center gap-4 p-6"><Skeleton className="size-20 rounded-full" /><div className="flex flex-1 flex-col gap-3"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /><Skeleton className="h-8 w-32" /></div></CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardContent className="flex flex-col gap-3 p-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-20" /></CardContent></Card>)}</div>
      </div>
      <Card><CardContent className="flex flex-col gap-4 p-6"><Skeleton className="h-6 w-40" /><Skeleton className="h-48 w-full" /></CardContent></Card>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useGetAdminUserOverviewQuery(id);

  if (isLoading) return <LoadingState />;

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <PageHeader title="تفاصيل الموظف" description="تعذر تحميل بيانات الموظف." icon={Users} />
        <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل الموظف</EmptyTitle><EmptyDescription>{adminErrorMessage(error)}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" asChild><Link href="/dashboard/admin/employees"><ArrowLeft data-icon="inline-start" />العودة للموظفين</Link></Button></EmptyContent></Empty></CardContent></Card>
      </div>
    );
  }

  const employee = data.profile;
  const roleLabel = USER_ROLE_AR[employee.role as keyof typeof USER_ROLE_AR] ?? employee.role;
  const departmentLabel = employee.department
    ? TASK_DEPARTMENT_AR[employee.department as keyof typeof TASK_DEPARTMENT_AR] ?? employee.department
    : "غير محدد";

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader
        title={employee.name}
        description={`${roleLabel} · ${departmentLabel}`}
        icon={Users}
        actions={<Button variant="outline" asChild><Link href="/dashboard/admin/employees"><ArrowLeft data-icon="inline-start" />العودة للموظفين</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ProfileCard employee={employee} roleLabel={roleLabel} departmentLabel={departmentLabel} />
        <div className="grid gap-4 sm:grid-cols-2">
          {data.kpis.map((metric) => <Card key={metric.key}><CardContent className="flex min-h-28 flex-col justify-between gap-3 p-5"><span className="text-sm text-muted-foreground">{adminEmployeeMetricLabel(metric.key)}</span><span className="text-2xl font-semibold">{metric.value}</span></CardContent></Card>)}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <PerformanceSection sectionCode={data.performance.sectionCode} metrics={data.performance.metrics} />
        <ProfileDetails employee={employee} />
      </div>

      {data.work.campaigns.length > 0 ? <WorkTable title="الحملات التي أنشأها الموظف" description="الحملات المرتبطة بهذا الموظف بصفته المنشئ." headers={["الحملة", "العميل", "المنصة", "الحالة"]} rows={data.work.campaigns.map((campaign) => [campaign.name, campaign.clientName, CAMPAIGN_PLATFORM_AR[campaign.platform as keyof typeof CAMPAIGN_PLATFORM_AR] ?? campaign.platform, CAMPAIGN_STATUS_AR[campaign.status as keyof typeof CAMPAIGN_STATUS_AR] ?? campaign.status])} /> : null}
      {data.work.projects.length > 0 ? <WorkTable title="المشاريع المرتبطة" description="المشاريع المرتبطة بهذا الموظف." headers={["المشروع", "العميل", "الحالة"]} rows={data.work.projects.map((project) => [project.name, project.clientName, PROJECT_STATUS_AR[project.status as keyof typeof PROJECT_STATUS_AR] ?? project.status])} /> : null}
      {data.work.tasks.length > 0 ? <WorkTable title="المهام المرتبطة" description="المهام المرتبطة بهذا الموظف." headers={["المهمة", "المشروع", "الحالة"]} rows={data.work.tasks.map((task) => [task.title, task.projectName, TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] ?? task.status])} /> : null}

      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${employee.id}/activity`}><CheckSquare data-icon="inline-start" />سجل النشاط</Link></Button><Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${employee.id}/permissions`}><ShieldCheck data-icon="inline-start" />الصلاحيات</Link></Button></div>
    </div>
  );
}

function ProfileCard({ employee, roleLabel, departmentLabel }: { employee: { name: string; email: string; phoneWhatsapp?: string | null; avatarUrl?: string | null; isActive: boolean }; roleLabel: string; departmentLabel: string }) {
  return <Card><CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start"><Avatar className="size-20"><AvatarImage src={employee.avatarUrl ?? undefined} alt="" /><AvatarFallback className="text-lg font-semibold">{getInitials(employee.name)}</AvatarFallback></Avatar><div className="flex min-w-0 flex-1 flex-col gap-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-tight">{employee.name}</h2><Badge variant={employee.isActive ? "secondary" : "destructive"}>{employee.isActive ? "نشط" : "غير نشط"}</Badge></div><div className="flex flex-wrap gap-2"><Badge variant="outline">{roleLabel}</Badge><Badge variant="outline">{departmentLabel}</Badge></div><div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-5"><span className="inline-flex items-center gap-2"><Mail aria-hidden="true" />{employee.email}</span>{employee.phoneWhatsapp ? <span>{employee.phoneWhatsapp}</span> : null}</div></div></CardContent></Card>;
}

function ProfileDetails({ employee }: { employee: { email: string; phoneWhatsapp?: string | null; lastLoginAt?: string | null; twoFactorEnabled?: boolean; createdAt: string } }) {
  return <Card><CardHeader className="gap-2"><CardTitle>الملف الشخصي</CardTitle><CardDescription>بيانات الحساب والحالة الأمنية للموظف.</CardDescription></CardHeader><CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2"><DetailItem icon={Mail} label="البريد الإلكتروني" value={employee.email} /><DetailItem icon={Users} label="رقم التواصل" value={employee.phoneWhatsapp ?? "غير محدد"} /><DetailItem icon={CalendarDays} label="آخر دخول" value={employee.lastLoginAt ? formatDateTime(employee.lastLoginAt) : "لم يسجل الدخول"} /><DetailItem icon={ShieldCheck} label="المصادقة الثنائية" value={employee.twoFactorEnabled ? "مفعلة" : "غير مفعلة"} /><DetailItem icon={CalendarDays} label="تاريخ الإنشاء" value={formatDateTime(employee.createdAt)} /></CardContent></Card>;
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex flex-col gap-2 border-b pb-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden="true" />{label}</span><span className="text-sm font-medium">{value}</span></div>;
}

function PerformanceSection({ sectionCode, metrics }: { sectionCode: string; metrics: Array<{ key: string; value: number }> }) {
  return <Card><CardHeader className="gap-2"><CardTitle>{adminEmployeeSectionTitle(sectionCode)}</CardTitle><CardDescription>المؤشرات التشغيلية الخاصة بدور هذا الموظف.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{metrics.map((metric) => <div key={metric.key} className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"><span className="text-sm text-muted-foreground">{adminEmployeeMetricLabel(metric.key)}</span><span className="font-semibold">{metric.value}</span></div>)}</CardContent></Card>;
}

function WorkTable({ title, description, headers, rows }: { title: string; description: string; headers: string[]; rows: string[][] }) {
  return <Card><CardHeader className="gap-2"><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={`${title}-${index}`}>{row.map((cell, cellIndex) => <TableCell key={`${title}-${index}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div></CardContent></Card>;
}
