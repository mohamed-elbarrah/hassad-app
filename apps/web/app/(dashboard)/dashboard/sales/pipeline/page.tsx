"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  getSalesPipelineAction,
  SalesPipelineCard,
} from "@/components/dashboard/sales/pipeline/SalesPipelineCard";
import {
  useGetSalesPipelineQuery,
  useUpdateSalesPipelineStatusMutation,
  type SalesPipelineGroup,
  type SalesPipelineItem,
} from "@/features/sales/salesApi";
import { useGetProposalByIdQuery } from "@/features/proposals/proposalsApi";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ProposalFormDialog } from "@/components/dashboard/sales/ProposalFormDialog";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { Dialog } from "@/components/design-system/Dialog";
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
  SelectGroup,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import { salesPipelineErrorMessage } from "@/lib/i18n";

type PipelineView = "kanban" | "table";
type PipelineFilterGroup = "all" | SalesPipelineGroup;
type PipelineWorkflowDialog =
  | { type: "proposal"; mode: "create"; requestId: string }
  | { type: "proposal"; mode: "edit"; proposalId: string }
  | { type: "contract"; mode: "create"; requestId: string }
  | { type: "contract"; mode: "edit"; contractId: string };

const STATUS_GROUP_OPTIONS: PipelineFilterGroup[] = [
  "all",
  "INTAKE",
  "PROPOSAL",
  "CONTRACT",
  "WON",
  "CANCELLED",
];

const STATUS_GROUP_LABELS: Record<PipelineFilterGroup, string> = {
  all: "الكل",
  INTAKE: "الاستقبال والتأهيل",
  PROPOSAL: "العرض والتفاوض",
  CONTRACT: "العقد والإغلاق",
  WON: "الصفقات المحسومة",
  CANCELLED: "الطلبات الملغاة",
};

function getServiceCount(request: SalesPipelineItem) {
  return request.services?.length ?? 0;
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
  const [statusGroup, setStatusGroup] = useState<PipelineFilterGroup>("all");
  const [page, setPage] = useState(1);
  const [boardItems, setBoardItems] = useState<SalesPipelineItem[]>([]);
  const [workflowDialog, setWorkflowDialog] =
    useState<PipelineWorkflowDialog | null>(null);
  const deferredSearch = useDeferredValue(search);
  const [updatePipelineStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSalesPipelineStatusMutation();

  const apiStatusGroup: SalesPipelineGroup | undefined =
    statusGroup === "all" ? undefined : statusGroup;

  const proposalEditId =
    workflowDialog?.type === "proposal" && workflowDialog.mode === "edit"
      ? workflowDialog.proposalId
      : "";
  const contractEditId =
    workflowDialog?.type === "contract" && workflowDialog.mode === "edit"
      ? workflowDialog.contractId
      : "";
  const {
    data: proposalForEdit,
    isFetching: isProposalEditFetching,
    isError: isProposalEditError,
  } = useGetProposalByIdQuery(proposalEditId, { skip: !proposalEditId });
  const {
    data: contractForEdit,
    isFetching: isContractEditFetching,
    isError: isContractEditError,
  } = useGetContractByIdQuery(contractEditId, { skip: !contractEditId });

  const { currentData, isLoading, isError, isFetching, refetch } =
    useGetSalesPipelineQuery(
      {
        limit: view === "kanban" ? 500 : 50,
        page,
        view: view === "kanban" ? "board" : "table",
        search: deferredSearch.trim() || undefined,
        statusGroup: apiStatusGroup,
      },
      { pollingInterval: 30_000 },
    );

  useEffect(() => {
    if (!currentData?.items) return;

    if (view === "kanban") {
      setBoardItems((current) => {
        if (page === 1) return currentData.items;
        const incoming = new Map(
          currentData.items.map((item) => [item.id, item]),
        );
        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current.map((item) => incoming.get(item.id) ?? item),
          ...currentData.items.filter((item) => !existingIds.has(item.id)),
        ];
      });
    } else {
      setBoardItems([]);
    }
  }, [currentData?.items, page, view]);

  const requests = useMemo(
    () => (view === "kanban" ? boardItems : (currentData?.items ?? [])),
    [boardItems, currentData?.items, view],
  );
  const summary = currentData?.summary ?? {
    openDeals: 0,
    proposalFlow: 0,
    contractFlow: 0,
    wonThisMonth: 0,
  };
  const terminalStatuses = useMemo(
    () =>
      new Set(
        currentData?.stages
          .filter((stage) => stage.isTerminal)
          .map((stage) => stage.code) ?? [],
      ),
    [currentData?.stages],
  );

  const boardConfig = useMemo(
    () =>
      createSalesPipelineConfig({
        includeCancelled: statusGroup === "CANCELLED",
        stages: currentData?.stages,
      }),
    [currentData?.stages, statusGroup],
  );

  const boardRequests = requests;

  function openProposalDialog(request: SalesPipelineItem) {
    const proposalId = request.proposals?.[0]?.id;
    setWorkflowDialog(
      proposalId
        ? { type: "proposal", mode: "edit", proposalId }
        : { type: "proposal", mode: "create", requestId: request.id },
    );
  }

  function openContractDialog(request: SalesPipelineItem) {
    const contractId = request.contracts?.[0]?.id;
    setWorkflowDialog(
      contractId
        ? { type: "contract", mode: "edit", contractId }
        : { type: "contract", mode: "create", requestId: request.id },
    );
  }

  function handleWorkflowDialogChange(open: boolean) {
    if (!open) {
      setWorkflowDialog(null);
      void refetch();
    }
  }

  async function handleDragEnd(
    itemId: string,
    _fromStage: string,
    toStage: string,
  ) {
    try {
      await updatePipelineStatus({
        id: itemId,
        toStatus: toStage as RequestStatus,
      }).unwrap();
    } catch (error) {
      toast.error(salesPipelineErrorMessage(error));
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
            ابحث، صفِّ، ثم بدّل بين لوحة الكانبان والجدول حسب طريقة العمل الأنسب
            لك.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="البحث في فرص المبيعات"
                value={search}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setSearch(nextValue);
                    setPage(1);
                    setBoardItems([]);
                  });
                }}
                placeholder="ابحث باسم العميل أو الشركة أو رقم الواتساب"
                className="pr-10"
              />
            </div>

            <Select
              value={statusGroup}
              onValueChange={(value) => {
                setStatusGroup(value as PipelineFilterGroup);
                setPage(1);
                setBoardItems([]);
              }}
            >
              <SelectTrigger aria-label="تصفية مراحل خط المبيعات">
                <Filter data-icon="inline-start" />
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_GROUP_OPTIONS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {STATUS_GROUP_LABELS[group]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as PipelineView);
                setPage(1);
                setBoardItems([]);
              }}
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
              <div className="flex items-center gap-2">
                {view === "kanban" &&
                  (currentData?.meta.total ?? 0) > requests.length && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      عرض {formatNumber(requests.length)} من{" "}
                      {formatNumber(currentData?.meta.total)}
                    </Badge>
                  )}
                <Badge variant="outline">
                  {isUpdatingStatus
                    ? "جارٍ حفظ التغيير..."
                    : `${formatNumber(currentData?.meta.total ?? 0)} فرصة`}
                </Badge>
              </div>
            </div>
          </div>

          {view === "kanban" ? (
            <Card className="overflow-hidden border-dashed">
              <CardContent className="p-0">
                <div className="p-3">
                  <KanbanBoard
                    config={boardConfig}
                    items={boardRequests}
                    getItemStage={(request) => request.status}
                    renderCard={(request) => (
                      <SalesPipelineCard
                        request={request}
                        onCreateProposal={openProposalDialog}
                        onEditProposal={openProposalDialog}
                        onCreateContract={openContractDialog}
                        onEditContract={openContractDialog}
                      />
                    )}
                    onDragEnd={handleDragEnd}
                    canDragItem={(request) =>
                      !isUpdatingStatus &&
                      !isFetching &&
                      request.capabilities.canUpdateStatus &&
                      !terminalStatuses.has(request.status)
                    }
                    canDropItem={(request, destinationStage) =>
                      request.allowedNextStatuses.includes(
                        destinationStage as RequestStatus,
                      )
                    }
                    onInvalidDrop={() =>
                      toast.info("لا يمكن نقل الفرصة إلى هذه المرحلة")
                    }
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage="حدث خطأ أثناء تحميل الفرص"
                    emptyMessage="لا توجد فرص مطابقة للبحث أو الفلتر الحالي"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
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
                  {requests.length === 0 ? (
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
                    requests.map((request) => {
                      const action = getSalesPipelineAction(request);

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
                              <span className="truncate">
                                {request.companyName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {request.client?.companyName || "عميل جديد"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getRequestStatusBadgeVariant(
                                request.status,
                              )}
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
                                {request.status === RequestStatus.CANCELLED
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
                            {request.status ===
                              RequestStatus.PROPOSAL_IN_PROGRESS ||
                            request.status === RequestStatus.PROPOSAL_SENT ||
                            request.status === RequestStatus.NEGOTIATION ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openProposalDialog(request)}
                              >
                                <action.icon data-icon="inline-start" />
                                فتح
                              </Button>
                            ) : request.status ===
                                RequestStatus.CONTRACT_PREPARATION ||
                              request.status === RequestStatus.CONTRACT_SENT ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openContractDialog(request)}
                              >
                                <action.icon data-icon="inline-start" />
                                فتح
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={action.href}>
                                  <ArrowUpLeft data-icon="inline-start" />
                                  فتح
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {view === "kanban" &&
            (currentData?.meta.total ?? 0) > boardItems.length && (
              <div className="flex items-center justify-center border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {isFetching
                    ? "جارٍ تحميل المزيد..."
                    : `تحميل المزيد (${formatNumber(
                        (currentData?.meta.total ?? 0) - boardItems.length,
                      )})`}
                </Button>
              </div>
            )}

          {view === "table" && (currentData?.meta.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {page} من {currentData?.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  page >= (currentData?.meta.totalPages ?? 1) || isFetching
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      currentData?.meta.totalPages ?? current,
                      current + 1,
                    ),
                  )
                }
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {workflowDialog?.type === "proposal" &&
      workflowDialog.mode === "create" ? (
        <ProposalFormDialog
          mode="create"
          preSelectedRequestId={workflowDialog.requestId}
          open
          onOpenChange={handleWorkflowDialogChange}
        />
      ) : null}

      {workflowDialog?.type === "proposal" &&
      workflowDialog.mode === "edit" &&
      !proposalForEdit ? (
        <Dialog
          open
          onOpenChange={handleWorkflowDialogChange}
          title="فتح العرض"
        >
          <div className="flex flex-col gap-4 py-4 text-sm text-muted-foreground">
            <p>
              {isProposalEditFetching
                ? "جارٍ تحميل بيانات العرض..."
                : isProposalEditError
                  ? "تعذر تحميل بيانات العرض. يمكنك إغلاق النافذة والمحاولة مرة أخرى."
                  : "جارٍ تجهيز بيانات العرض..."}
            </p>
            {!isProposalEditFetching && (
              <Button onClick={() => handleWorkflowDialogChange(false)}>
                إغلاق
              </Button>
            )}
          </div>
        </Dialog>
      ) : workflowDialog?.type === "proposal" &&
        workflowDialog.mode === "edit" &&
        proposalForEdit ? (
        <ProposalFormDialog
          mode="edit"
          proposal={proposalForEdit}
          open
          onOpenChange={handleWorkflowDialogChange}
        />
      ) : null}

      {workflowDialog?.type === "contract" &&
      workflowDialog.mode === "create" ? (
        <CreateContractDialog
          mode="create"
          preSelectedRequestId={workflowDialog.requestId}
          open
          onOpenChange={handleWorkflowDialogChange}
        />
      ) : null}

      {workflowDialog?.type === "contract" &&
      workflowDialog.mode === "edit" &&
      !contractForEdit ? (
        <Dialog
          open
          onOpenChange={handleWorkflowDialogChange}
          title="فتح العقد"
        >
          <div className="flex flex-col gap-4 py-4 text-sm text-muted-foreground">
            <p>
              {isContractEditFetching
                ? "جارٍ تحميل بيانات العقد..."
                : isContractEditError
                  ? "تعذر تحميل بيانات العقد. يمكنك إغلاق النافذة والمحاولة مرة أخرى."
                  : "جارٍ تجهيز بيانات العقد..."}
            </p>
            {!isContractEditFetching && (
              <Button onClick={() => handleWorkflowDialogChange(false)}>
                إغلاق
              </Button>
            )}
          </div>
        </Dialog>
      ) : workflowDialog?.type === "contract" &&
        workflowDialog.mode === "edit" &&
        contractForEdit ? (
        <CreateContractDialog
          mode="edit"
          contract={contractForEdit}
          open
          onOpenChange={handleWorkflowDialogChange}
        />
      ) : null}
    </div>
  );
}
