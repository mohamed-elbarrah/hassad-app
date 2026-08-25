"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useGetAdminContractsQuery } from "@/features/admin/adminContractsApi";
import type { AdminContractItem } from "@/features/admin/adminContractsApi";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONTRACT_STATUS_AR, ContractStatus } from "@hassad/shared";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

function contractVariant(status: string) {
  switch (status) {
    case ContractStatus.ACTIVE:
    case ContractStatus.SIGNED:
    case ContractStatus.COMPLETED:
      return "secondary";
    case ContractStatus.CANCELLED:
    case ContractStatus.EXPIRED:
      return "destructive";
    default:
      return "outline";
  }
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px] max-w-3xl">
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

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ContractStatus>("ALL");
  const [expiringDays, setExpiringDays] = useState<"ALL" | "30" | "60" | "90">(
    "ALL",
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useGetAdminContractsQuery({
      limit: 1000,
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      expiringDays: expiringDays === "ALL" ? undefined : Number(expiringDays),
    });

  const contracts = data?.items ?? [];

  const metrics = useMemo(
    () => ({
      total: contracts.length,
      active: contracts.filter(
        (item) =>
          item.status === ContractStatus.ACTIVE ||
          item.status === ContractStatus.SIGNED,
      ).length,
      expiring: contracts.filter((item) => item.pendingRenewalAlerts > 0)
        .length,
      signed: contracts.filter((item) => item.eSigned).length,
      value: contracts.reduce((sum, item) => sum + (item.totalValue || 0), 0),
    }),
    [contracts],
  );

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العقود</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب بيانات العقود. حاول مرة أخرى.
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
                  <BreadcrumbPage>العقود</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileClock />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">قائمة العقود</CardTitle>
                <CardDescription>
                  متابعة التشغيل المالي، التجديدات، والتوقيع الإلكتروني.
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
          {
            label: "إجمالي العقود",
            value: formatNumber(metrics.total),
            hint: "كل العقود المسجلة",
            icon: FileClock,
          },
          {
            label: "النشطة",
            value: formatNumber(metrics.active),
            hint: "عقود قيد التشغيل",
            icon: ShieldCheck,
          },
          {
            label: "الموقعة إلكترونياً",
            value: formatNumber(metrics.signed),
            hint: "عقود مكتملة التوقيع",
            icon: CalendarDays,
          },
          {
            label: "إجمالي القيمة",
            value: formatCurrency(metrics.value),
            hint: "القيمة التراكمية",
            icon: CircleDollarSign,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-2xl font-semibold tracking-tight">
                  {item.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.hint}
                </span>
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
          <CardTitle>سجل العقود</CardTitle>
          <CardDescription>اضغط على أي عقد لفتح صفحة التفاصيل.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px] max-w-4xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بعنوان العقد أو العميل"
                className="pr-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "ALL" | ContractStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ContractStatus) as ContractStatus[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {CONTRACT_STATUS_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={expiringDays}
              onValueChange={(v) => setExpiringDays(v as typeof expiringDays)}
            >
              <SelectTrigger>
                <SelectValue placeholder="التجديدات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل المدد</SelectItem>
                <SelectItem value="30">خلال 30 يوم</SelectItem>
                <SelectItem value="60">خلال 60 يوم</SelectItem>
                <SelectItem value="90">خلال 90 يوم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العقد</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة الشهرية</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الفواتير</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((contract: AdminContractItem) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/contracts/${contract.id}`}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {contract.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {contract.id}
                        </div>
                      </TableCell>
                      <TableCell>{contract.clientName}</TableCell>
                      <TableCell>
                        <Badge variant={contractVariant(contract.status)}>
                          {CONTRACT_STATUS_AR[
                            contract.status as ContractStatus
                          ] || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{contract.type}</TableCell>
                      <TableCell>
                        {formatCurrency(contract.monthlyValue)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(contract.totalValue)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(contract.invoiceCount)}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/contracts/${contract.id}`}
                          >
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
