"use client";

import { startTransition, useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  CircleDollarSign,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  CONTRACT_STATUS_AR,
  ContractStatus,
  ContractType,
  type ContractStatus as ContractStatusType,
  type ContractType as ContractTypeType,
} from "@hassad/shared";
import {
  useGetSalesContractsQuery,
  type SalesContractListItem,
} from "@/features/contracts/contractsApi";
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
  SelectLabel,
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
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPortalDate,
  formatRelativeTime,
} from "@/lib/format";
import { salesWorkflowErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 12;

function contractVariant(status: ContractStatusType) {
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

function contractTypeLabel(type: ContractTypeType | string) {
  switch (type) {
    case ContractType.MONTHLY_RETAINER:
      return "اشتراك شهري";
    case ContractType.FIXED_PROJECT:
      return "مشروع ثابت";
    default:
      return String(type);
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

function companyLabel(contract: SalesContractListItem) {
  return contract.client?.companyName ?? "—";
}

function contactLabel(contract: SalesContractListItem) {
  return contract.client?.user?.name ?? contract.client?.user?.email ?? "—";
}

function relatedHref(contract: SalesContractListItem) {
  if (contract.client?.id)
    return `/dashboard/sales/clients/${contract.client.id}`;
  if (contract.proposal?.id) {
    return `/dashboard/sales/proposals/${contract.proposal.id}`;
  }
  return null;
}

function renewalLabel(endDate: string) {
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "غير محدد";
  const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "منتهي";
  if (days <= 30) return "خلال 30 يوم";
  if (days <= 60) return "خلال 60 يوم";
  if (days <= 90) return "خلال 90 يوم";
  return "بعيد";
}

function LoadingState() {
  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="flex flex-col gap-4 p-5">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-24 w-full" />
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
        </CardContent>
      </Card>
    </div>
  );
}

function ContractIdentity({ contract }: { contract: SalesContractListItem }) {
  const company = companyLabel(contract);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {getInitials(company)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-semibold">{contract.title}</span>
        <span className="truncate text-sm text-muted-foreground">
          {company}
        </span>
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: SalesContractListItem }) {
  const href = `/dashboard/sales/contracts/${contract.id}`;
  const related = relatedHref(contract);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ContractIdentity contract={contract} />
          <Badge variant={contractVariant(contract.status)}>
            {CONTRACT_STATUS_AR[contract.status] || contract.status}
          </Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">العميل</dt>
            <dd className="truncate text-sm font-medium">
              {companyLabel(contract)}
            </dd>
            <dd className="truncate text-xs text-muted-foreground">
              {contactLabel(contract)}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">النوع والتوقيع</dt>
            <dd className="text-sm font-medium">
              {contractTypeLabel(contract.type)}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {contract.eSigned ? "موقّع إلكترونياً" : "بانتظار التوقيع"}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">القيمة</dt>
            <dd className="text-sm font-semibold">
              {formatCurrency(contract.totalValue)}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {formatCurrency(contract.monthlyValue)} شهرياً
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">التجديد</dt>
            <dd className="text-sm font-semibold">
              {renewalLabel(contract.endDate)}
            </dd>
            <dd className="text-xs text-muted-foreground">
              ينتهي {formatPortalDate(contract.endDate) || "—"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>الإصدار {formatNumber(contract.versionNumber)}</span>
          <div className="flex flex-wrap gap-2">
            {related ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={related}>
                  <Users data-icon="inline-start" />
                  {contract.client ? "ملف العميل" : "العرض المرتبط"}
                </Link>
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href={href}>
                <ArrowUpLeft data-icon="inline-start" />
                فتح العقد
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractRow({ contract }: { contract: SalesContractListItem }) {
  const href = `/dashboard/sales/contracts/${contract.id}`;
  const related = relatedHref(contract);

  return (
    <TableRow>
      <TableCell>
        <Link
          href={href}
          className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ContractIdentity contract={contract} />
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={contractVariant(contract.status)}>
          {CONTRACT_STATUS_AR[contract.status] || contract.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{companyLabel(contract)}</span>
          <span className="text-xs text-muted-foreground">
            {contactLabel(contract)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{contractTypeLabel(contract.type)}</span>
          <span className="text-xs text-muted-foreground">
            {contract.eSigned ? "موقّع إلكترونياً" : "بانتظار التوقيع"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatCurrency(contract.totalValue)}</span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(contract.monthlyValue)} شهرياً
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{renewalLabel(contract.endDate)}</span>
          <span className="text-xs text-muted-foreground">
            ينتهي {formatDateTime(contract.endDate)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>
            {contract.signedAt
              ? formatRelativeTime(contract.signedAt)
              : "غير موقّع بعد"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(contract.versionNumber)} إصدار
          </span>
        </div>
      </TableCell>
      <TableCell className="text-left">
        <div className="flex flex-wrap justify-end gap-2">
          {related ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={related}>{contract.client ? "العميل" : "العرض"}</Link>
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

export default function SalesContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ContractStatusType>("ALL");
  const [type, setType] = useState<"ALL" | ContractTypeType>("ALL");
  const [renewal, setRenewal] = useState<"ALL" | "30" | "60" | "90">("ALL");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const { data, error, isLoading, isError, isFetching, refetch } =
    useGetSalesContractsQuery({
      page,
      limit: PAGE_SIZE,
      search: deferredSearch.trim() || undefined,
      status: status === "ALL" ? undefined : status,
      type: type === "ALL" ? undefined : type,
      renewal: renewal === "ALL" ? undefined : renewal,
    });

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6   ">
        <PageHeader title="عقود المبيعات" icon={FileClock} />
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العقود</EmptyTitle>
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

  const contracts = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);

  function updateFilter(callback: () => void) {
    startTransition(() => {
      callback();
      setPage(1);
    });
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <PageHeader
        title="عقود المبيعات"
        description="متابعة العقود المرسلة والموقعة والفعالة مع الوصول السريع إلى العميل والعرض المرتبط."
        icon={FileClock}
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
              <Link href="/dashboard/sales/proposals">
                <CircleDollarSign data-icon="inline-start" />
                العروض
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="البحث في العقود"
              value={search}
              onChange={(event) =>
                updateFilter(() => setSearch(event.target.value))
              }
              placeholder="ابحث بعنوان العقد أو العميل أو العرض"
              className="pr-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              updateFilter(() => setStatus(value as "ALL" | ContractStatusType))
            }
          >
            <SelectTrigger aria-label="تصفية حسب الحالة">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>حالة العقد</SelectLabel>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ContractStatus) as ContractStatusType[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {CONTRACT_STATUS_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={(value) =>
              updateFilter(() => setType(value as "ALL" | ContractTypeType))
            }
          >
            <SelectTrigger aria-label="تصفية حسب النوع">
              <SelectValue placeholder="كل الأنواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>نوع العقد</SelectLabel>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                <SelectItem value={ContractType.MONTHLY_RETAINER}>
                  اشتراك شهري
                </SelectItem>
                <SelectItem value={ContractType.FIXED_PROJECT}>
                  مشروع ثابت
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={renewal}
            onValueChange={(value) =>
              updateFilter(() =>
                setRenewal(value as "ALL" | "30" | "60" | "90"),
              )
            }
          >
            <SelectTrigger aria-label="تصفية حسب موعد التجديد">
              <SelectValue placeholder="التجديدات" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>موعد التجديد</SelectLabel>
                <SelectItem value="ALL">كل المدد</SelectItem>
                <SelectItem value="30">خلال 30 يوم</SelectItem>
                <SelectItem value="60">خلال 60 يوم</SelectItem>
                <SelectItem value="90">خلال 90 يوم</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {contracts.length === 0 ? (
          <Empty className="border p-8">
            <EmptyMedia variant="icon">
              <ShieldCheck />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
              <EmptyDescription>
                جرّب تعديل البحث أو تغيير الفلاتر.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid gap-4 xl:hidden">
              {contracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-xl border xl:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العقد</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>التجديد</TableHead>
                    <TableHead>التوقيع</TableHead>
                    <TableHead className="text-left">الانتقال</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <ContractRow key={contract.id} contract={contract} />
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
