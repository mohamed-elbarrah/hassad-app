"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, UserRound, Users } from "lucide-react";
import { UserRole, USER_ROLE_AR, TaskDepartment, TASK_DEPARTMENT_AR } from "@hassad/shared";
import { useGetAdminUsersQuery } from "@/features/admin/adminUsersApi";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";
import { adminErrorMessage } from "@/lib/i18n";

const employeeRoles = Object.values(UserRole).filter((role) => role !== UserRole.CLIENT);

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader title="الموظفون" description="إدارة ومراجعة حسابات الموظفين في النظام." icon={Users} />
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full max-w-md" />
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableHead key={index}><Skeleton className="h-4 w-full" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    {Array.from({ length: 5 }).map((_, cell) => (
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

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [department, setDepartment] = useState<"ALL" | TaskDepartment>("ALL");
  const [status, setStatus] = useState<"ALL" | "active" | "inactive">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminUsersQuery({
    search: debouncedSearch || undefined,
    roles: role === "ALL" ? undefined : role,
    department: department === "ALL" ? undefined : department,
    status: status === "ALL" ? undefined : status,
    excludeRole: UserRole.CLIENT,
    page,
    limit,
  });

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <PageHeader title="الموظفون" description="إدارة ومراجعة حسابات الموظفين في النظام." icon={Users} />
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon"><Users /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل الموظفين</EmptyTitle>
                <EmptyDescription>{adminErrorMessage(error)}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button onClick={() => refetch()}>إعادة المحاولة</Button></EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const employees = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader
        title="الموظفون"
        description="عرض جميع الموظفين في النظام. حسابات العملاء مستبعدة من هذه القائمة."
        icon={Users}
        actions={(
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw data-icon="inline-start" />
            {isFetching ? "جاري التحديث" : "تحديث"}
          </Button>
        )}
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px_160px]">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="employee-search"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); resetPage(); }}
                  placeholder="ابحث بالاسم أو البريد الإلكتروني"
                  aria-label="البحث عن موظف"
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Select value={role} onValueChange={(value) => { setRole(value); resetPage(); }}>
                <SelectTrigger id="employee-role" aria-label="تصفية حسب الدور"><SelectValue placeholder="كل الأدوار" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الأدوار</SelectItem>
                  {employeeRoles.map((value) => <SelectItem key={value} value={value}>{USER_ROLE_AR[value]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Select value={department} onValueChange={(value) => { setDepartment(value as "ALL" | TaskDepartment); resetPage(); }}>
                <SelectTrigger id="employee-department" aria-label="تصفية حسب القسم"><SelectValue placeholder="كل الأقسام" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الأقسام</SelectItem>
                  {Object.values(TaskDepartment).map((value) => <SelectItem key={value} value={value}>{TASK_DEPARTMENT_AR[value]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Select value={status} onValueChange={(value) => { setStatus(value as "ALL" | "active" | "inactive"); resetPage(); }}>
                <SelectTrigger id="employee-status" aria-label="تصفية حسب الحالة"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {employees.length === 0 ? (
            <Empty className="rounded-md border py-12">
              <EmptyMedia variant="icon"><UserRound /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد نتائج</EmptyTitle>
                <EmptyDescription>لا يوجد موظفون يطابقون معايير البحث الحالية.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => { setSearch(""); setRole("ALL"); setDepartment("ALL"); setStatus("ALL"); resetPage(); }}>
                  مسح التصفية
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>آخر دخول</TableHead>
                      <TableHead className="text-left">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9"><AvatarFallback>{getInitials(employee.name)}</AvatarFallback></Avatar>
                            <div className="flex min-w-0 flex-col gap-1">
                              <Link className="truncate font-medium hover:text-primary" href={`/dashboard/admin/employees/${employee.id}`}>
                                {employee.name}
                              </Link>
                              <span className="truncate text-xs text-muted-foreground">{employee.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{USER_ROLE_AR[employee.role] ?? employee.role}</Badge></TableCell>
                        <TableCell>{employee.department ? TASK_DEPARTMENT_AR[employee.department] : "غير محدد"}</TableCell>
                        <TableCell><Badge variant={employee.isActive ? "secondary" : "destructive"}>{employee.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                        <TableCell>{employee.lastLoginAt ? formatDateTime(employee.lastLoginAt) : "لم يسجل الدخول"}</TableCell>
                        <TableCell className="text-left">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/admin/employees/${employee.id}`}>عرض التفاصيل</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 ? (
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-sm text-muted-foreground">إجمالي الموظفين: {data?.total ?? 0}</p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem>
                      {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), page + 1).map((pageNumber) => (
                        <PaginationItem key={pageNumber}><PaginationLink isActive={pageNumber === page} onClick={() => setPage(pageNumber)}>{pageNumber}</PaginationLink></PaginationItem>
                      ))}
                      <PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </>
          )}
      </div>
    </div>
  );
}
