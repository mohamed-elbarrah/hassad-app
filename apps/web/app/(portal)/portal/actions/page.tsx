"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BellOff,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hourglass,
  Settings,
} from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSnoozeActionItem } from "@/hooks/useSnoozeActionItem";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  useGetActionItemsQuery,
  useGetSnoozedActionItemsQuery,
  type SnoozedActionItem,
} from "@/features/portal/portalApi";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "DELIVERABLE_APPROVAL", label: "مراجعة تسليمات" },
  { value: "INVOICE_PAYMENT", label: "دفع فواتير" },
  { value: "PROPOSAL_REVIEW", label: "مراجعة عروض" },
  { value: "CONTRACT_SIGN", label: "توقيع عقود" },
  { value: "STRATEGY_REVIEW", label: "مراجعة دراسة تسويقية" },
];

const TYPE_CONFIG: Record<string, string> = {
  DELIVERABLE_APPROVAL: "مراجعة تسليم",
  INVOICE_PAYMENT: "دفع فاتورة",
  PROPOSAL_REVIEW: "مراجعة عرض",
  CONTRACT_SIGN: "توقيع عقد",
  STRATEGY_REVIEW: "مراجعة دراسة تسويقية",
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; variant: "destructive" | "secondary" | "outline" }
> = {
  high: { label: "عاجل", variant: "destructive" },
  normal: { label: "عادي", variant: "secondary" },
  low: { label: "منخفض", variant: "outline" },
};

const PAGE_SIZE = 6;

function getTypeLabel(type: string): string {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
}

/** Friendly "23 Aug 2026, 14:30" formatter using Arabic-locale Latin digits. */
function formatReminderTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PortalActionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"now" | "snoozed">("now");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data, isLoading, isError, refetch } = useGetActionItemsQuery(
    {
      type: typeFilter === "all" ? undefined : typeFilter,
      page,
      limit: PAGE_SIZE,
    },
    {
      skip: !clientId || activeTab !== "now",
      pollingInterval: PORTAL_POLLING_INTERVAL_MS,
    },
  );

  const {
    data: snoozedData,
    isLoading: snoozedLoading,
    isError: snoozedError,
    refetch: refetchSnoozed,
  } = useGetSnoozedActionItemsQuery(
    { activeOnly: true },
    {
      skip: !clientId || activeTab !== "snoozed",
      pollingInterval: PORTAL_POLLING_INTERVAL_MS,
    },
  );

  const { snoozeItem, unsnoozeItem } = useSnoozeActionItem();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const snoozedItems = snoozedData ?? [];

  /** Snooze an item from the "الآن" tab. */
  const handleSnooze = async (item: {
    id: string;
    type: string;
    title: string;
  }) => {
    setBusyId(item.id);
    await snoozeItem(item.type, item.id);
    setBusyId(null);
  };

  /** Cancel an existing snooze from the "المؤجلة" tab. */
  const handleUnsnooze = async (item: SnoozedActionItem) => {
    setBusyId(item.id);
    await unsnoozeItem(item.type, item.id);
    setBusyId(null);
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">إجراءات تتطلب تدخلك</CardTitle>
              <CardDescription>
                جميع الإجراءات التي تحتاج مراجعتك أو موافقتك ضمن نفس تجربة
                العميل الموحدة.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "now" | "snoozed")}>
        <TabsList className="h-auto w-fit flex-wrap [&_svg]:size-4">
          <TabsTrigger value="now" className="gap-2">
            <Bell />
            الآن
            {!isLoading && items.length > 0 && (
              <Badge className="px-1.5 py-0">{items.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="snoozed" className="gap-2">
            <Hourglass />
            المؤجلة
            {!snoozedLoading && snoozedItems.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0">
                {snoozedItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="now" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="size-5 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">الإجراءات المعلقة</CardTitle>
                    <CardDescription>
                      راجع ما يتطلب تدخلك واتخذ الإجراء المناسب
                    </CardDescription>
                  </div>
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full lg:w-[220px]">
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            {isLoading ? (
              <CardContent className="flex flex-col gap-3 pt-6">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            ) : isError ? (
              <CardContent className="pt-6">
                <PortalEmptyState
                  icon={AlertCircle}
                  title="تعذر تحميل الإجراءات"
                  description="حدث خطأ أثناء تحميل الإجراءات."
                  actionLabel="إعادة المحاولة"
                  onAction={() => refetch()}
                />
              </CardContent>
            ) : items.length === 0 ? (
              <CardContent className="pt-6">
                <PortalEmptyState
                  icon={CheckCircle2}
                  title="لا توجد إجراءات معلقة"
                  description="ستظهر هنا جميع الإجراءات التي تتطلب مراجعتك وموافقتك."
                />
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>التفاصيل</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-end">
                      <span className="sr-only">الإجراء</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const priorityCfg =
                      PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.normal;
                    const isBusy = busyId === item.id;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {item.subtitle}
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityCfg.variant}>
                            {priorityCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.dueDate ? (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {new Date(item.dueDate).toLocaleDateString(
                                "ar-SA-u-nu-latn",
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSnooze(item)}
                              disabled={isBusy}
                              title="تأجيل التذكير 24 ساعة"
                            >
                              <BellOff data-icon="inline-start" />
                              {isBusy ? "جاري التأجيل..." : "ذكرني لاحقاً"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => router.push(item.actionUrl)}
                            >
                              <ExternalLink data-icon="inline-start" />
                              اتخاذ إجراء
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          {!isLoading && !isError && totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text="السابق"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <PaginationItem key={number}>
                      <PaginationLink
                        isActive={page === number}
                        onClick={() => setPage(number)}
                      >
                        {number}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    text="التالي"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="snoozed" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Hourglass className="size-5 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">الإجراءات المؤجلة</CardTitle>
                  <CardDescription>
                    إجراءات أخّرتها مؤقتاً. سيتم تذكيرك عند انتهاء مدة التأجيل.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {snoozedLoading ? (
              <CardContent className="flex flex-col gap-3 pt-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            ) : snoozedError ? (
              <CardContent className="pt-6">
                <PortalEmptyState
                  icon={AlertCircle}
                  title="تعذر تحميل الإجراءات المؤجلة"
                  description="حدث خطأ أثناء تحميل الإجراءات المؤجلة."
                  actionLabel="إعادة المحاولة"
                  onAction={() => refetchSnoozed()}
                />
              </CardContent>
            ) : snoozedItems.length === 0 ? (
              <CardContent className="pt-6">
                <PortalEmptyState
                  icon={Hourglass}
                  title="لا توجد إجراءات مؤجلة"
                  description="عند تأجيل أي إجراء سيظهر هنا مع موعد التذكير."
                />
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>التفاصيل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>التذكير</TableHead>
                    <TableHead className="text-end">
                      <span className="sr-only">الإجراء</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snoozedItems.map((item) => {
                    const isBusy = busyId === item.id;
                    const reminderLabel = item.reminderSentAt
                      ? "تم إرسال التذكير"
                      : formatReminderTime(item.snoozedUntil);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {item.subtitle}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarClock
                              className={cn(
                                "size-4",
                                item.reminderSentAt
                                  ? "text-muted-foreground"
                                  : "text-primary",
                              )}
                            />
                            <span
                              className={cn(
                                item.reminderSentAt
                                  ? "text-muted-foreground line-through"
                                  : "font-medium",
                              )}
                            >
                              {reminderLabel}
                            </span>
                            {item.reminderSentAt && (
                              <Badge variant="secondary">مُنبّه</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnsnooze(item)}
                              disabled={isBusy}
                              title="إلغاء التأجيل وإعادة الإجراء للقائمة"
                            >
                              <Bell data-icon="inline-start" />
                              {isBusy ? "جاري الإلغاء..." : "إلغاء التأجيل"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => router.push(item.actionUrl)}
                            >
                              <ExternalLink data-icon="inline-start" />
                              اتخاذ إجراء
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
