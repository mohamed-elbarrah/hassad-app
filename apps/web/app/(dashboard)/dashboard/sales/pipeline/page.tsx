"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  ClipboardList,
  FileSignature,
  Filter,
  KanbanSquare,
  RefreshCw,
  Search,
  TableProperties,
} from "lucide-react";
import { REQUEST_STATUS_AR, RequestStatus } from "@hassad/shared";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { createSalesPipelineConfig } from "@/components/dashboard/sales/pipeline/config";
import {
  getRequestStatusBadgeVariant,
  isClosedRequest,
  SalesPipelineCard,
} from "@/components/dashboard/sales/pipeline/SalesPipelineCard";
import { useGetRequestsQuery, useUpdateRequestStatusMutation, type RequestItem } from "@/features/requests/requestsApi";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import {
  REQUEST_STATUS_GROUP_LABELS,
  type RequestStatusGroup,
  resolveStatusGroup,
} from "@/lib/utils/requestStatus";

type PipelineView = "kanban" | "table";

const STATUS_GROUP_OPTIONS: RequestStatusGroup[] = [
  "all",
  "received",
  "preparing",
  "awaiting-you",
  "signed",
  "cancelled",
];

function getPipelineAction(request: RequestItem) {
  const proposalId = request.proposals?.[0]?.id;
  const contractId = request.contracts?.[0]?.id;

  switch (request.status) {
    case RequestStatus.PROPOSAL_IN_PROGRESS:
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
      return proposalId
        ? {
            label:
              request.status === RequestStatus.NEGOTIATION
                ? "فتح العرض"
                : "مراجعة العرض",
            href: `/dashboard/sales/proposals/${proposalId}`,
          }
        : {
            label: "فتح الطلب",
            href: `/dashboard/sales/requests/${request.id}`,
          };
    case RequestStatus.CONTRACT_PREPARATION:
    case RequestStatus.CONTRACT_SENT:
      return contractId
        ? {
            label:
              request.status === RequestStatus.CONTRACT_SENT
                ? "فتح العقد"
                : "متابعة العقد",
            href: `/dashboard/sales/contracts/${contractId}`,
          }
        : {
            label: "فتح الطلب",
            href: `/dashboard/sales/requests/${request.id}`,
          };
    default:
      return {
        label: "فتح الطلب",
        href: `/dashboard/sales/requests/${request.id}`,
      };
  }
}

function getServiceCount(request: RequestItem) {
  return request.services?.length ?? 0;
}

function getFilteredRequests(
  requests: RequestItem[],
  group: RequestStatusGroup,
) {
  if (group === "all") {
    return requests;
  }

  return requests.filter(
    (request) => resolveStatusGroup(request.status) === group,
  );
}

function PipelineSummaryCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{title}</span>
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

function PipelinePageLoadingState() {
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
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-44" />
            <Skeleton className="h-11 w-36" />
          </div>
          <div className="grid gap-6 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[360px] rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PipelinePage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PipelineView>("kanban");
  const [statusGroup, setStatusGroup] = useState<RequestStatusGroup>("all");
  const deferredSearch = useDeferredValue(search);
  const [updateRequestStatus] = useUpdateRequestStatusMutation();

  const { data, isLoading, isError, isFetching, refetch } = useGetRequestsQuery(
    {
      limit: 100,
      search: deferredSearch.trim() || undefined,
    },
    { pollingInterval: 30_000 },
  );

  const requests = useMemo(() => data ?? [], [data]);

  const filteredRequests = useMemo(
    () => getFilteredRequests(requests, statusGroup),
    [requests, statusGroup],
  );

  const boardConfig = useMemo(
    () =>
      createSalesPipelineConfig({
        includeCancelled: statusGroup === "cancelled",
      }),
    [statusGroup],
  );

  const boardRequests = useMemo(() => {
    if (statusGroup === "cancelled") {
      return filteredRequests;
    }

    return filteredRequests.filter(
      (request) => request.status !== RequestStatus.CANCELLED,
    );
  }, [filteredRequests, statusGroup]);

  const summary = useMemo(() => {
    const openDeals = filteredRequests.filter(
      (request) => !isClosedRequest(request.status),
    ).length;
    const proposalFlow = filteredRequests.filter((request) =>
      [
        RequestStatus.PROPOSAL_IN_PROGRESS,
        RequestStatus.PROPOSAL_SENT,
        RequestStatus.NEGOTIATION,
      ].includes(request.status),
    ).length;
    const contractFlow = filteredRequests.filter((request) =>
      [
        RequestStatus.CONTRACT_PREPARATION,
        RequestStatus.CONTRACT_SENT,
      ].includes(request.status),
    ).length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const wonThisMonth = filteredRequests.filter(
      (request) =>
        [RequestStatus.SIGNED, RequestStatus.PROJECT_CREATED].includes(
          request.status,
        ) && new Date(request.updatedAt) >= monthStart,
    ).length;

    return { openDeals, proposalFlow, contractFlow, wonThisMonth };
  }, [filteredRequests]);

  async function handleDragEnd(
    itemId: string,
    _fromStage: string,
    toStage: string,
  ) {
    try {
      await updateRequestStatus({
        id: itemId,
        toStatus: toStage as RequestStatus,
      }).unwrap();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث حالة الطلب";
      toast.error(message);
    }
  }

  if (isLoading && requests.length === 0) {
    return <PipelinePageLoadingState />;
  }

  if (isError && requests.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <KanbanSquare />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل خط المبيعات</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من جلب فرص المبيعات الآن. حاول التحديث مرة أخرى.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => refetch()}>
                  <RefreshCw data-icon="inline-start" />
                  إعادة المحاولة
                </Button>
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
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/sales">المبيعات</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>خط المبيعات</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KanbanSquare />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">
                  خط المبيعات وإدارة الفرص
                </CardTitle>
                <CardDescription>
                  تابع كل فرصة من أول طلب حتى التوقيع، وانقلها بين المراحل
                  بسهولة من نفس اللوحة.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw
                data-icon="inline-start"
                className={isFetching ? "animate-spin" : undefined}
              />
              {isFetching ? "جاري التحديث" : "تحديث"}
            </Button>
            <Button asChild>
              <Link href="/dashboard/sales/requests/new">
                <ArrowUpLeft data-icon="inline-start" />
                طلب جديد
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PipelineSummaryCard
          title="الفرص المفتوحة"
          value={formatNumber(summary.openDeals)}
          hint="الطلبات التي ما زالت قيد العمل"
          icon={ClipboardList}
        />
        <PipelineSummaryCard
          title="مسار العروض"
          value={formatNumber(summary.proposalFlow)}
          hint="إعداد عروض أو تفاوض جارٍ"
          icon={BriefcaseBusiness}
        />
        <PipelineSummaryCard
          title="العقود قيد الإغلاق"
          value={formatNumber(summary.contractFlow)}
          hint="عقود تحت التجهيز أو بانتظار المتابعة"
          icon={FileSignature}
        />
        <PipelineSummaryCard
          title="تم الحسم هذا الشهر"
          value={formatNumber(summary.wonThisMonth)}
          hint="صفقات وصلت للتوقيع أو إنشاء مشروع"
          icon={KanbanSquare}
        />
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>لوحة الفرص</CardTitle>
          <CardDescription>
            ابحث، صفِّ، ثم بدّل بين لوحة الكانبان والجدول حسب طريقة العمل
            الأنسب لك.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setSearch(nextValue);
                  });
                }}
                placeholder="ابحث باسم العميل أو الشركة أو رقم الواتساب"
                className="pr-10"
              />
            </div>

            <Select
              value={statusGroup}
              onValueChange={(value) =>
                setStatusGroup(value as RequestStatusGroup)
              }
            >
              <SelectTrigger>
                <Filter data-icon="inline-start" />
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_GROUP_OPTIONS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {REQUEST_STATUS_GROUP_LABELS[group]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Tabs
              value={view}
              onValueChange={(value) => setView(value as PipelineView)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kanban">
                  <KanbanSquare data-icon="inline-start" />
                  كانبان
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableProperties data-icon="inline-start" />
                  جدول
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-end">
              <Badge variant="outline">
                {formatNumber(filteredRequests.length)} فرصة
              </Badge>
            </div>
          </div>

          {view === "kanban" ? (
            <Card className="overflow-hidden border-dashed">
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <div className="min-w-max p-4">
                    <KanbanBoard
                      config={boardConfig}
                      items={boardRequests}
                      getItemStage={(request) => request.status}
                      renderCard={(request) => (
                        <SalesPipelineCard request={request} />
                      )}
                      onDragEnd={handleDragEnd}
                      isLoading={isLoading}
                      isError={isError}
                      errorMessage="حدث خطأ أثناء تحميل الفرص"
                      emptyMessage="لا توجد فرص مطابقة للبحث أو الفلتر الحالي"
                    />
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراء الحالي</TableHead>
                    <TableHead>الخدمات</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead className="text-left">فتح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <Empty className="py-10">
                          <EmptyMedia variant="icon">
                            <ClipboardList />
                          </EmptyMedia>
                          <EmptyHeader>
                            <EmptyTitle>لا توجد فرص مطابقة</EmptyTitle>
                            <EmptyDescription>
                              جرّب تغيير البحث أو الفلتر لعرض نتائج أخرى.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => {
                      const action = getPipelineAction(request);

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <Link
                                href={`/dashboard/sales/requests/${request.id}`}
                                className="truncate font-medium transition-colors hover:text-primary"
                              >
                                {request.contactName}
                              </Link>
                              <span
                                dir="ltr"
                                className="truncate text-xs text-muted-foreground"
                              >
                                {request.phoneWhatsapp}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="truncate">{request.companyName}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {request.client?.companyName || "عميل جديد"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getRequestStatusBadgeVariant(request.status)}
                            >
                              {REQUEST_STATUS_AR[request.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="text-sm font-medium">
                                {action.label}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {formatRelativeTime(request.updatedAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">
                                {formatNumber(getServiceCount(request))}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {resolveStatusGroup(request.status) === "cancelled"
                                  ? "ملغي"
                                  : REQUEST_STATUS_AR[request.status]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="text-sm">
                                {formatDateTime(request.updatedAt)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.assignee?.name || "غير مسند"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-left">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={action.href}>
                                <ArrowUpLeft data-icon="inline-start" />
                                فتح
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
