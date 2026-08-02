"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  CalendarDays,
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
import { useGetContractsQuery, type ContractItem } from "@/features/contracts/contractsApi";
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
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPortalDate,
  formatRelativeTime,
} from "@/lib/format";

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

function getContractTypeLabel(type: ContractTypeType | string) {
  switch (type) {
    case ContractType.MONTHLY_RETAINER:
      return "اشتراك شهري";
    case ContractType.FIXED_PROJECT:
      return "مشروع ثابت";
    case ContractType.ONE_TIME_SERVICE:
      return "خدمة مرة واحدة";
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

function getCompanyLabel(contract: ContractItem) {
  return contract.client?.companyName ?? "—";
}

function getContactLabel(contract: ContractItem) {
  return contract.client?.user?.name ?? contract.client?.user?.email ?? "—";
}

function getRelatedHref(contract: ContractItem) {
  if (contract.client?.id) return `/dashboard/sales/clients/${contract.client.id}`;
  if (contract.proposal?.id) return `/dashboard/sales/proposals/${contract.proposal.id}`;
  return null;
}

function getExpiringDays(contract: ContractItem) {
  const end = new Date(contract.endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getRenewalStatus(contract: ContractItem) {
  const days = getExpiringDays(contract);

  if (days == null) return "غير محدد";
  if (days < 0) return "منتهي";
  if (days <= 30) return "خلال 30 يوم";
  if (days <= 60) return "خلال 60 يوم";
  if (days <= 90) return "خلال 90 يوم";
  return "بعيد";
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
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
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

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof FileClock;
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

function ContractIdentity({ contract }: { contract: ContractItem }) {
  const company = getCompanyLabel(contract);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {getInitials(company)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-semibold text-foreground">{contract.title}</span>
        <span className="truncate text-sm text-muted-foreground">{company}</span>
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: ContractItem }) {
  const href = `/dashboard/sales/contracts/${contract.id}`;
  const relatedHref = getRelatedHref(contract);
  const company = getCompanyLabel(contract);
  const contact = getContactLabel(contract);
  const expiringLabel = getRenewalStatus(contract);
  const signedLabel = contract.signedAt ? formatRelativeTime(contract.signedAt) : "غير موقّع بعد";
  const startLabel = formatPortalDate(contract.startDate) || "—";
  const endLabel = formatPortalDate(contract.endDate) || "—";

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ContractIdentity contract={contract} />
          <Badge variant={contractVariant(contract.status as ContractStatusType)}>
            {CONTRACT_STATUS_AR[contract.status as ContractStatusType] || contract.status}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">العميل</span>
            <span className="font-medium">{company}</span>
            <span className="text-xs text-muted-foreground">{contact}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">النوع</span>
            <span className="font-medium">{getContractTypeLabel(contract.type)}</span>
            <span className="text-xs text-muted-foreground">{contract.eSigned ? "موقّع إلكترونياً" : "بانتظار التوقيع"}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">الإجمالي</span>
            <span className="font-semibold">{formatCurrency(contract.totalValue)}</span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(contract.monthlyValue)} شهرياً
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">المدة</span>
            <span className="font-semibold">{startLabel} - {endLabel}</span>
            <span className="text-xs text-muted-foreground">{expiringLabel}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">التوقيع</span>
            <span className="font-semibold">{signedLabel}</span>
            <span className="text-xs text-muted-foreground">
              {formatNumber(contract.versionNumber)} إصدار
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {contract.shareLinkToken ? "يوجد رابط توقيع" : "لا يوجد رابط توقيع"}
          </span>
          <div className="flex flex-wrap gap-2">
            {relatedHref ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={relatedHref}>
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

function ContractRow({ contract }: { contract: ContractItem }) {
  const router = useRouter();
  const href = `/dashboard/sales/contracts/${contract.id}`;
  const relatedHref = getRelatedHref(contract);

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
        <ContractIdentity contract={contract} />
      </TableCell>
      <TableCell>
        <Badge variant={contractVariant(contract.status as ContractStatusType)}>
          {CONTRACT_STATUS_AR[contract.status as ContractStatusType] || contract.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{getCompanyLabel(contract)}</span>
          <span className="text-xs text-muted-foreground">{getContactLabel(contract)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{getContractTypeLabel(contract.type)}</span>
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
          <span>{formatDateTime(contract.createdAt)}</span>
          <span className="text-xs text-muted-foreground">
            ينتهي {formatDateTime(contract.endDate)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{getRenewalStatus(contract)}</span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(contract.versionNumber)} إصدار
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
              <Link href={relatedHref}>
                {contract.client ? "العميل" : "العرض"}
              </Link>
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

export default function SalesContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ContractStatusType>("ALL");
  const [type, setType] = useState<"ALL" | ContractTypeType>("ALL");
  const [renewal, setRenewal] = useState<"ALL" | "30" | "60" | "90">("ALL");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetContractsQuery({ limit: 1000 });

  const contracts = useMemo(() => data?.items ?? [], [data]);

  const filteredContracts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return contracts.filter((contract) => {
      const matchesStatus = status === "ALL" ? true : contract.status === status;
      const matchesType = type === "ALL" ? true : contract.type === type;
      const days = getExpiringDays(contract);
      const matchesRenewal =
        renewal === "ALL"
          ? true
          : days != null && days >= 0 && days <= Number(renewal);
      const matchesSearch = !query
        ? true
        : [
            contract.title,
            contract.type,
            contract.status,
            contract.client?.companyName,
            contract.client?.user?.name,
            contract.client?.user?.email,
            contract.proposal?.title,
            contract.id,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesType && matchesRenewal && matchesSearch;
    });
  }, [contracts, deferredSearch, renewal, status, type]);

  const metrics = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((contract) =>
      [ContractStatus.ACTIVE, ContractStatus.SIGNED].includes(contract.status as ContractStatusType),
    ).length;
    const signed = contracts.filter((contract) => contract.eSigned).length;
    const expiringSoon = contracts.filter((contract) => {
      const days = getExpiringDays(contract);
      return days != null && days >= 0 && days <= 30;
    }).length;
    const totalValue = contracts.reduce((sum, contract) => sum + (contract.totalValue ?? 0), 0);

    return { total, active, signed, expiringSoon, totalValue };
  }, [contracts]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedContracts = filteredContracts.slice(
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
                <EmptyTitle>تعذر تحميل العقود</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء جلب قائمة العقود لفريق المبيعات. حاول مرة أخرى.
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
                  <BreadcrumbPage>العقود</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileClock />
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl sm:text-3xl">عقود المبيعات</CardTitle>
                <CardDescription className="max-w-3xl text-sm sm:text-base">
                  شاشة CRM لمتابعة العقود الموقعة والفعالة والاقتراب من التجديدات مع
                  وصول مباشر للعميل أو العرض المرتبط.
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">إجمالي العقود: {formatNumber(metrics.total)}</Badge>
                  <Badge variant="outline">نشطة: {formatNumber(metrics.active)}</Badge>
                  <Badge variant="outline">قريبة الانتهاء: {formatNumber(metrics.expiringSoon)}</Badge>
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
              <Link href="/dashboard/sales/proposals">
                <FileClock data-icon="inline-start" />
                العروض
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي العقود"
          value={formatNumber(metrics.total)}
          hint="جميع العقود المسجلة"
          icon={FileClock}
        />
        <SummaryCard
          label="العقود النشطة"
          value={formatNumber(metrics.active)}
          hint="عقود قيد التنفيذ أو التفعيل"
          icon={ShieldCheck}
        />
        <SummaryCard
          label="الموقعة إلكترونياً"
          value={formatNumber(metrics.signed)}
          hint="العقود المكتملة التوقيع"
          icon={CalendarDays}
        />
        <SummaryCard
          label="إجمالي القيمة"
          value={formatCurrency(metrics.totalValue)}
          hint="القيمة التراكمية لكل العقود"
          icon={CircleDollarSign}
        />
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل العقود</CardTitle>
          <CardDescription>
            ابحث وصفِّ العقود ثم افتح أي عقد للانتقال مباشرة إلى صفحة التفاصيل.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px] xl:items-center">
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
                placeholder="ابحث بعنوان العقد أو العميل أو العرض"
                className="pr-10"
              />
            </div>

            <Select
              value={status}
              onValueChange={(value) => {
                startTransition(() => {
                  setStatus(value as "ALL" | ContractStatusType);
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ContractStatus) as ContractStatusType[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {CONTRACT_STATUS_AR[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={type}
              onValueChange={(value) => {
                startTransition(() => {
                  setType(value as "ALL" | ContractTypeType);
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                <SelectItem value={ContractType.MONTHLY_RETAINER}>اشتراك شهري</SelectItem>
                <SelectItem value={ContractType.FIXED_PROJECT}>مشروع ثابت</SelectItem>
                <SelectItem value={ContractType.ONE_TIME_SERVICE}>خدمة مرة واحدة</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={renewal}
              onValueChange={(value) => {
                startTransition(() => {
                  setRenewal(value as "ALL" | "30" | "60" | "90");
                  setPage(1);
                });
              }}
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

          <Separator />

          {filteredContracts.length === 0 ? (
            <div className="rounded-xl border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
                  <EmptyDescription>
                    جرّب تعديل البحث أو تغيير الفلاتر للرجوع إلى قائمة العقود.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      startTransition(() => {
                        setSearch("");
                        setStatus("ALL");
                        setType("ALL");
                        setRenewal("ALL");
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
                {pagedContracts.map((contract) => (
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
                    {pagedContracts.map((contract) => (
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
