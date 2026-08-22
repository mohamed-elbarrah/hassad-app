"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  ClipboardList,
  CircleAlert,
  Clock3,
  FileSignature,
  FileText,
  History,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ClientKind, ContactLogResult, RequestStatus } from "@hassad/shared";
import {
  useGetRequestContactLogsQuery,
  type CreateRequestContactLogPayload,
  type RequestContactLogItem,
  type RequestDetail,
  type RequestStatusHistoryItem,
} from "@/features/requests/requestsApi";
import { RequestContactLogDialog } from "@/components/request-detail/RequestContactLogDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import {
  businessTypeLabel,
  clientKindLabel,
  clientSourceLabel,
  clientStatusLabel,
  contractStatusLabel,
  portalProjectStatusLabel,
  proposalStatusLabel,
  requestContactResultLabel,
  requestContactTypeLabel,
  requestStatusLabel,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

const REQUEST_STAGE_ORDER: RequestStatus[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.QUALIFYING,
  RequestStatus.PROPOSAL_IN_PROGRESS,
  RequestStatus.PROPOSAL_SENT,
  RequestStatus.NEGOTIATION,
  RequestStatus.CONTRACT_PREPARATION,
  RequestStatus.CONTRACT_SENT,
  RequestStatus.SIGNED,
  RequestStatus.PROJECT_CREATED,
];

function requestStatusVariant(status: RequestStatus) {
  if (status === RequestStatus.CANCELLED) return "destructive" as const;
  if (
    status === RequestStatus.SIGNED ||
    status === RequestStatus.PROJECT_CREATED
  ) {
    return "secondary" as const;
  }
  if (
    status === RequestStatus.PROPOSAL_SENT ||
    status === RequestStatus.NEGOTIATION ||
    status === RequestStatus.CONTRACT_PREPARATION ||
    status === RequestStatus.CONTRACT_SENT
  ) {
    return "default" as const;
  }
  return "outline" as const;
}

function resultVariant(result: ContactLogResult) {
  if (result === ContactLogResult.RESPONDED) return "secondary" as const;
  if (
    result === ContactLogResult.WRONG_NUMBER ||
    result === ContactLogResult.NOT_INTERESTED
  ) {
    return "destructive" as const;
  }
  return "outline" as const;
}

function getInitials(value?: string | null) {
  if (!value) return "؟";
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function getWhatsAppHref(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return `https://wa.me/${digits.slice(2)}`;
  if (digits.startsWith("966")) return `https://wa.me/${digits}`;
  if (digits.startsWith("05") && digits.length === 10) {
    return `https://wa.me/966${digits.slice(1)}`;
  }
  if (digits.startsWith("5") && digits.length === 9) {
    return `https://wa.me/966${digits}`;
  }
  return null;
}

function Field({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string | null;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium" dir={dir}>
        {value || "—"}
      </span>
    </div>
  );
}

function Journey({
  request,
  onStageChange,
  isUpdatingStage,
}: {
  request: RequestDetail;
  onStageChange?: (status: RequestStatus) => Promise<void>;
  isUpdatingStage?: boolean;
}) {
  const currentIndex = REQUEST_STAGE_ORDER.indexOf(request.status);
  const isCancelled = request.status === RequestStatus.CANCELLED;
  const allowedStatuses = [
    request.status,
    ...(request.capabilities?.allowedNextStatuses ?? []),
  ].filter((status, index, statuses) => statuses.indexOf(status) === index);
  const nextStatus = request.capabilities?.allowedNextStatuses?.find(
    (status) => status !== RequestStatus.CANCELLED,
  );

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">رحلة الطلب</CardTitle>
            <CardDescription>
              اعرف موضع الطلب والخطوة التالية دون مغادرة هذه الصفحة.
            </CardDescription>
          </div>
          {onStageChange && request.capabilities?.canUpdateStatus ? (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Label htmlFor="sales-request-stage" className="sr-only">
                تغيير مرحلة الطلب
              </Label>
              <Select
                value={request.status}
                onValueChange={(value) => onStageChange(value as RequestStatus)}
                disabled={isUpdatingStage}
              >
                <SelectTrigger
                  id="sales-request-stage"
                  className="min-h-11 w-full sm:w-48"
                >
                  <SelectValue placeholder="تغيير المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {allowedStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {requestStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {isCancelled ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            <CircleAlert
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1">
              <span className="font-medium">تم إلغاء هذا الطلب</span>
              <span className="text-sm text-destructive/80">
                لا توجد مراحل تشغيلية تالية لهذا السجل.
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div
                className="relative grid grid-cols-9 gap-0 before:absolute before:inset-x-[5.5%] before:top-5 before:h-px before:bg-border"
                role="list"
                aria-label="مراحل الطلب"
              >
                {REQUEST_STAGE_ORDER.map((status, index) => {
                  const isCurrent = status === request.status;
                  const isComplete = currentIndex >= 0 && index < currentIndex;

                  return (
                    <div
                      key={status}
                      className="relative z-10 flex min-w-0 flex-col items-center gap-3 text-center"
                      role="listitem"
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full border-2 bg-background text-sm font-semibold transition-colors",
                          isCurrent &&
                            "border-primary bg-primary text-primary-foreground",
                          isComplete &&
                            "border-primary/40 bg-primary/10 text-primary",
                          !isCurrent &&
                            !isComplete &&
                            "border-border text-muted-foreground",
                        )}
                      >
                        {isComplete ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          "max-w-24 text-xs leading-5",
                          isCurrent
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {requestStatusLabel(status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="flex flex-col md:hidden"
              role="list"
              aria-label="مراحل الطلب"
            >
              {REQUEST_STAGE_ORDER.map((status, index) => {
                const isCurrent = status === request.status;
                const isComplete = currentIndex >= 0 && index < currentIndex;
                const isLast = index === REQUEST_STAGE_ORDER.length - 1;

                return (
                  <div
                    key={status}
                    className="relative flex gap-3 pb-3 last:pb-0"
                    role="listitem"
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <div className="relative flex w-8 shrink-0 justify-center">
                      {!isLast ? (
                        <div
                          className={cn(
                            "absolute inset-y-8 w-px",
                            isComplete ? "bg-primary/40" : "bg-border",
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                      <div
                        className={cn(
                          "relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold",
                          isCurrent &&
                            "border-primary bg-primary text-primary-foreground",
                          isComplete &&
                            "border-primary/40 bg-primary/10 text-primary",
                          !isCurrent &&
                            !isComplete &&
                            "border-border text-muted-foreground",
                        )}
                      >
                        {isComplete ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                      <span
                        className={cn(
                          "truncate text-sm",
                          isCurrent
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {requestStatusLabel(status)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {isCurrent
                          ? "الحالية"
                          : isComplete
                            ? "مكتملة"
                            : "لاحقة"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
              <StageContext
                label="المرحلة الحالية"
                value={requestStatusLabel(request.status)}
              />
              <StageContext
                label="المرحلة التالية"
                value={
                  nextStatus
                    ? requestStatusLabel(nextStatus)
                    : "لا توجد خطوة تالية"
                }
              />
              <StageContext
                label="في المرحلة منذ"
                value={formatRelativeTime(request.currentStageSince)}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StageContext({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({ request }: { request: RequestDetail }) {
  const services = request.services ?? [];
  const sourceLabel = clientSourceLabel(request.source);
  const businessType = businessTypeLabel(request.businessType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ملخص الطلب</CardTitle>
        <CardDescription>
          المتطلبات والمعلومات التي يحتاجها فريق المبيعات قبل الخطوة التالية.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="اسم النشاط" value={request.businessName} />
          <Field label="نوع النشاط" value={businessType} />
          <Field label="مصدر الطلب" value={sourceLabel} />
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">الخدمات المطلوبة</h3>
            <Badge variant="outline">
              {formatNumber(services.length)} خدمات
            </Badge>
          </div>
          {services.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              لا توجد خدمات مرتبطة بهذا الطلب.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">
                      {service.service.nameAr || service.service.name}
                    </span>
                    {service.notes?.trim() ? (
                      <span className="text-sm leading-6 text-muted-foreground">
                        {service.notes}
                      </span>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="w-fit shrink-0">
                    الكمية: {formatNumber(service.quantity)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
          <span className="text-sm font-medium">ملاحظات الطلب</span>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {request.notes?.trim() || "لا توجد ملاحظات مسجلة حتى الآن."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientCard({ request }: { request: RequestDetail }) {
  const client = request.client;
  const clientKind = client?.kind ?? ClientKind.LEAD;
  const contactName = request.contactName || request.client?.user?.name;
  const phone = request.phoneWhatsapp || request.client?.user?.phoneWhatsapp;
  const email = request.email || request.client?.user?.email;
  const whatsappHref = getWhatsAppHref(phone);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(contactName || client?.companyName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-lg">العميل</CardTitle>
              <p className="truncate text-sm text-muted-foreground">
                {client?.companyName || request.companyName || "عميل غير محدد"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{clientKindLabel(clientKind)}</Badge>
                <Badge
                  variant={
                    client?.status === "SUSPENDED" ? "destructive" : "secondary"
                  }
                >
                  {client ? clientStatusLabel(client.status) : "غير مرتبط"}
                </Badge>
              </div>
            </div>
          </div>
          {client ? (
            <Button
              asChild
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
            >
              <Link href={`/dashboard/sales/clients/${client.id}`}>
                فتح ملف العميل
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : null}
        </div>
        <CardDescription>
          بيانات العميل وجهة الاتصال المرتبطة بهذا الطلب.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="جهة الاتصال" value={contactName} />
          <Field
            label="المسؤول"
            value={request.assignee?.name || client?.manager?.name}
          />
          <Field label="الهاتف" value={phone} dir="ltr" />
          <Field label="البريد الإلكتروني" value={email} dir="ltr" />
        </div>
        <div className="flex flex-wrap gap-2">
          {phone ? (
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <a
                href={`tel:${phone}`}
                dir="ltr"
                className="min-h-11"
                aria-label={`الاتصال بـ ${phone}`}
              >
                <Phone data-icon="inline-start" />
                اتصال
              </a>
            </Button>
          ) : null}
          {email ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="min-h-11"
                aria-label={`إرسال بريد إلى ${email}`}
              >
                <Mail data-icon="inline-start" />
                بريد إلكتروني
              </a>
            </Button>
          ) : null}
          {whatsappHref ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="min-h-11"
                aria-label="فتح محادثة واتساب"
              >
                <MessageCircle data-icon="inline-start" />
                واتساب
              </a>
            </Button>
          ) : null}
        </div>
        {!client ? (
          <p className="text-sm text-muted-foreground">
            لم يتم ربط هذا الطلب بملف عميل بعد.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

type Activity =
  | {
      id: string;
      type: "contact";
      at: string;
      log: RequestContactLogItem;
    }
  | {
      id: string;
      type: "status";
      at: string;
      entry: RequestStatusHistoryItem;
    };

function ActivityTimeline({ request }: { request: RequestDetail }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isError, refetch } = useGetRequestContactLogsQuery({
    id: request.id,
    page,
    limit,
  });
  const contactLogs = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const contactActivities: Activity[] = contactLogs.map((log) => ({
    id: `contact-${log.id}`,
    type: "contact" as const,
    at: log.contactedAt,
    log,
  }));
  const statusActivities: Activity[] = (request.statusHistory ?? []).map(
    (entry) => ({
      id: `status-${entry.id}`,
      type: "status" as const,
      at: entry.changedAt,
      entry,
    }),
  );
  const activities = [...contactActivities, ...statusActivities].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-lg">النشاط</CardTitle>
        <CardDescription>
          {data?.total != null
            ? `سجل التواصل (${formatNumber(data.total)} سجل) مع تغييرات المرحلة.`
            : "سجل التواصل وتغييرات المرحلة في مكان واحد."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex gap-3 border-b pb-6 last:border-b-0 last:pb-0"
              >
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-3 pb-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <Empty className="border bg-muted/20 p-8">
            <EmptyMedia variant="icon">
              <Clock3 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>تعذر تحميل النشاط</EmptyTitle>
              <EmptyDescription>
                تعذر تحميل سجلات التواصل. حاول إعادة المحاولة.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => refetch()}>
                إعادة المحاولة
              </Button>
            </EmptyContent>
          </Empty>
        ) : activities.length === 0 ? (
          <Empty className="border bg-muted/20 p-8">
            <EmptyMedia variant="icon">
              <Clock3 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا يوجد نشاط بعد</EmptyTitle>
              <EmptyDescription>
                ستظهر هنا محاولات التواصل وتغييرات المرحلة عند تسجيلها.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex gap-3 border-b pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="relative flex w-9 shrink-0 justify-center">
                    {index < activities.length - 1 ? (
                      <div
                        className="absolute inset-y-9 w-px bg-border"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div
                      className={cn(
                        "relative z-10 flex size-9 items-center justify-center rounded-full border bg-background",
                        activity.type === "contact"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {activity.type === "contact" ? (
                        <ContactActivityIcon type={activity.log.type} />
                      ) : (
                        <ArrowLeftRight className="size-4" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    {activity.type === "contact" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">
                            تواصل عبر{" "}
                            {requestContactTypeLabel(activity.log.type)}
                          </p>
                          <Badge variant={resultVariant(activity.log.result)}>
                            {requestContactResultLabel(activity.log.result)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.log.user?.name || "مستخدم غير محدد"} •{" "}
                          {formatDateTime(activity.log.contactedAt)}
                        </p>
                        {activity.log.notes?.trim() ? (
                          <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground">
                            {activity.log.notes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="font-medium">
                          {activity.entry.fromStatus
                            ? `انتقل الطلب من ${requestStatusLabel(activity.entry.fromStatus)} إلى ${requestStatusLabel(activity.entry.toStatus)}`
                            : `بدأ الطلب في مرحلة ${requestStatusLabel(activity.entry.toStatus)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.entry.changer?.name || "النظام"} •{" "}
                          {formatDateTime(activity.entry.changedAt)}
                        </p>
                        {activity.entry.note?.trim() ? (
                          <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground">
                            {activity.entry.note}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <Pagination className="justify-between border-t pt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      direction="rtl"
                      text="السابق"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={currentPage === 1 || isLoading}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => setPage(pageNumber)}
                          disabled={isLoading}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      direction="rtl"
                      text="التالي"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={currentPage === totalPages || isLoading}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactActivityIcon({ type }: { type: string }) {
  const Icon =
    type === "WHATSAPP"
      ? MessageCircle
      : type === "EMAIL"
        ? Mail
        : type === "MEETING"
          ? CalendarClock
          : PhoneCall;

  return <Icon className="size-4" aria-hidden="true" />;
}

function CommercialRecords({ request }: { request: RequestDetail }) {
  const hasRecords =
    request.proposals.length > 0 ||
    request.contracts.length > 0 ||
    Boolean(request.project);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">السجلات التجارية</CardTitle>
        <CardDescription>
          العروض والعقود والمشروع المرتبط بهذا الطلب في مكان واحد.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasRecords ? (
          <Empty className="border bg-muted/20 p-8">
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد سجلات تجارية بعد</EmptyTitle>
              <EmptyDescription>
                ستظهر العروض والعقود والمشروع هنا مع تقدم الطلب.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y">
            {request.proposals.map((proposal) => (
              <CommercialRecordRow
                key={proposal.id}
                icon={FileText}
                title={proposal.title}
                typeLabel="عرض سعر"
                createdAt={proposal.createdAt}
                amount={proposal.totalPrice}
                status={proposalStatusLabel(proposal.status)}
                statusVariant={
                  proposal.status === "APPROVED" ? "secondary" : "outline"
                }
                href={`/dashboard/sales/proposals/${proposal.id}`}
              />
            ))}

            {request.contracts.map((contract) => (
              <CommercialRecordRow
                key={contract.id}
                icon={FileSignature}
                title={contract.title}
                typeLabel="عقد"
                createdAt={contract.createdAt}
                amount={contract.totalValue}
                status={contractStatusLabel(contract.status)}
                statusVariant={
                  contract.status === "SIGNED" || contract.status === "ACTIVE"
                    ? "secondary"
                    : "outline"
                }
                href={`/dashboard/sales/contracts/${contract.id}`}
              />
            ))}

            {request.project ? (
              <CommercialRecordRow
                icon={Building2}
                title={request.project.name}
                typeLabel="مشروع"
                createdAt={request.project.createdAt}
                status={portalProjectStatusLabel(request.project.status)}
                statusVariant="secondary"
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommercialRecordRow({
  icon: Icon,
  title,
  typeLabel,
  createdAt,
  amount,
  status,
  statusVariant,
  href,
}: {
  icon: LucideIcon;
  title: string;
  typeLabel: string;
  createdAt: string;
  amount?: number;
  status: string;
  statusVariant: "secondary" | "outline";
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">
            {typeLabel} • {formatDateTime(createdAt)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {typeof amount === "number" ? (
          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
        ) : null}
        <Badge variant={statusVariant}>{status}</Badge>
        {href ? (
          <Button asChild size="sm" variant="outline" className="min-h-11">
            <Link href={href} aria-label={`فتح ${typeLabel}: ${title}`}>
              فتح
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SalesRequestWorkspace({
  request,
  backHref,
  backLabel,
  onStageChange,
  onAddContactLog,
  isUpdatingStage,
  isAddingContactLog,
}: {
  request: RequestDetail;
  backHref: string;
  backLabel: string;
  onStageChange?: (status: RequestStatus) => Promise<void>;
  onAddContactLog?: (payload: CreateRequestContactLogPayload) => Promise<void>;
  isUpdatingStage?: boolean;
  isAddingContactLog?: boolean;
}) {
  const stageLabel = requestStatusLabel(request.status);
  const recordCount =
    request.proposals.length +
    request.contracts.length +
    (request.project ? 1 : 0);

  return (
    <div className="flex min-h-full flex-col gap-5" dir="rtl">
      <PageHeader
        title="تفاصيل طلب المبيعات"
        description="مراجعة الطلب ومتابعة الخطوة التالية مع العميل."
        icon={ClipboardList}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <span className="text-xs text-muted-foreground">
              طلب #{request.id.slice(0, 8)}
            </span>
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link href={backHref}>
                <ArrowLeft data-icon="inline-start" />
                {backLabel}
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="border-primary/15">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                    {request.companyName || "طلب مبيعات"}
                  </h2>
                  <Badge variant={requestStatusVariant(request.status)}>
                    {stageLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  تم إنشاء الطلب {formatRelativeTime(request.createdAt)}
                </p>
              </div>
            </div>
            {onAddContactLog && request.capabilities?.canLogContact ? (
              <RequestContactLogDialog
                onSubmit={onAddContactLog}
                isSubmitting={isAddingContactLog}
                variant="default"
                size="sm"
                className="min-h-11"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ClientCard request={request} />

      <Tabs defaultValue="overview" dir="rtl" className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
            <TabsTrigger value="records">
              السجلات التجارية ({formatNumber(recordCount)})
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-0">
          <div className="flex flex-col gap-6">
            <Journey
              request={request}
              onStageChange={onStageChange}
              isUpdatingStage={isUpdatingStage}
            />
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <StageSignal
                icon={CalendarClock}
                label="آخر تحديث"
                value={formatRelativeTime(request.updatedAt)}
              />
              <StageSignal
                icon={PhoneCall}
                label="آخر تواصل"
                value={
                  request.lastContactAt
                    ? formatRelativeTime(request.lastContactAt)
                    : "لا يوجد"
                }
              />
              <StageSignal
                icon={History}
                label="محاولات التواصل"
                value={`${formatNumber(request.contactAttemptCount)} محاولة`}
              />
              <StageSignal
                icon={UserRound}
                label="المسؤول"
                value={request.assignee?.name || "غير محدد"}
              />
            </div>
            <SummaryCard request={request} />
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-0">
          <ActivityTimeline request={request} />
        </TabsContent>
        <TabsContent value="records" className="mt-0">
          <CommercialRecords request={request} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StageSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function SalesRequestWorkspaceLoading() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="hidden gap-3 md:grid md:grid-cols-9">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
