"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  useGetAdminDisputesQuery,
  useGetAdminDisputeStatsQuery,
} from "@/features/admin/adminDisputesApi";
import type { AdminDisputeItem } from "@/features/admin/adminDisputesApi";
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
import {
  DISPUTE_CATEGORY_AR,
  DISPUTE_PRIORITY_AR,
  DISPUTE_STATUS_AR,
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";
import { formatNumber } from "@/lib/format";
import { adminErrorMessage, UNKNOWN_STATUS_LABEL } from "@/lib/i18n";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { PageHeader } from "@/components/common/PageHeader";

function statusVariant(status: string) {
  switch (status) {
    case DisputeStatus.RESOLVED:
    case DisputeStatus.APPROVED:
      return "secondary";
    case DisputeStatus.REJECTED:
    case DisputeStatus.CLOSED:
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
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
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

export default function DisputesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | DisputeStatus>("ALL");
  const [category, setCategory] = useState<"ALL" | DisputeCategory>("ALL");
  const [priority, setPriority] = useState<"ALL" | DisputePriority>("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;
  const filters = {
    limit,
    page,
    search: search.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    category: category === "ALL" ? undefined : category,
    priority: priority === "ALL" ? undefined : priority,
  };

  const { data: stats } = useGetAdminDisputeStatsQuery(filters);
  const { data, isLoading, isError, isFetching, refetch, error } =
    useGetAdminDisputesQuery(filters);
  const disputes = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const metrics = useMemo(
    () => ({
      total,
      pendingApproval:
        stats?.pendingApproval ??
        disputes.filter(
          (item) => item.status === DisputeStatus.PENDING_APPROVAL,
        ).length,
      escalated:
        stats?.escalated ??
        disputes.filter(
          (item) => item.status === DisputeStatus.ESCALATED,
        ).length,
      resolved:
        stats?.resolved ??
        disputes.filter(
          (item) => item.status === DisputeStatus.RESOLVED,
        ).length,
      open:
        stats?.active ??
        disputes.filter(
          (item) =>
            item.status === DisputeStatus.APPROVED ||
            item.status === DisputeStatus.IN_PROGRESS ||
            item.status === DisputeStatus.PENDING_CLIENT,
        ).length,
    }),
    [disputes, stats, total],
  );

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div dir="rtl">
        <AdminPageError
          title="تعذر تحميل النزاعات"
          description={adminErrorMessage(error)}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
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
              <BreadcrumbPage>النزاعات</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title="قائمة النزاعات"
          description="مراقبة ملفات التصعيد والحل وتأثيرها على المشاريع والعملاء."
          icon={ShieldAlert}
          actions={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "إجمالي النزاعات",
            value: formatNumber(metrics.total),
            hint: "كل الملفات",
            icon: ShieldAlert,
          },
          {
            label: "بانتظار الموافقة",
            value: formatNumber(metrics.pendingApproval),
            hint: "تحتاج قرار إداري",
            icon: AlertTriangle,
          },
          {
            label: "قيد المعالجة",
            value: formatNumber(metrics.open),
            hint: "نشطة حالياً",
            icon: ShieldAlert,
          },
          {
            label: "تم الحل",
            value: formatNumber(metrics.resolved),
            hint: "أغلقت بنجاح",
            icon: ShieldAlert,
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
          <CardTitle>سجل النزاعات</CardTitle>
          <CardDescription>اضغط على الصف لفتح تفاصيل النزاع.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px] max-w-5xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ابحث بعنوان النزاع أو المشروع أو العميل"
                className="pr-10"
                id="admin-dispute-search"
                aria-label="البحث في النزاعات"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as "ALL" | DisputeStatus);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-dispute-status-filter" aria-label="تصفية حسب الحالة">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(DisputeStatus) as DisputeStatus[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {DISPUTE_STATUS_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as "ALL" | DisputeCategory);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-dispute-category-filter" aria-label="تصفية حسب التصنيف">
                <SelectValue placeholder="كل التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل التصنيفات</SelectItem>
                {(Object.values(DisputeCategory) as DisputeCategory[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {DISPUTE_CATEGORY_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={priority}
              onValueChange={(v) => {
                setPriority(v as "ALL" | DisputePriority);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-dispute-priority-filter" aria-label="تصفية حسب الأولوية">
                <SelectValue placeholder="كل الأولويات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأولويات</SelectItem>
                {(Object.values(DisputePriority) as DisputePriority[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {DISPUTE_PRIORITY_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النزاع</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الرسائل</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute: AdminDisputeItem) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/disputes/${dispute.id}`}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {dispute.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          #{dispute.ticketNumber}
                        </div>
                      </TableCell>
                      <TableCell>{dispute.project.name}</TableCell>
                      <TableCell>{dispute.client.companyName}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(dispute.status)}>
                          {DISPUTE_STATUS_AR[dispute.status as DisputeStatus] ||
                            UNKNOWN_STATUS_LABEL}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {DISPUTE_CATEGORY_AR[
                          dispute.category as DisputeCategory
                        ] || UNKNOWN_STATUS_LABEL}
                      </TableCell>
                      <TableCell>
                        {DISPUTE_PRIORITY_AR[
                          dispute.priority as DisputePriority
                        ] || UNKNOWN_STATUS_LABEL}
                      </TableCell>
                      <TableCell>
                        {formatNumber(dispute._count.messages)}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/disputes/${dispute.id}`}
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
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3" aria-label="ترقيم صفحات النزاعات">
              <span className="text-sm text-muted-foreground">الصفحة {formatNumber(page)} من {formatNumber(totalPages)}</span>
              <div className="flex gap-2">
                <Button aria-label="الانتقال إلى الصفحة السابقة" variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page === 1 || isFetching}>السابق</Button>
                <Button aria-label="الانتقال إلى الصفحة التالية" variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || isFetching}>التالي</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
