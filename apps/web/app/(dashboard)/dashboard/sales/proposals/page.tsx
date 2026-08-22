"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
  Kanban,
  Users,
} from "lucide-react";
import {
  PROPOSAL_STATUS_AR,
  ProposalStatus,
  type ProposalStatus as ProposalStatusType,
} from "@hassad/shared";
import {
  useGetSalesProposalsQuery,
  type ProposalListItem,
} from "@/features/proposals/proposalsApi";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import { salesWorkflowErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 12;

function statusVariant(status: ProposalStatusType) {
  switch (status) {
    case ProposalStatus.APPROVED:
      return "secondary";
    case ProposalStatus.REJECTED:
      return "destructive";
    default:
      return "outline";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getCompanyLabel(proposal: ProposalListItem) {
  return proposal.request?.companyName ?? proposal.client?.companyName ?? "—";
}

function getContactLabel(proposal: ProposalListItem) {
  return proposal.request?.contactName ?? proposal.client?.companyName ?? "—";
}

function getSourceLabel(proposal: ProposalListItem) {
  if (proposal.request) return "طلب";
  if (proposal.client) return "عميل";
  return "غير مرتبط";
}

function getOpenRelatedHref(proposal: ProposalListItem) {
  if (proposal.client) return `/dashboard/sales/clients/${proposal.client.id}`;
  if (proposal.request)
    return `/dashboard/sales/requests/${proposal.request.id}`;
  return null;
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-xl border xl:block">
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
      </div>
    </div>
  );
}

function ProposalIdentity({ proposal }: { proposal: ProposalListItem }) {
  const company = getCompanyLabel(proposal);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {getInitials(company)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-semibold text-foreground">
          {proposal.title}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {company}
        </span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalListItem }) {
  const href = `/dashboard/sales/proposals/${proposal.id}`;
  const relatedHref = getOpenRelatedHref(proposal);
  const company = getCompanyLabel(proposal);
  const contact = getContactLabel(proposal);
  const sentLabel = proposal.sentAt
    ? formatRelativeTime(String(proposal.sentAt))
    : "غير مرسل بعد";

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ProposalIdentity proposal={proposal} />
          <Badge variant={statusVariant(proposal.status as ProposalStatusType)}>
            {PROPOSAL_STATUS_AR[proposal.status as ProposalStatusType] ||
              proposal.status}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">الجهة</span>
            <span className="font-medium">{company}</span>
            <span className="text-xs text-muted-foreground">{contact}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">المصدر</span>
            <span className="font-medium">{getSourceLabel(proposal)}</span>
            <span className="text-xs text-muted-foreground">
              {proposal.sentAt
                ? `آخر إرسال: ${sentLabel}`
                : "جاهز للإرسال أو التعديل"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">القيمة</span>
            <span className="font-semibold">
              {formatCurrency(proposal.totalPrice)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatNumber(proposal.servicesList?.length ?? 0)} خدمات
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">الإنشاء</span>
            <span className="font-semibold">
              {formatDateTime(proposal.createdAt)}
            </span>
            <span className="text-xs text-muted-foreground">{sentLabel}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">المدة</span>
            <span className="font-semibold">
              {formatNumber(proposal.durationDays)} يوم
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            {relatedHref ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={relatedHref}>
                  <Users data-icon="inline-start" />
                  {proposal.client ? "ملف العميل" : "الطلب المرتبط"}
                </Link>
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href={href}>
                <ArrowUpLeft data-icon="inline-start" />
                فتح العرض
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalRow({ proposal }: { proposal: ProposalListItem }) {
  const href = `/dashboard/sales/proposals/${proposal.id}`;
  const relatedHref = getOpenRelatedHref(proposal);
  const company = getCompanyLabel(proposal);
  const contact = getContactLabel(proposal);

  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell>
        <ProposalIdentity proposal={proposal} />
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(proposal.status as ProposalStatusType)}>
          {PROPOSAL_STATUS_AR[proposal.status as ProposalStatusType] ||
            proposal.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{company}</span>
          <span className="text-xs text-muted-foreground">{contact}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatCurrency(proposal.totalPrice)}</span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(proposal.servicesList?.length ?? 0)} خدمات
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatDateTime(proposal.createdAt)}</span>
          <span className="text-xs text-muted-foreground">
            {proposal.sentAt
              ? `أُرسل ${formatRelativeTime(String(proposal.sentAt))}`
              : "لم يُرسل بعد"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{getSourceLabel(proposal)}</span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(proposal.durationDays)} يوم
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {relatedHref ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={relatedHref}>
                {proposal.client ? "العميل" : "الطلب"}
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              <ArrowUpLeft data-icon="inline-start" />
              فتح
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function SalesProposalsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ProposalStatusType>("ALL");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const { data, error, isLoading, isError, isFetching, refetch } =
    useGetSalesProposalsQuery({
      search: deferredSearch.trim() || undefined,
      status: status === "ALL" ? undefined : status,
      page,
      limit: PAGE_SIZE,
    });

  const proposals = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العروض</EmptyTitle>
                <EmptyDescription>
                  {salesWorkflowErrorMessage(error)}
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
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="عروض المبيعات"
        description="متابعة عروض الأسعار من لحظة الإنشاء وحتى الإرسال والاعتماد، مع وصول سريع إلى الطلب أو العميل المرتبط بكل عرض."
        icon={FileText}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw
                data-icon="inline-start"
                className={isFetching ? "animate-spin" : undefined}
              />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sales/pipeline">
                <Kanban data-icon="inline-start" />
                لوحة المبيعات
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="البحث في العروض"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setSearch(value);
                  setPage(1);
                });
              }}
              placeholder="ابحث بعنوان العرض أو الشركة أو جهة التواصل"
              className="pr-10"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              startTransition(() => {
                setStatus(value as "ALL" | ProposalStatusType);
                setPage(1);
              });
            }}
          >
            <SelectTrigger aria-label="تصفية حالة العرض">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ProposalStatus) as ProposalStatusType[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {PROPOSAL_STATUS_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
            <span className="text-muted-foreground">النتائج الحالية</span>
            <span className="font-semibold">
              {formatNumber(data?.total ?? 0)}
            </span>
          </div>
        </div>

        <Separator />

        {proposals.length === 0 ? (
          <div className="rounded-xl border p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
                <EmptyDescription>
                  جرّب تعديل البحث أو تغيير الحالة للرجوع إلى قائمة العروض.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    startTransition(() => {
                      setSearch("");
                      setStatus("ALL");
                      setPage(1);
                    });
                  }}
                >
                  مسح الفلاتر
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <>
            <div className="grid gap-4 xl:hidden">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border xl:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العرض</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الجهة</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>التواريخ</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead className="text-left">الانتقال</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <ProposalRow key={proposal.id} proposal={proposal} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <Pagination className="justify-between">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text="السابق"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      text="التالي"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
