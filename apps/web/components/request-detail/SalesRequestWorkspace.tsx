"use client";

import Link from "next/link";
import {
  ArrowLeft,
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
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ClientKind, ContactLogResult, RequestStatus } from "@hassad/shared";
import type {
  CreateRequestContactLogPayload,
  RequestContactLogItem,
  RequestDetail,
  RequestStatusHistoryItem,
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
  return (
    <div className="flex flex-col gap-4 border-t px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">رحلة الطلب</h3>
          <p className="text-sm text-muted-foreground">
            تابع انتقال الطلب بين المراحل واتخذ الخطوة التالية من نفس المكان.
          </p>
        </div>
        {onStageChange && request.capabilities?.canUpdateStatus ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="sales-request-stage" className="sr-only">
              تغيير مرحلة الطلب
            </Label>
            <Select
              value={request.status}
              onValueChange={(value) => onStageChange(value as RequestStatus)}
              disabled={isUpdatingStage}
            >
              <SelectTrigger id="sales-request-stage" className="w-44">
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
      {isCancelled ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <CircleAlert aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="font-medium">تم إلغاء هذا الطلب</span>
            <span className="text-sm text-destructive/80">
              لا توجد مراحل تشغيلية تالية لهذا السجل.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {REQUEST_STAGE_ORDER.map((status, index) => {
              const isCurrent = status === request.status;
              const isComplete = currentIndex >= 0 && index < currentIndex;
              const isLast = index === REQUEST_STAGE_ORDER.length - 1;

              return (
                <div
                  key={status}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border text-sm font-semibold",
                        isCurrent &&
                          "border-primary bg-primary text-primary-foreground",
                        isComplete &&
                          "border-primary/30 bg-primary/10 text-primary",
                        !isCurrent &&
                          !isComplete &&
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {isComplete ? <Check aria-hidden="true" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs leading-5",
                        isCurrent
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {requestStatusLabel(status)}
                    </span>
                  </div>
                  {!isLast ? (
                    <div
                      className={cn(
                        "hidden h-px flex-1 md:block",
                        isComplete ? "bg-primary/40" : "bg-border",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              المرحلة الحالية منذ{" "}
              {formatRelativeTime(request.currentStageSince)}
            </span>
          </div>
        </div>
      )}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الشركة" value={request.companyName} />
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

function ContactPanel({ request }: { request: RequestDetail }) {
  const contactName = request.contactName || request.client?.user?.name;
  const phone = request.phoneWhatsapp || request.client?.user?.phoneWhatsapp;
  const email = request.email || request.client?.user?.email;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">معلومات التواصل</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {contactName || "جهة اتصال غير محددة"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {request.assignee?.name || "بدون مسؤول محدد"}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-3 text-sm">
          <div
            className={cn(
              "flex items-center gap-3 rounded-md p-2",
              phone ? "text-foreground" : "text-muted-foreground",
            )}
            dir="ltr"
          >
            <Phone aria-hidden="true" />
            <span>{phone || "لا يوجد رقم هاتف"}</span>
          </div>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 rounded-md p-2 text-foreground hover:bg-muted"
              dir="ltr"
            >
              <Mail aria-hidden="true" />
              <span className="truncate">{email}</span>
            </a>
          ) : (
            <div
              className="flex items-center gap-3 rounded-md p-2 text-muted-foreground"
              dir="ltr"
            >
              <Mail aria-hidden="true" />
              <span>لا يوجد بريد إلكتروني</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ClientContextCard({ request }: { request: RequestDetail }) {
  const client = request.client;
  const clientKind = client?.kind ?? ClientKind.LEAD;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">العميل المرتبط</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {client ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{client.companyName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{clientKindLabel(clientKind)}</Badge>
                  <Badge
                    variant={
                      client.status === "SUSPENDED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {clientStatusLabel(client.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="المسؤول"
                value={client.manager?.name || "غير محدد"}
              />
              <Field
                label="المشاريع"
                value={formatNumber(client.totalProjects ?? 0)}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            لم يتم ربط هذا الطلب بملف عميل بعد.
          </p>
        )}
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
  const activities: Activity[] = [
    ...(request.contactLogs ?? []).map((log) => ({
      id: `contact-${log.id}`,
      type: "contact" as const,
      at: log.contactedAt,
      log,
    })),
    ...(request.statusHistory ?? []).map((entry) => ({
      id: `status-${entry.id}`,
      type: "status" as const,
      at: entry.changedAt,
      entry,
    })),
  ].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>النشاط والتواصل</CardTitle>
            <CardDescription>
              سجل زمني واضح لكل ما حدث في هذا الطلب.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty className="border bg-muted/20 p-8">
            <EmptyMedia variant="icon">
              <Clock3 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا يوجد نشاط بعد</EmptyTitle>
              <EmptyDescription>
                سجّل أول تواصل أو غيّر مرحلة الطلب ليظهر النشاط هنا.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-0">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                <div className="relative flex w-5 shrink-0 justify-center">
                  {index < activities.length - 1 ? (
                    <div
                      className="absolute inset-y-5 border-r border-border"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div
                    className={cn(
                      "relative z-10 mt-1 flex size-5 items-center justify-center rounded-full border-2 bg-background",
                      activity.type === "contact"
                        ? "border-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    <div
                      className="size-1.5 rounded-full bg-current"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1 rounded-lg border p-4">
                  {activity.type === "contact" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            تم التواصل عبر{" "}
                            {requestContactTypeLabel(activity.log.type)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {activity.log.user?.name || "مستخدم غير محدد"} •{" "}
                            {formatDateTime(activity.log.contactedAt)}
                          </p>
                        </div>
                        <Badge variant={resultVariant(activity.log.result)}>
                          {requestContactResultLabel(activity.log.result)}
                        </Badge>
                      </div>
                      {activity.log.notes?.trim() ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {activity.log.notes}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">
                        {activity.entry.fromStatus
                          ? `انتقل الطلب من ${requestStatusLabel(activity.entry.fromStatus)} إلى ${requestStatusLabel(activity.entry.toStatus)}`
                          : `تم إنشاء الطلب في مرحلة ${requestStatusLabel(activity.entry.toStatus)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.entry.changer?.name || "النظام"} •{" "}
                        {formatDateTime(activity.entry.changedAt)}
                      </p>
                      {activity.entry.note?.trim() ? (
                        <p className="text-sm leading-6 text-muted-foreground">
                          {activity.entry.note}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommercialRecords({ request }: { request: RequestDetail }) {
  const hasRecords =
    request.proposals.length > 0 ||
    request.contracts.length > 0 ||
    Boolean(request.project);

  return (
    <Card>
      <CardHeader>
        <CardTitle>المسار التجاري</CardTitle>
        <CardDescription>
          العروض والعقود والمشروع المرتبط بهذا الطلب.
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
          <div className="flex flex-col gap-3">
            {request.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{proposal.title}</span>
                    <span className="text-sm text-muted-foreground">
                      عرض سعر • {formatDateTime(proposal.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof proposal.totalPrice === "number" ? (
                    <span className="text-sm font-medium">
                      {formatCurrency(proposal.totalPrice)}
                    </span>
                  ) : null}
                  <Badge
                    variant={
                      proposal.status === "APPROVED" ? "secondary" : "outline"
                    }
                  >
                    {proposalStatusLabel(proposal.status)}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/sales/proposals/${proposal.id}`}>
                      فتح
                      <ArrowUpRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {request.contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileSignature aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{contract.title}</span>
                    <span className="text-sm text-muted-foreground">
                      عقد • {formatDateTime(contract.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof contract.totalValue === "number" ? (
                    <span className="text-sm font-medium">
                      {formatCurrency(contract.totalValue)}
                    </span>
                  ) : null}
                  <Badge
                    variant={
                      contract.status === "SIGNED" ||
                      contract.status === "ACTIVE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {contractStatusLabel(contract.status)}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/sales/contracts/${contract.id}`}>
                      فتح
                      <ArrowUpRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {request.project ? (
              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Building2 aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{request.project.name}</span>
                    <span className="text-sm text-muted-foreground">
                      مشروع • {formatDateTime(request.project.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {portalProjectStatusLabel(request.project.status)}
                  </Badge>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
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
  const clientKind = request.client?.kind ?? ClientKind.LEAD;
  const phone = request.phoneWhatsapp || request.client?.user?.phoneWhatsapp;
  const email = request.email || request.client?.user?.email;
  const whatsappHref = getWhatsAppHref(phone);
  const nextStatus = request.capabilities?.allowedNextStatuses?.find(
    (status) => status !== RequestStatus.CANCELLED,
  );

  return (
    <div
      className="flex min-h-full flex-col gap-6    "
      dir="rtl"
    >
      <PageHeader
        title="تفاصيل طلب المبيعات"
        description="مراجعة تفاصيل الطلب ومتابعة الخطوة التالية مع العميل."
        icon={ClipboardList}
        actions={
          <>
            <span className="text-xs text-muted-foreground">
              طلب #{request.id.slice(0, 8)}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href={backHref}>
                <ArrowLeft data-icon="inline-start" />
                {backLabel}
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden border-primary/15">
        <CardContent className="flex flex-col gap-5 p-0">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Building2 className="size-7" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {request.companyName}
                  </h2>
                  <Badge
                    variant={requestStatusVariant(request.status)}
                    className="px-3 py-1"
                  >
                    {stageLabel}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {clientKindLabel(clientKind)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.contactName || "جهة اتصال غير محددة"} • تم إنشاء
                  الطلب {formatRelativeTime(request.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
                    >
                      <Phone aria-hidden="true" /> {phone}
                    </a>
                  ) : null}
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      dir="ltr"
                      className="inline-flex max-w-full items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
                    >
                      <Mail aria-hidden="true" />
                      <span className="truncate">{email}</span>
                    </a>
                  ) : null}
                  <span className="inline-flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-muted-foreground">
                    <CalendarClock aria-hidden="true" /> آخر تحديث{" "}
                    {formatRelativeTime(request.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:max-w-sm lg:justify-end">
              {onAddContactLog && request.capabilities?.canLogContact ? (
                <RequestContactLogDialog
                  onSubmit={onAddContactLog}
                  isSubmitting={isAddingContactLog}
                  variant="default"
                  size="sm"
                />
              ) : null}
              {whatsappHref ? (
                <Button asChild variant="outline" size="sm">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle data-icon="inline-start" /> واتساب
                  </a>
                </Button>
              ) : null}
              {request.client ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/sales/clients/${request.client.id}`}>
                    <UsersRound data-icon="inline-start" /> ملف العميل
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 bg-muted/30 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Send className="size-4 text-primary" aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  التقدم التالي
                </span>
                <span className="truncate text-sm font-medium">
                  {nextStatus
                    ? requestStatusLabel(nextStatus)
                    : "لا توجد خطوة تالية"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserRound
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">المسؤول</span>
                <span className="truncate text-sm font-medium">
                  {request.assignee?.name || "غير محدد"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PhoneCall
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">آخر تواصل</span>
                <span className="truncate text-sm font-medium">
                  {request.lastContactAt
                    ? formatRelativeTime(request.lastContactAt)
                    : "لا يوجد"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <History
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  محاولات التواصل
                </span>
                <span className="truncate text-sm font-medium">
                  {formatNumber(request.contactAttemptCount)} محاولة
                </span>
              </div>
            </div>
          </div>
          <Journey
            request={request}
            onStageChange={onStageChange}
            isUpdatingStage={isUpdatingStage}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SummaryCard request={request} />
          <ActivityTimeline request={request} />
          <CommercialRecords request={request} />
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <ContactPanel request={request} />
          <ClientContextCard request={request} />
        </aside>
      </div>
    </div>
  );
}

export function SalesRequestWorkspaceLoading() {
  return (
    <div
      className="flex flex-col gap-6    "
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-9">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[34rem] rounded-xl" />
          <Skeleton className="h-[28rem] rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
