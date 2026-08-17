"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  CheckCircle2,
  FileText,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PROPOSAL_STATUS_AR, ProposalStatus, type ProposalStatus as ProposalStatusType } from "@hassad/shared";
import { useGetProposalsQuery, type ProposalListItem } from "@/features/proposals/proposalsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";

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
  return (
    proposal.client?.companyName ??
    proposal.request?.companyName ??
    proposal.lead?.companyName ??
    "—"
  );
}

function getContactLabel(proposal: ProposalListItem) {
  return proposal.request?.contactName ?? proposal.lead?.contactName ?? proposal.contactName ?? "—";
}

function getSourceLabel(proposal: ProposalListItem) {
  if (proposal.client) return "عميل";
  if (proposal.request) return "طلب";
  if (proposal.lead) return "عميل محتمل";
  return "غير مرتبط";
}

function getOpenRelatedHref(proposal: ProposalListItem) {
  if (proposal.client) return `/dashboard/sales/clients/${proposal.client.id}`;
  if (proposal.request) return `/dashboard/sales/requests/${proposal.request.id}`;
  return null;
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
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
              <Skeleton className="size-11 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    {Array.from({ length: 6 }).map((_, cell) => (
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

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof FileText;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon />
        </div>
      </CardContent>
    </Card>
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
        <span className="truncate font-semibold text-foreground">{proposal.title}</span>
        <span className="truncate text-sm text-muted-foreground">{company}</span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalListItem }) {
  const href = `/dashboard/sales/proposals/${proposal.id}`;
  const relatedHref = getOpenRelatedHref(proposal);
  const company = getCompanyLabel(proposal);
  const contact = getContactLabel(proposal);
  const sentLabel = proposal.sentAt ? formatRelativeTime(String(proposal.sentAt)) : "غير مرسل بعد";

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ProposalIdentity proposal={proposal} />
          <Badge variant={statusVariant(proposal.status as ProposalStatusType)}>
            {PROPOSAL_STATUS_AR[proposal.status as ProposalStatusType] || proposal.status}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">الجهة</span>
            <span className="font-medium">{company}</span>
            <span className="text-xs text-muted-foreground">{contact}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">المصدر</span>
            <span className="font-medium">{getSourceLabel(proposal)}</span>
            <span className="text-xs text-muted-foreground">
              {proposal.sentAt ? `آخر إرسال: ${sentLabel}` : "جاهز للإرسال أو التعديل"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">القيمة</span>
            <span className="font-semibold">{formatCurrency(proposal.totalPrice)}</span>
            <span className="text-xs text-muted-foreground">{formatNumber(proposal.servicesList?.length ?? 0)} خدمات</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">الإنشاء</span>
            <span className="font-semibold">{formatDateTime(proposal.createdAt)}</span>
            <span className="text-xs text-muted-foreground">{sentLabel}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">المدة</span>
            <span className="font-semibold">
              {formatNumber(proposal.durationDays)} يوم
            </span>
            <span className="text-xs text-muted-foreground">
              صلاحية {formatNumber(proposal.offerValidityDays)} يوم
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{proposal.shareLinkToken ? "يوجد رابط مشاركة" : "لا يوجد رابط مشاركة حتى الآن"}</span>
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
  const router = useRouter();
  const href = `/dashboard/sales/proposals/${proposal.id}`;
  const relatedHref = getOpenRelatedHref(proposal);
  const company = getCompanyLabel(proposal);
  const contact = getContactLabel(proposal);

  return (
    <TableRow
      className="cursor-pointer transition-colors hover:bg-muted/30"
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      tabIndex={0}
    >
      <TableCell>
        <ProposalIdentity proposal={proposal} />
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(proposal.status as ProposalStatusType)}>
          {PROPOSAL_STATUS_AR[proposal.status as ProposalStatusType] || proposal.status}
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
            {proposal.sentAt ? `أُرسل ${formatRelativeTime(String(proposal.sentAt))}` : "لم يُرسل بعد"}
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              onClick={(event) => event.stopPropagation()}
            >
              <Link href={relatedHref}>{proposal.client ? "العميل" : "الطلب"}</Link>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            asChild
            onClick={(event) => event.stopPropagation()}
          >
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
  const [source, setSource] = useState<"ALL" | "client" | "request" | "lead">("ALL");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetProposalsQuery({ limit: 1000 });

  const proposals = useMemo(() => data?.items ?? [], [data]);

  const filteredProposals = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return proposals.filter((proposal) => {
      const matchesStatus = status === "ALL" ? true : proposal.status === status;
      const proposalSource = proposal.client ? "client" : proposal.request ? "request" : proposal.lead ? "lead" : "unknown";
      const matchesSource = source === "ALL" ? true : proposalSource === source;
      const matchesSearch = !query
        ? true
        : [
            proposal.title,
            proposal.serviceDescription,
            proposal.contactName,
            proposal.contactEmail,
            proposal.client?.companyName,
            proposal.request?.companyName,
            proposal.request?.contactName,
            proposal.lead?.companyName,
            proposal.lead?.contactName,
            proposal.creator?.name,
            proposal.id,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [deferredSearch, proposals, source, status]);

  const metrics = useMemo(() => {
    const total = proposals.length;
    const sent = proposals.filter((proposal) => proposal.status === ProposalStatus.SENT).length;
    const approved = proposals.filter((proposal) => proposal.status === ProposalStatus.APPROVED).length;
    const revision = proposals.filter((proposal) => proposal.status === ProposalStatus.REVISION_REQUESTED).length;
    const value = proposals.reduce((sum, proposal) => sum + (proposal.totalPrice ?? 0), 0);

    return { total, sent, approved, revision, value };
  }, [proposals]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProposals = filteredProposals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العروض</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب قائمة عروض الأسعار لفريق المبيعات. حاول مرة أخرى.
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
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
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
                    <Link href="/dashboard/sales">المبيعات</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>العروض الفنية</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText />
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl sm:text-3xl">عروض المبيعات</CardTitle>
                <CardDescription className="max-w-3xl text-sm sm:text-base">
                  متابعة عروض الأسعار من لحظة الإنشاء وحتى الإرسال والاعتماد، مع وصول سريع
                  إلى الطلب أو العميل المرتبط بكل عرض.
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">إجمالي العروض: {formatNumber(metrics.total)}</Badge>
                  <Badge variant="outline">مرسلة: {formatNumber(metrics.sent)}</Badge>
                  <Badge variant="outline">قيد المراجعة: {formatNumber(metrics.revision)}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" className={isFetching ? "animate-spin" : undefined} />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sales/requests">
                <Users data-icon="inline-start" />
                الطلبات
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي العروض"
          value={formatNumber(metrics.total)}
          hint="كل العروض المسجلة في المبيعات"
          icon={FileText}
        />
        <SummaryCard
          label="المرسلة"
          value={formatNumber(metrics.sent)}
          hint="بانتظار رد العميل"
          icon={Send}
        />
        <SummaryCard
          label="المعتمدة"
          value={formatNumber(metrics.approved)}
          hint="العروض التي تحولت إلى اتفاق فعلي"
          icon={CheckCircle2}
        />
        <SummaryCard
          label="إجمالي القيمة"
          value={formatCurrency(metrics.value)}
          hint="القيمة التراكمية لكل العروض"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل العروض</CardTitle>
          <CardDescription>
            ابحث وصفِّ العروض ثم افتح أي عرض للانتقال مباشرة إلى صفحة التفاصيل.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
              <Input
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
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ProposalStatus) as ProposalStatusType[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PROPOSAL_STATUS_AR[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={source}
              onValueChange={(value) => {
                startTransition(() => {
                  setSource(value as "ALL" | "client" | "request" | "lead");
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل المصادر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل المصادر</SelectItem>
                <SelectItem value="client">عملاء</SelectItem>
                <SelectItem value="request">طلبات</SelectItem>
                <SelectItem value="lead">عملاء محتملون</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <span className="text-muted-foreground">النتائج الحالية</span>
              <span className="font-semibold">{formatNumber(filteredProposals.length)}</span>
            </div>
          </div>

          <Separator />

          {filteredProposals.length === 0 ? (
            <div className="rounded-xl border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
                  <EmptyDescription>
                    جرّب تعديل البحث أو تغيير الحالة والمصدر للرجوع إلى قائمة العروض.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      startTransition(() => {
                        setSearch("");
                        setStatus("ALL");
                        setSource("ALL");
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
                {pagedProposals.map((proposal) => (
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
                    {pagedProposals.map((proposal) => (
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
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
