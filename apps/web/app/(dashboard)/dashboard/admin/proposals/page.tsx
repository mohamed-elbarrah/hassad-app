"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  useGetAdminProposalsQuery,
  useGetAdminProposalStatsQuery,
} from "@/features/admin/adminProposalsApi";
import type { AdminProposalItem } from "@/features/admin/adminProposalsApi";
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
import { PROPOSAL_STATUS_AR, ProposalStatus } from "@hassad/shared";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { adminErrorMessage, UNKNOWN_STATUS_LABEL } from "@/lib/i18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

function statusVariant(status: string) {
  switch (status) {
    case ProposalStatus.APPROVED:
      return "secondary";
    case ProposalStatus.REJECTED:
      return "destructive";
    default:
      return "outline";
  }
}
function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <PageHeader title="عروض الأسعار" description="جارٍ تحميل بيانات العروض." icon={Sparkles} />
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] max-w-3xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="overflow-hidden rounded-lg border">
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
                {Array.from({ length: 6 }).map((_, row) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProposalsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ProposalStatus>("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;
  const statsQuery = useGetAdminProposalStatsQuery();
  const query = useGetAdminProposalsQuery({ limit, page, search: search.trim() || undefined, status: status === "ALL" ? undefined : status });
  const { data, isLoading, isError, isFetching, refetch } = query;
  const proposals = data?.items ?? [];
  const stats = statsQuery.data;
  const metrics = {
    total: statsQuery.isError ? "—" : stats?.total ?? proposals.length,
    sent: statsQuery.isError ? "—" : stats?.sent ?? proposals.filter((i) => i.status === ProposalStatus.SENT).length,
    approved: statsQuery.isError ? "—" : stats?.approved ?? proposals.filter((i) => i.status === ProposalStatus.APPROVED).length,
    conversion: statsQuery.isError ? "—" : stats?.conversionRate ?? 0,
    value: statsQuery.isError ? "—" : stats?.value ?? proposals.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
  };
  if (isLoading) return <LoadingState />;
  if (isError)
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل عروض الأسعار</EmptyTitle>
                <EmptyDescription>
                  {adminErrorMessage(query.error)}
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
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader title="عروض الأسعار" description="متابعة العروض ومعدلات التحويل من الطلب إلى العقد." icon={Sparkles} actions={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw data-icon="inline-start" />{isFetching ? "جاري التحديث" : "تحديث"}</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "إجمالي العروض",
            value: typeof metrics.total === "number" ? formatNumber(metrics.total) : metrics.total,
            hint: "كل العروض",
            icon: Sparkles,
          },
          {
            label: "مرسلة",
            value: typeof metrics.sent === "number" ? formatNumber(metrics.sent) : metrics.sent,
            hint: "بانتظار رد العميل",
            icon: TrendingUp,
          },
          {
            label: "مقبولة",
            value: typeof metrics.approved === "number" ? formatNumber(metrics.approved) : metrics.approved,
            hint: "تحولت لفرص فعلية",
            icon: TrendingUp,
          },
          {
            label: "إجمالي القيمة",
            value: typeof metrics.value === "number" ? formatCurrency(metrics.value) : metrics.value,
            hint: "القيمة الإجمالية",
            icon: Sparkles,
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
          <CardTitle>سجل العروض</CardTitle>
          <CardDescription>اضغط على الصف لفتح التفاصيل.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ابحث بعنوان العرض أو العميل"
                className="pr-10"
                id="admin-proposal-search"
                aria-label="البحث في عروض الأسعار"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => { setStatus(v as "ALL" | ProposalStatus); setPage(1); }}
            >
              <SelectTrigger id="admin-proposal-status-filter" aria-label="تصفية حسب حالة العرض">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ProposalStatus) as ProposalStatus[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {PROPOSAL_STATUS_AR[value]}
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
                  <TableHead>العرض</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الإنشاء</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  proposals.map((proposal: AdminProposalItem) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/proposals/${proposal.id}`}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          {proposal.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {proposal.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(proposal.status)}>
                          {PROPOSAL_STATUS_AR[
                            proposal.status as ProposalStatus
                          ] || UNKNOWN_STATUS_LABEL}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proposal.client?.companyName || proposal.request?.companyName || "—"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(proposal.totalPrice)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(proposal.createdAt)}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/admin/proposals/${proposal.id}`}
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
          {data && data.totalPages > 1 ? (
            <Pagination aria-label="ترقيم صفحات العروض"><PaginationContent><PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">صفحة {page} من {data.totalPages}</span></PaginationItem><PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= data.totalPages} onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))} /></PaginationItem></PaginationContent></Pagination>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
