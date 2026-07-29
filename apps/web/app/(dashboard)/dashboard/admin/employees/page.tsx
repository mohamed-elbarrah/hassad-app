"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Link2, RefreshCw, Search, UserCheck, Users, Wallet } from "lucide-react";
import { useGetEmployeesQuery } from "@/features/finance/financeApi";
import type { Employee } from "@hassad/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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

function EmployeesPageLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
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
          <Skeleton className="h-11 w-full max-w-md" />
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 7 }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    {Array.from({ length: 7 }).map((_, cell) => (
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

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isFetching } = useGetEmployeesQuery();

  const employees = data ?? [];

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.id.toLowerCase().includes(query) ||
        (employee.userId ?? "").toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((employee) => employee.isActive).length;
    const linked = employees.filter((employee) => Boolean(employee.userId)).length;
    const avgSalary =
      total > 0
        ? employees.reduce((sum, employee) => sum + (employee.baseSalary || 0), 0) /
          total
        : 0;

    return { total, active, linked, avgSalary };
  }, [employees]);

  if (isLoading) {
    return <EmployeesPageLoading />;
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل الموظفين</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب قائمة الموظفين. حاول مرة أخرى.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => refetch()}>
                  إعادة المحاولة
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
                  <BreadcrumbPage>الموظفون</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-2xl">قائمة الموظفين</CardTitle>
                  <CardDescription>
                    عرض جميع الموظفين المرتبطين بالنظام — العملاء غير مشمولين في هذه
                    الصفحة.
                  </CardDescription>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/admin/employees">
                <ArrowUpRight data-icon="inline-start" />
                فتح القائمة
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "إجمالي الموظفين",
            value: metrics.total,
            hint: "جميع الموظفين المسجلين",
            icon: Users,
          },
          {
            label: "النشطون",
            value: metrics.active,
            hint: "الموظفون الفعّالون",
            icon: UserCheck,
          },
          {
            label: "الحسابات المرتبطة",
            value: metrics.linked,
            hint: "موظفون مرتبطون بحساب مستخدم",
            icon: Link2,
          },
          {
            label: "متوسط الراتب الأساسي",
            value: formatCurrency(metrics.avgSalary),
            hint: "متوسط الراتب لجميع الموظفين",
            icon: Wallet,
          },
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
          <CardTitle>سجل الموظفين</CardTitle>
          <CardDescription>
            اضغط على اسم الموظف لفتح صفحته التفصيلية.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الموظف أو الدور أو رقم الحساب"
                className="pr-10"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="rounded-lg border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج</EmptyTitle>
                  <EmptyDescription>
                    لم نتمكن من العثور على موظفين يطابقون البحث الحالي.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={() => setSearch("")}>
                    مسح البحث
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>نوع الدفع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>الحساب المرتبط</TableHead>
                    <TableHead className="text-left">التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: Employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback>{getEmployeeInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link
                              href={`/dashboard/admin/employees/${employee.id}`}
                              className="font-medium transition-colors hover:text-primary"
                            >
                              {employee.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(employee.createdAt)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPayTypeLabel(employee.payType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={employee.isActive ? "secondary" : "destructive"}
                        >
                          {employee.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(employee.baseSalary, employee.currency)}</TableCell>
                      <TableCell>
                        {employee.userId ? (
                          <span className="font-mono text-xs">{employee.userId.slice(0, 8)}…</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">غير مرتبط</span>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/employees/${employee.id}`}>
                            <ArrowUpRight data-icon="inline-start" />
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
