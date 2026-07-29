"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FolderKanban,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { BUSINESS_TYPE_AR, CLIENT_STATUS_AR, ClientStatus } from "@hassad/shared";
import type { Client } from "@hassad/shared";

import { CreateClientDialog } from "./create-client-dialog";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusVariant(status: ClientStatus) {
  switch (status) {
    case ClientStatus.ACTIVE:
      return "secondary";
    case ClientStatus.STOPPED:
      return "destructive";
    default:
      return "outline";
  }
}

function ClientsPageLoading() {
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

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ClientStatus>("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useGetClientsQuery({
    limit: 1000,
  });

  const clients = data?.items ?? [];

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesStatus = status === "ALL" ? true : client.status === status;
      const matchesSearch = !query
        ? true
        : [
            client.companyName,
            client.businessName,
            client.status,
            client.businessType,
            client.manager?.name,
            client.user?.name,
            client.user?.email,
            client.id,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, status]);

  const metrics = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.status === ClientStatus.ACTIVE).length;
    const leads = clients.filter((client) => client.status === ClientStatus.LEAD).length;
    const linkedUsers = clients.filter((client) => Boolean(client.userId)).length;
    const totalRevenue = clients.reduce((sum, client) => sum + (client.totalPaid || 0), 0);

    return { total, active, leads, linkedUsers, totalRevenue };
  }, [clients]);

  if (isLoading) {
    return <ClientsPageLoading />;
  }

  if (isError) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العملاء</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب قائمة العملاء. حاول مرة أخرى.
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
                  <BreadcrumbPage>العملاء</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-2xl">قائمة العملاء</CardTitle>
                  <CardDescription>
                    تصفح جميع العملاء المرتبطين بالنظام مع ملخص سريع لكل حساب.
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <UserRound data-icon="inline-start" />
              إضافة عميل
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "إجمالي العملاء",
            value: metrics.total,
            hint: "كل الحسابات المسجلة",
            icon: Users,
          },
          {
            label: "العملاء النشطون",
            value: metrics.active,
            hint: "حسابات قيد التشغيل",
            icon: CircleDollarSign,
          },
          {
            label: "العملاء المحتملون",
            value: metrics.leads,
            hint: "فرص قيد المتابعة",
            icon: FolderKanban,
          },
          {
            label: "إجمالي المدفوعات",
            value: formatCurrency(metrics.totalRevenue),
            hint: "المبالغ المحصلة عبر العملاء",
            icon: CalendarDays,
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
          <CardTitle>سجل العملاء</CardTitle>
          <CardDescription>
            اضغط على اسم العميل لفتح صفحة التفاصيل الكاملة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الشركة أو النشاط أو المدير"
                className="pr-10"
              />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | ClientStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ClientStatus) as ClientStatus[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {CLIENT_STATUS_AR[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredClients.length === 0 ? (
            <div className="rounded-lg border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج</EmptyTitle>
                  <EmptyDescription>
                    لم نعثر على عملاء يطابقون البحث أو الفلتر الحالي.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setStatus("ALL");
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>النشاط</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المدير</TableHead>
                    <TableHead>المشاريع</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead className="text-left">التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: Client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback>{getInitials(client.companyName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link
                              href={`/dashboard/admin/clients/${client.id}`}
                              className="font-medium transition-colors hover:text-primary"
                            >
                              {client.companyName}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(client.createdAt)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{BUSINESS_TYPE_AR[client.businessType]}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(client.status)}>
                          {CLIENT_STATUS_AR[client.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.manager?.name || "غير محدد"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{formatNumber(client.totalProjects || 0)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(client.activeProjects || 0)} نشط
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(client.totalPaid || 0)}</TableCell>
                      <TableCell>
                        {client.user ? (
                          <div className="flex flex-col gap-1">
                            <span>{client.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {client.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">غير مرتبط</span>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/clients/${client.id}`}>
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

      <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
