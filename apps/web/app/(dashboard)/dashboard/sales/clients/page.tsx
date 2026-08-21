"use client";

import { startTransition, useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  Building2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  BUSINESS_TYPE_AR,
  CLIENT_STATUS_AR,
  ClientStatus,
  type Client,
} from "@hassad/shared";
import { useGetSalesClientsQuery } from "@/features/clients/clientsApi";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { clientWorkflowErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 12;

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusHint(client: Client) {
  if (client.status === ClientStatus.LEAD) {
    return client.intakeCompleted
      ? "الملف مكتمل وجاهز للمتابعة"
      : "يحتاج استكمال التأهيل";
  }
  if (client.status === ClientStatus.ACTIVE) {
    return (client.activeProjects ?? 0) > 0
      ? `${formatNumber(client.activeProjects ?? 0)} مشروع نشط`
      : "عميل نشط بدون مشاريع جارية";
  }
  return "يحتاج مراجعة وإعادة تنشيط";
}

function companyType(client: Client) {
  return BUSINESS_TYPE_AR[client.businessType] ?? client.businessType;
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
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

function ClientIdentity({ client }: { client: Client }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-11">
        <AvatarImage
          src={client.user?.avatarUrl ?? undefined}
          alt={client.companyName}
        />
        <AvatarFallback>{getInitials(client.companyName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold">{client.companyName}</span>
        </div>
        <span className="truncate text-sm text-muted-foreground">
          {companyType(client)}
        </span>
      </div>
    </div>
  );
}

function ClientContact({ client }: { client: Client }) {
  if (!client.user)
    return (
      <span className="text-sm text-muted-foreground">
        لا يوجد مستخدم مرتبط
      </span>
    );
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-sm font-medium">{client.user.name}</span>
      <span className="truncate text-xs text-muted-foreground">
        {client.user.email}
      </span>
      <span className="text-xs text-muted-foreground">
        {client.user.phoneWhatsapp || "بدون رقم واتساب"}
      </span>
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const href = `/dashboard/sales/clients/${client.id}`;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ClientIdentity client={client} />
          <Badge variant={statusVariant(client.status)}>
            {CLIENT_STATUS_AR[client.status]}
          </Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">مدير الحساب</dt>
            <dd className="truncate text-sm font-medium">
              {client.manager?.name || client.accountManager || "غير محدد"}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {statusHint(client)}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">جهة التواصل</dt>
            <dd>
              <ClientContact client={client} />
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">المشاريع</dt>
            <dd className="text-sm font-semibold">
              {formatNumber(client.totalProjects ?? 0)}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {formatNumber(client.activeProjects ?? 0)} نشط
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
            <dt className="text-xs text-muted-foreground">المحفظة</dt>
            <dd className="text-sm font-semibold">
              {formatCurrency(client.totalContractValue ?? 0)}
            </dd>
            <dd className="text-xs text-muted-foreground">
              محصل {formatCurrency(client.totalPaid ?? 0)}
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>آخر تحديث: {formatDateTime(client.updatedAt)}</span>
          <Button size="sm" asChild>
            <Link href={href}>
              <ArrowUpLeft data-icon="inline-start" />
              فتح الملف
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientRow({ client }: { client: Client }) {
  const href = `/dashboard/sales/clients/${client.id}`;
  return (
    <TableRow>
      <TableCell>
        <Link
          href={href}
          className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ClientIdentity client={client} />
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(client.status)}>
            {CLIENT_STATUS_AR[client.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {statusHint(client)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>
            {client.manager?.name || client.accountManager || "غير محدد"}
          </span>
          <span className="text-xs text-muted-foreground">
            {client.intakeCompleted ? "تأهيل مكتمل" : "التأهيل غير مكتمل"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <ClientContact client={client} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatCurrency(client.totalPaid ?? 0)}</span>
          <span className="text-xs text-muted-foreground">
            من {formatCurrency(client.totalContractValue ?? 0)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatNumber(client.totalProjects ?? 0)}</span>
          <span className="text-xs text-muted-foreground">
            {formatNumber(client.activeProjects ?? 0)} نشط
          </span>
        </div>
      </TableCell>
      <TableCell className="text-left">
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            <ArrowUpLeft data-icon="inline-start" />
            فتح الملف
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function SalesClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ClientStatus>("ALL");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isLoading, isError, isFetching, refetch } =
    useGetSalesClientsQuery({
      search: deferredSearch.trim() || undefined,
      status: status === "ALL" ? undefined : status,
      page,
      limit: PAGE_SIZE,
    });
  const clients = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6   ">
        <PageHeader title="عملاء المبيعات" icon={Building2} />
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العملاء</EmptyTitle>
                <EmptyDescription>
                  {clientWorkflowErrorMessage(error)}
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

  function updateFilter(callback: () => void) {
    startTransition(() => {
      callback();
      setPage(1);
    });
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <PageHeader
        title="عملاء المبيعات"
        description="متابعة العملاء المحتملين والحسابات النشطة مع وصول سريع إلى الملف التجاري الكامل."
        icon={Building2}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw
              data-icon="inline-start"
              className={isFetching ? "animate-spin" : undefined}
            />
            {isFetching ? "جاري التحديث" : "تحديث"}
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="البحث في العملاء"
              value={search}
              onChange={(event) =>
                updateFilter(() => setSearch(event.target.value))
              }
              placeholder="ابحث باسم الشركة أو المسؤول أو جهة التواصل"
              className="pr-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              updateFilter(() => setStatus(value as "ALL" | ClientStatus))
            }
          >
            <SelectTrigger aria-label="تصفية حسب حالة العميل">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>حالة العميل</SelectLabel>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {(Object.values(ClientStatus) as ClientStatus[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {CLIENT_STATUS_AR[value]}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
            <span className="text-muted-foreground">النتائج الحالية</span>
            <span className="font-semibold">
              {formatNumber(data?.total ?? 0)}
            </span>
          </div>
        </div>

        {clients.length === 0 ? (
          <Empty className="border p-8">
            <EmptyMedia variant="icon">
              <ShieldCheck />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
              <EmptyDescription>
                جرّب تعديل البحث أو عرض جميع الحالات.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() =>
                  updateFilter(() => {
                    setSearch("");
                    setStatus("ALL");
                  })
                }
              >
                مسح الفلاتر
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="grid gap-4 xl:hidden">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-xl border xl:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المسؤول</TableHead>
                    <TableHead>جهة التواصل</TableHead>
                    <TableHead>المحفظة</TableHead>
                    <TableHead>المشاريع</TableHead>
                    <TableHead className="text-left">الانتقال</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <ClientRow key={client.id} client={client} />
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
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index + 1}>
                      <PaginationLink
                        isActive={index + 1 === currentPage}
                        onClick={() => setPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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
