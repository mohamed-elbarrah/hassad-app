"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { shallowEqual } from "react-redux";
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
import { PageHeader } from "@/components/common/PageHeader";
import { createSalesPipelineConfig } from "@/components/dashboard/sales/pipeline/config";
import {
  getRequestStatusBadgeVariant,
  getSalesPipelineAction,
  SalesPipelineCard,
} from "@/components/dashboard/sales/pipeline/SalesPipelineCard";
import {
  salesApi,
  useAddSalesPipelineContactLogMutation,
  useGetSalesPipelineQuery,
  useUpdateSalesPipelineStatusMutation,
  type SalesPipelineFilters,
  type SalesPipelineGroup,
  type SalesPipelineItem,
} from "@/features/sales/salesApi";
import type { CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import { useGetProposalByIdQuery } from "@/features/proposals/proposalsApi";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ProposalFormDialog } from "@/components/dashboard/sales/ProposalFormDialog";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import {
  salesPipelineErrorMessage,
  salesWorkflowErrorMessage,
} from "@/lib/i18n";

type PipelineView = "kanban" | "table";
type PipelineFilterGroup = "all" | SalesPipelineGroup;

const SALES_PIPELINE_POLLING_INTERVAL_MS = 60_000;
type PipelineWorkflowDialog =
  | { type: "proposal"; mode: "create"; requestId: string }
  | { type: "proposal"; mode: "edit"; proposalId: string }
  | { type: "contract"; mode: "create"; requestId: string; proposalId: string }
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
  INTAKE: "الطلبات الجديدة",
  PROPOSAL: "العروض والمتابعة",
  CONTRACT: "العقود",
  WON: "الصفقات الناجحة",
  CANCELLED: "الطلبات الملغاة",
};

function getServiceCount(request: SalesPipelineItem) {
  return request.services?.length ?? 0;
}

interface BoardItemsState {
  pages: Record<number, SalesPipelineItem[]>;
  items: SalesPipelineItem[];
}

type BoardItemsAction =
  | { type: "replace-page"; page: number; items: SalesPipelineItem[] }
  | { type: "clear" };

const EMPTY_BOARD_ITEMS: BoardItemsState = { pages: {}, items: [] };

function flattenBoardPages(
  pages: Record<number, SalesPipelineItem[]>,
): SalesPipelineItem[] {
  const itemsById = new Map<string, SalesPipelineItem>();

  for (const page of Object.keys(pages)
    .map(Number)
    .sort((left, right) => left - right)) {
    for (const item of pages[page] ?? []) {
      itemsById.set(item.id, item);
    }
  }

  return [...itemsById.values()];
}

function boardItemsReducer(
  current: BoardItemsState,
  action: BoardItemsAction,
): BoardItemsState {
  if (action.type === "clear") return EMPTY_BOARD_ITEMS;
  if (current.pages[action.page] === action.items) return current;

  const pages = { ...current.pages, [action.page]: action.items };
  return { pages, items: flattenBoardPages(pages) };
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
    <div dir="rtl" className="flex flex-col gap-6">
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
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PipelineView>("kanban");
  const [statusGroup, setStatusGroup] = useState<PipelineFilterGroup>("all");
  const [page, setPage] = useState(1);
  const [boardState, dispatchBoardItems] = useReducer(
    boardItemsReducer,
    EMPTY_BOARD_ITEMS,
  );
  const [workflowDialog, setWorkflowDialog] =
    useState<PipelineWorkflowDialog | null>(null);
  const deferredSearch = useDeferredValue(search);
  const [updatePipelineStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSalesPipelineStatusMutation();
  const [addSalesPipelineContactLog, { isLoading: isAddingContactLog }] =
    useAddSalesPipelineContactLogMutation();

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

  const pipelineQueryArgs = useMemo<SalesPipelineFilters>(
    () => ({
      limit: view === "kanban" ? 500 : 50,
      view: view === "kanban" ? "board" : "table",
      search: deferredSearch.trim() || undefined,
      statusGroup: apiStatusGroup,
    }),
    [apiStatusGroup, deferredSearch, view],
  );
  const pollingOptions = useMemo(
    () => ({
      pollingInterval: SALES_PIPELINE_POLLING_INTERVAL_MS,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),
    [],
  );
  const firstPageQuery = useGetSalesPipelineQuery(
    {
      ...pipelineQueryArgs,
      page: view === "kanban" ? 1 : page,
    },
    pollingOptions,
  );
  const currentPageQuery = useGetSalesPipelineQuery(
    { ...pipelineQueryArgs, page },
    pollingOptions,
  );
  const firstPageData = firstPageQuery.currentData;
  const currentPageData = currentPageQuery.currentData;
  const currentData = currentPageData ?? firstPageData;
  const isLoading = currentPageQuery.isLoading;
  const isError = currentPageQuery.isError || firstPageQuery.isError;
  const isFetching = currentPageQuery.isFetching || firstPageQuery.isFetching;
  const loadedPageNumbers = useMemo(
    () =>
      Object.keys(boardState.pages)
        .map(Number)
        .sort((left, right) => left - right),
    [boardState.pages],
  );
  const backgroundPageNumbers = useMemo(
    () =>
      view === "kanban"
        ? loadedPageNumbers.filter(
            (pageNumber) => pageNumber !== 1 && pageNumber !== page,
          )
        : [],
    [loadedPageNumbers, page, view],
  );
  const backgroundPageKey = backgroundPageNumbers.join(",");
  const backgroundPageSelectors = useMemo(
    () =>
      backgroundPageNumbers.map((pageNumber) =>
        salesApi.endpoints.getSalesPipeline.select({
          ...pipelineQueryArgs,
          page: pageNumber,
        }),
      ),
    [backgroundPageNumbers, pipelineQueryArgs],
  );
  const backgroundPageItems = useAppSelector(
    (state) =>
      backgroundPageSelectors.map((selector) => selector(state).data?.items),
    shallowEqual,
  );

  useEffect(() => {
    if (view !== "kanban" || backgroundPageNumbers.length === 0) return;

    const subscriptions = backgroundPageNumbers.map((pageNumber) =>
      dispatch(
        salesApi.endpoints.getSalesPipeline.initiate(
          { ...pipelineQueryArgs, page: pageNumber },
          {
            subscriptionOptions: {
              pollingInterval: SALES_PIPELINE_POLLING_INTERVAL_MS,
              skipPollingIfUnfocused: true,
              refetchOnFocus: true,
              refetchOnReconnect: true,
            },
          },
        ),
      ),
    );

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [
    backgroundPageKey,
    backgroundPageNumbers,
    dispatch,
    pipelineQueryArgs,
    view,
  ]);

  useEffect(() => {
    if (view !== "kanban") return;

    backgroundPageItems.forEach((items, index) => {
      if (!items) return;
      dispatchBoardItems({
        type: "replace-page",
        page: backgroundPageNumbers[index],
        items,
      });
    });
  }, [backgroundPageItems, backgroundPageNumbers, view]);

  async function refetchPipeline() {
    const backgroundRefetches = backgroundPageNumbers.map((pageNumber) =>
      dispatch(
        salesApi.endpoints.getSalesPipeline.initiate(
          { ...pipelineQueryArgs, page: pageNumber },
          { forceRefetch: true, subscribe: false },
        ),
      ).unwrap(),
    );

    await Promise.all([
      firstPageQuery.refetch(),
      ...(page === 1 ? [] : [currentPageQuery.refetch()]),
      ...backgroundRefetches,
    ]);
  }

  useEffect(() => {
    if (view !== "kanban") {
      dispatchBoardItems({ type: "clear" });
      return;
    }

    if (firstPageData?.items) {
      dispatchBoardItems({
        type: "replace-page",
        page: 1,
        items: firstPageData.items,
      });
    }
    if (page > 1 && currentPageData?.items) {
      dispatchBoardItems({
        type: "replace-page",
        page,
        items: currentPageData.items,
      });
    }
  }, [currentPageData?.items, firstPageData?.items, page, view]);

  const requests = useMemo(
    () => (view === "kanban" ? boardState.items : (currentData?.items ?? [])),
    [boardState.items, currentData?.items, view],
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
        : {
            type: "contract",
            mode: "create",
            requestId: request.id,
            proposalId: request.proposals?.[0]?.id ?? "",
          },
    );
  }

  function resetBoardToFirstPage({ refetch = true } = {}) {
    setPage(1);
    dispatchBoardItems({ type: "clear" });
    if (refetch) void refetchPipeline();
  }

  function handleRefresh() {
    if (page === 1) {
      void refetchPipeline();
      return;
    }

    resetBoardToFirstPage({ refetch: false });
    void refetchPipeline();
  }

  function handleWorkflowSaved() {
    resetBoardToFirstPage({ refetch: false });
    void refetchPipeline();
  }

  function handleWorkflowDialogChange(open: boolean) {
    if (!open) setWorkflowDialog(null);
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
      resetBoardToFirstPage({ refetch: false });
    } catch (error) {
      toast.error(salesPipelineErrorMessage(error));
    }
  }

  async function handleAddContactLog(
    request: SalesPipelineItem,
    payload: CreateRequestContactLogPayload,
  ) {
    try {
      await addSalesPipelineContactLog({
        id: request.id,
        body: payload,
      }).unwrap();
      resetBoardToFirstPage({ refetch: false });
      toast.success("تم تسجيل التواصل");
    } catch (error) {
      toast.error(salesWorkflowErrorMessage(error));
      throw error;
    }
  }

  if (isLoading && requests.length === 0) {
    return <PipelinePageLoadingState />;
  }

  if (isError && requests.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col gap-6 ">
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
                <Button onClick={handleRefresh}>
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
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="خط المبيعات وإدارة الفرص"
        description="تابع كل فرصة من أول طلب حتى التوقيع، وانقلها بين المراحل بسهولة من نفس اللوحة."
        icon={KanbanSquare}
        actions={
          <>
            <Button variant="outline" onClick={handleRefresh}>
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
          </>
        }
      />

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

      <div className="flex flex-col gap-4">
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
                  dispatchBoardItems({ type: "clear" });
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
              dispatchBoardItems({ type: "clear" });
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
              dispatchBoardItems({ type: "clear" });
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
                  <Badge variant="warning">
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
                onAddContactLog={handleAddContactLog}
                canAddContactLog={request.capabilities.canLogContact}
                isAddingContactLog={isAddingContactLog}
              />
            )}
            onDragEnd={handleDragEnd}
            canDragItem={(request) =>
              !isUpdatingStatus &&
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
          (currentData?.meta.total ?? 0) > boardState.items.length && (
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
                      (currentData?.meta.total ?? 0) - boardState.items.length,
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
      </div>

      {workflowDialog?.type === "proposal" &&
      workflowDialog.mode === "create" ? (
        <ProposalFormDialog
          mode="create"
          preSelectedRequestId={workflowDialog.requestId}
          open
          onOpenChange={handleWorkflowDialogChange}
          onSaved={handleWorkflowSaved}
        />
      ) : null}

      {workflowDialog?.type === "proposal" &&
      workflowDialog.mode === "edit" &&
      !proposalForEdit ? (
        <Dialog open onOpenChange={handleWorkflowDialogChange}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>فتح العرض</DialogTitle>
              <DialogDescription>
                جارٍ تحميل بيانات العرض أو تعذر تحميلها.
              </DialogDescription>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      ) : workflowDialog?.type === "proposal" &&
        workflowDialog.mode === "edit" &&
        proposalForEdit ? (
        <ProposalFormDialog
          mode="edit"
          proposal={proposalForEdit}
          open
          onOpenChange={handleWorkflowDialogChange}
          onSaved={handleWorkflowSaved}
        />
      ) : null}

      {workflowDialog?.type === "contract" &&
      workflowDialog.mode === "create" ? (
        <CreateContractDialog
          mode="create"
          preSelectedRequestId={workflowDialog.requestId}
          proposalId={workflowDialog.proposalId}
          open
          onOpenChange={handleWorkflowDialogChange}
          onSaved={handleWorkflowSaved}
        />
      ) : null}

      {workflowDialog?.type === "contract" &&
      workflowDialog.mode === "edit" &&
      !contractForEdit ? (
        <Dialog open onOpenChange={handleWorkflowDialogChange}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>فتح العقد</DialogTitle>
              <DialogDescription>
                جارٍ تحميل بيانات العقد أو تعذر تحميلها.
              </DialogDescription>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      ) : workflowDialog?.type === "contract" &&
        workflowDialog.mode === "edit" &&
        contractForEdit ? (
        <CreateContractDialog
          mode="edit"
          contract={contractForEdit}
          open
          onOpenChange={handleWorkflowDialogChange}
          onSaved={handleWorkflowSaved}
        />
      ) : null}
    </div>
  );
}
