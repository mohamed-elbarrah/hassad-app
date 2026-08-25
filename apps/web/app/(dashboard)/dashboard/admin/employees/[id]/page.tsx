"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardList,
  Link2,
  Mail,
  Shield,
  UserCog,
  Wallet,
} from "lucide-react";
import type { Employee } from "@hassad/shared";
import { useGetEmployeeByIdQuery } from "@/features/finance/financeApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime, formatPortalDate } from "@/lib/format";

function getPayTypeLabel(payType?: string | null) {
  switch (payType) {
    case "FIXED":
      return "ثابت";
    case "COMMISSION":
      return "عمولة";
    case "HOURLY":
      return "بالساعة";
    case "HYBRID":
      return "مختلط";
    default:
      return "غير محدد";
  }
}

function getEmployeeInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EmployeeDetailLoading() {
  return (
    <div className="flex flex-col gap-6   ">
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
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="size-20 rounded-full" />
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
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
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

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: 5 }).map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: employee, isLoading, isError } = useGetEmployeeByIdQuery(id);

  const salaryHistory = useMemo(() => {
    return [...(employee?.salaries || [])].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [employee]);

  if (isLoading) {
    return <EmployeeDetailLoading />;
  }

  if (isError || !employee) {
    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>الموظف غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على هذا الموظف.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/employees">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى القائمة
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = employee.name;

  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
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
                    <Link href="/dashboard/admin/employees">الموظفون</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">تفاصيل الموظف</CardTitle>
                <CardDescription>
                  بطاقة تعريفية ومالية مختصرة لحساب الموظف.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/employees">
                <ArrowLeft data-icon="inline-start" />
                العودة
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/dashboard/admin/employees/${employee.id}`}>
                <BadgeCheck data-icon="inline-start" />
                تحديث العرض
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <Avatar className="size-20">
              <AvatarFallback className="text-lg font-semibold">
                {getEmployeeInitials(employee.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {employee.name}
                </h2>
                <Badge
                  variant={employee.isActive ? "secondary" : "destructive"}
                >
                  {employee.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{employee.role}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {getPayTypeLabel(employee.payType)}
                </Badge>
                <Badge variant="outline">
                  <Wallet data-icon="inline-start" />
                  {formatCurrency(employee.baseSalary, employee.currency)}
                </Badge>
                {employee.userId ? (
                  <Badge variant="outline">
                    <Link2 data-icon="inline-start" />
                    حساب مستخدم مرتبط
                  </Badge>
                ) : (
                  <Badge variant="outline">غير مرتبط بحساب</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: "الراتب الأساسي",
              value: formatCurrency(employee.baseSalary, employee.currency),
              icon: Wallet,
            },
            {
              label: "نوع الدفع",
              value: getPayTypeLabel(employee.payType),
              icon: ClipboardList,
            },
            {
              label: "المستخدم المرتبط",
              value: employee.userId
                ? employee.userId.slice(0, 8)
                : "غير مرتبط",
              icon: Link2,
            },
            {
              label: "آخر تحديث",
              value: formatDateTime(employee.updatedAt),
              icon: CalendarDays,
            },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>
              تفاصيل الحساب والروابط والبيانات الإدارية.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCog />
                <span>المعرف الداخلي</span>
              </div>
              <p className="mt-2 font-mono text-sm">{employee.id}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail />
                <span>حساب المستخدم</span>
              </div>
              <p className="mt-2 text-sm">
                {employee.userId ? employee.userId : "لا يوجد حساب مرتبط"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield />
                <span>الحالة</span>
              </div>
              <p className="mt-2 text-sm">
                {employee.isActive ? "الحساب فعّال" : "الحساب متوقف"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 />
                <span>تاريخ الإنشاء</span>
              </div>
              <p className="mt-2 text-sm">
                {formatPortalDate(employee.createdAt) ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>إعدادات التعويض</CardTitle>
            <CardDescription>
              معلومات الراتب والمتغيرات المرتبطة بالموظف.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">
                الراتب الأساسي
              </span>
              <span className="font-medium">
                {formatCurrency(employee.baseSalary, employee.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">نوع الدفع</span>
              <span className="font-medium">
                {getPayTypeLabel(employee.payType)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">العمولة</span>
              <span className="font-medium">
                {employee.commissionRate
                  ? `${Math.round(employee.commissionRate * 100)}%`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">
                الأجر بالساعة
              </span>
              <span className="font-medium">
                {employee.hourlyRate
                  ? formatCurrency(employee.hourlyRate, employee.currency)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">
                الهدف الشهري
              </span>
              <span className="font-medium">
                {employee.monthlyTarget
                  ? formatCurrency(employee.monthlyTarget, employee.currency)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل الرواتب</CardTitle>
          <CardDescription>
            آخر الرواتب المنشأة لهذا الموظف إن وجدت.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salaryHistory.length === 0 ? (
            <div className="rounded-lg border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا يوجد سجل رواتب</EmptyTitle>
                  <EmptyDescription>
                    لم يتم العثور على رواتب منشأة لهذا الموظف بعد.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفترة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الأساسي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryHistory.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        {salary.month}/{salary.year}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.amount, employee.currency)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.baseSalary, employee.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            salary.status === "PAID" ? "secondary" : "outline"
                          }
                        >
                          {salary.status === "PAID"
                            ? "مدفوع"
                            : salary.status === "PENDING"
                              ? "قيد الانتظار"
                              : salary.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatPortalDate(salary.paymentDate) ?? "—"}
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
