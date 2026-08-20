"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  Building2,
  CircleDollarSign,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { BUSINESS_TYPE_AR, CLIENT_STATUS_AR, ClientStatus, type Client } from "@hassad/shared";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  formatRelativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

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

function getStatusHint(client: Client) {
  if (client.status === ClientStatus.LEAD) {
    return client.intakeCompleted ? "الملف مكتمل وجاهز للمتابعة" : "يحتاج استكمال التأهيل";
  }

  if (client.status === ClientStatus.ACTIVE) {
    return (client.activeProjects ?? 0) > 0
      ? `${formatNumber(client.activeProjects ?? 0)} مشروع نشط`
      : "عميل نشط بدون مشاريع جارية";
  }

  return "يحتاج مراجعة وإعادة تنشيط";
}

function ClientsPageLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-60" />
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
  icon: typeof Users;
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

function ClientIdentity({ client }: { client: Client }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-11">
        <AvatarImage src={client.user?.avatarUrl ?? undefined} alt={client.companyName} />
        <AvatarFallback>{getInitials(client.companyName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">{client.companyName}</span>
          {client.portalAccessToken ? <Badge variant="outline">البوابة مفعلة</Badge> : null}
        </div>
        <span className="truncate text-sm text-muted-foreground">
          {BUSINESS_TYPE_AR[client.businessType] ?? client.businessType}
        </span>
      </div>
    </div>
  );
}

function ClientContact({ client }: { client: Client }) {
  if (!client.user) {
    return <span className="text-sm text-muted-foreground">لا يوجد مستخدم مرتبط</span>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-sm font-medium">{client.user.name}</span>
      <span className="truncate text-xs text-muted-foreground">{client.user.email}</span>
      <span className="text-xs text-muted-foreground">{client.user.phoneWhatsapp || "بدون رقم واتساب"}</span>
    </div>
  );
}

function ClientMetrics({ client }: { client: Client }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
        <span className="text-xs text-muted-foreground">المشاريع</span>
        <span className="font-semibold">{formatNumber(client.totalProjects ?? 0)}</span>
        <span className="text-xs text-muted-foreground">
          {formatNumber(client.activeProjects ?? 0)} نشط
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
        <span className="text-xs text-muted-foreground">القيمة التعاقدية</span>
        <span className="font-semibold">{formatCurrency(client.totalContractValue ?? 0)}</span>
        <span className="text-xs text-muted-foreground">ملخص سريع للمحفظة</span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
        <span className="text-xs text-muted-foreground">المحصّل</span>
        <span className="font-semibold">{formatCurrency(client.totalPaid ?? 0)}</span>
        <span className="text-xs text-muted-foreground">
          {client.lastProjectAt ? formatRelativeTime(String(client.lastProjectAt)) : "لا يوجد مشروع حديث"}
        </span>
      </div>
    </div>
  );
}

function SalesClientCard({ client }: { client: Client }) {
  const href = `/dashboard/sales/clients/${client.id}`;

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <ClientIdentity client={client} />
          <Badge variant={statusVariant(client.status)}>{CLIENT_STATUS_AR[client.status]}</Badge>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">مدير الحساب</span>
            <span className="font-medium">{client.manager?.name || client.accountManager || "غير محدد"}</span>
            <span className="text-xs text-muted-foreground">{getStatusHint(client)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
            <span className="text-xs text-muted-foreground">جهة التواصل</span>
            <ClientContact client={client} />
          </div>
        </div>

        <ClientMetrics client={client} />

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

function SalesClientRow({ client }: { client: Client }) {
  const router = useRouter();
  const href = `/dashboard/sales/clients/${client.id}`;

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
        <ClientIdentity client={client} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(client.status)}>{CLIENT_STATUS_AR[client.status]}</Badge>
          <span className="text-xs text-muted-foreground">{getStatusHint(client)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{client.manager?.name || client.accountManager || "غير محدد"}</span>
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
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span>{formatRelativeTime(String(client.updatedAt))}</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            onClick={(event) => event.stopPropagation()}
          >
            <Link href={href}>
              <ArrowUpLeft data-icon="inline-start" />
              فتح الملف
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function SalesClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ClientStatus>("ALL");
  const [page, setPage] = useState(1);

  const deferredSearch = useDeferredValue(search);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetClientsQuery({ limit: 1000 });

  const clients = useMemo(() => data?.items ?? [], [data]);

  const filteredClients = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = status === "ALL" ? true : client.status === status;
      const matchesSearch = !query
        ? true
        : [
            client.companyName,
            client.businessName,
            client.status,
            client.businessType,
            client.accountManager,
            client.manager?.name,
            client.user?.name,
            client.user?.email,
            client.user?.phoneWhatsapp,
            client.id,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [clients, deferredSearch, status]);

  const metrics = useMemo(() => {
    const total = clients.length;
    const leads = clients.filter((client) => client.status === ClientStatus.LEAD).length;
    const active = clients.filter((client) => client.status === ClientStatus.ACTIVE).length;
    const stopped = clients.filter((client) => client.status === ClientStatus.STOPPED).length;
    const totalPaid = clients.reduce((sum, client) => sum + (client.totalPaid ?? 0), 0);

    return { total, leads, active, stopped, totalPaid };
  }, [clients]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedClients = filteredClients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (isLoading) {
    return <ClientsPageLoading />;
  }

  if (isError) {
    return (
      <div dir="rtl" className="  ">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل العملاء</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء تحميل قائمة العملاء لفريق المبيعات. حاول مرة أخرى.
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
                  <BreadcrumbPage>العملاء</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 />
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl sm:text-3xl">عملاء المبيعات</CardTitle>
                <CardDescription className="max-w-3xl text-sm sm:text-base">
                  شاشة CRM عملية لفريق المبيعات لمتابعة العملاء المحتملين والحسابات النشطة
                  والرجوع بسرعة إلى الملف الكامل لكل عميل.
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">إجمالي السجلات: {formatNumber(metrics.total)}</Badge>
                  <Badge variant="outline">عملاء محتملون: {formatNumber(metrics.leads)}</Badge>
                  <Badge variant="outline">حسابات متوقفة: {formatNumber(metrics.stopped)}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" className={cn(isFetching && "animate-spin")} />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                startTransition(() => {
                  setStatus("ALL");
                  setSearch("");
                  setPage(1);
                });
              }}
            >
              <UserRound data-icon="inline-start" />
              إعادة ضبط العرض
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي العملاء"
          value={formatNumber(metrics.total)}
          hint="كل الحسابات الموجودة في مسار المبيعات"
          icon={Users}
        />
        <SummaryCard
          label="العملاء المحتملون"
          value={formatNumber(metrics.leads)}
          hint="سجلات تحتاج متابعة وتحويل"
          icon={FolderKanban}
        />
        <SummaryCard
          label="الحسابات النشطة"
          value={formatNumber(metrics.active)}
          hint="عملاء لديهم تعاون قائم أو محفظة فعالة"
          icon={ShieldCheck}
        />
        <SummaryCard
          label="إجمالي المحصّل"
          value={formatCurrency(metrics.totalPaid)}
          hint="المدفوعات المسجلة عبر العملاء"
          icon={CircleDollarSign}
        />
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل العملاء</CardTitle>
          <CardDescription>
            ابحث وصفِّ العملاء ثم افتح أي عميل للانتقال مباشرة إلى صفحة التفاصيل الحالية.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
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
                placeholder="ابحث باسم الشركة أو المسؤول أو جهة التواصل"
                className="pr-10"
              />
            </div>

            <Select
              value={status}
              onValueChange={(value) => {
                startTransition(() => {
                  setStatus(value as "ALL" | ClientStatus);
                  setPage(1);
                });
              }}
            >
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

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <span className="text-muted-foreground">النتائج الحالية</span>
              <span className="font-semibold">{formatNumber(filteredClients.length)}</span>
            </div>
          </div>

          <Separator />

          {filteredClients.length === 0 ? (
            <div className="rounded-xl border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
                  <EmptyDescription>
                    جرّب تعديل البحث أو عرض جميع الحالات للرجوع إلى كامل قاعدة العملاء.
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
                {pagedClients.map((client) => (
                  <SalesClientCard key={client.id} client={client} />
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
                    {pagedClients.map((client) => (
                      <SalesClientRow key={client.id} client={client} />
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
