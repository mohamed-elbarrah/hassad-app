"use client";

import Link from "next/link";
import { Fragment } from "react";
import {
  Building2,
  ClipboardList,
  FileSignature,
  FileText,
  FolderKanban,
  History,
  Inbox,
  Phone,
  Users,
} from "lucide-react";
import {
  BUSINESS_TYPE_AR,
  CLIENT_SOURCE_AR,
  ContactLogResult,
  ContactLogType,
  REQUEST_STATUS_AR,
  RequestStatus,
} from "@hassad/shared";
import type { RequestContactLogPayload } from "@/components/request-detail/RequestContactLogDialog";

interface RequestContactLogItem {
  id: string;
  type: ContactLogType;
  result: ContactLogResult;
  notes?: string | null;
  contactedAt: string;
  user: { name: string };
}

interface RequestStatusHistoryItem {
  id: string;
  fromStatus?: RequestStatus | null;
  toStatus: RequestStatus;
  changedAt: string;
  changer?: { name: string } | null;
  note?: string | null;
}

interface RequestDetail {
  id: string;
  clientId: string;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  businessName: string;
  businessType: string;
  source: string;
  notes?: string | null;
  status: RequestStatus;
  contactAttemptCount: number;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; companyName: string } | null;
  assignee?: { id: string; name: string; email?: string } | null;
  services?: Array<{ id: string; serviceId: string; quantity: number; notes?: string | null; service?: { id: string; name: string; nameAr?: string | null } }>;
  capabilities?: { canLogContact: boolean; canUpdateStatus: boolean; allowedNextStatuses: RequestStatus[] };
  statusHistory: RequestStatusHistoryItem[];
  contactLogs: RequestContactLogItem[];
  currentStageSince: string;
  proposals: Array<{ id: string; title: string; status: string; totalPrice?: number; createdAt: string }>;
  contracts: Array<{ id: string; title: string; status: string; totalValue?: number; createdAt: string }>;
  project?: { id: string; name: string; status: string; startDate?: string; endDate?: string; createdAt: string } | null;
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RequestContactLogDialog } from "@/components/request-detail/RequestContactLogDialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import { contractStatusLabel, portalProjectStatusLabel, proposalStatusLabel, UNKNOWN_STATUS_LABEL } from "@/lib/i18n";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type DetailMode = "admin" | "sales";

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
  RequestStatus.CANCELLED,
];

const CONTACT_LOG_TYPE_LABELS: Record<string, string> = {
  [ContactLogType.CALL]: "مكالمة",
  [ContactLogType.WHATSAPP]: "واتساب",
  [ContactLogType.MEETING]: "اجتماع",
  [ContactLogType.EMAIL]: "بريد",
};

const CONTACT_LOG_RESULT_LABELS: Record<string, string> = {
  [ContactLogResult.RESPONDED]: "تم الرد",
  [ContactLogResult.NO_RESPONSE]: "لا يوجد رد",
  [ContactLogResult.BUSY]: "مشغول",
  [ContactLogResult.WRONG_NUMBER]: "رقم خاطئ",
  [ContactLogResult.NOT_INTERESTED]: "غير مهتم",
};

function statusVariant(status?: string | null) {
  switch (status) {
    case RequestStatus.PROJECT_CREATED:
    case RequestStatus.SIGNED:
      return "secondary";
    case RequestStatus.CANCELLED:
      return "destructive";
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
    case RequestStatus.CONTRACT_PREPARATION:
    case RequestStatus.CONTRACT_SENT:
      return "default";
    default:
      return "outline";
  }
}

function logResultVariant(result?: string | null) {
  switch (result) {
    case ContactLogResult.RESPONDED:
      return "secondary";
    case ContactLogResult.WRONG_NUMBER:
    case ContactLogResult.NOT_INTERESTED:
      return "destructive";
    case ContactLogResult.NO_RESPONSE:
    case ContactLogResult.BUSY:
      return "default";
    default:
      return "outline";
  }
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border bg-muted/20 p-8">
      <EmptyMedia variant="icon">
        <Inbox />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function InfoField({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string | null;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium" dir={dir}>
        {value || "—"}
      </p>
    </div>
  );
}

export function RequestDetailLoading() {
  return (
    <div className="flex flex-col gap-6   " dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

function RelatedRecords({
  request,
  mode,
}: {
  request: RequestDetail;
  mode: DetailMode;
}) {
  const hasContent =
    request.proposals.length > 0 ||
    request.contracts.length > 0 ||
    Boolean(request.project) ||
    Boolean(request.client);

  if (!hasContent) {
    return (
      <EmptyPanel
        title="لا توجد عناصر مرتبطة بعد"
        description="العروض والعقود والمشروع الناتج ستظهر هنا عند تقدم الفرصة داخل القمع."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {request.client ? (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {request.client.companyName}
              </span>
              <span className="text-xs text-muted-foreground">
                تم ربط السجل بعميل
              </span>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/dashboard/${mode === "admin" ? "admin" : "sales"}/clients/${request.client.id}`}
            >
              فتح ملف العميل
            </Link>
          </Button>
        </div>
      ) : null}

      {request.proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{proposal.title}</span>
              <span className="text-xs text-muted-foreground">
                {proposal.totalPrice
                  ? formatCurrency(proposal.totalPrice)
                  : formatDateTime(proposal.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(proposal.status)}>
              {proposalStatusLabel(proposal.status)}
            </Badge>
            {mode === "admin" ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/admin/proposals/${proposal.id}`}>
                  فتح
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ))}

      {request.contracts.map((contract) => (
        <div
          key={contract.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileSignature />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{contract.title}</span>
              <span className="text-xs text-muted-foreground">
                {contract.totalValue
                  ? formatCurrency(contract.totalValue)
                  : formatDateTime(contract.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(contract.status)}>
              {contractStatusLabel(contract.status)}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/dashboard/${mode === "admin" ? "admin" : "sales"}/contracts/${contract.id}`}
              >
                فتح
              </Link>
            </Button>
          </div>
        </div>
      ))}

      {request.project ? (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FolderKanban />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {request.project.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(request.project.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(request.project.status)}>
              {portalProjectStatusLabel(request.project.status)}
            </Badge>
            {mode === "admin" ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/admin/projects/${request.project.id}`}>
                  فتح
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContactLogsTable({ logs }: { logs: RequestContactLogItem[] }) {
  if (logs.length === 0) {
    return (
      <EmptyPanel
        title="لا يوجد سجل تواصل بعد"
        description="سجّل أول مكالمة أو اجتماع أو متابعة حتى يبدأ تتبع نشاط هذا العميل المحتمل."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>النوع</TableHead>
            <TableHead>النتيجة</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>بواسطة</TableHead>
            <TableHead>الملاحظات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {CONTACT_LOG_TYPE_LABELS[log.type] || log.type}
              </TableCell>
              <TableCell>
                <Badge variant={logResultVariant(log.result)}>
                  {CONTACT_LOG_RESULT_LABELS[log.result] || log.result}
                </Badge>
              </TableCell>
              <TableCell>{formatDateTime(log.contactedAt)}</TableCell>
              <TableCell>{log.user?.name || "—"}</TableCell>
              <TableCell className="max-w-[320px] truncate">
                {log.notes?.trim() || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusHistoryTable({
  entries,
}: {
  entries: RequestStatusHistoryItem[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyPanel
        title="لا يوجد سجل حالة بعد"
        description="أي انتقال بين مراحل القمع أو تدخل تشغيلي على الطلب سيظهر هنا."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>من</TableHead>
            <TableHead>إلى</TableHead>
            <TableHead>وقت التغيير</TableHead>
            <TableHead>بواسطة</TableHead>
            <TableHead>ملاحظة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...entries]
            .sort(
              (left, right) =>
                new Date(right.changedAt).getTime() -
                new Date(left.changedAt).getTime(),
            )
            .map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.fromStatus ? REQUEST_STATUS_AR[entry.fromStatus] : "—"}
                </TableCell>
                <TableCell>
                  {REQUEST_STATUS_AR[entry.toStatus] || entry.toStatus}
                </TableCell>
                <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                <TableCell>{entry.changer?.name || "—"}</TableCell>
                <TableCell className="max-w-[320px] truncate">
                  {entry.note?.trim() || "—"}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RequestDetailView({
  request,
  mode,
  backHref,
  backLabel,
  breadcrumbs,
  onStageChange,
  onAddContactLog,
  isUpdatingStage,
  isAddingContactLog,
}: {
  request: RequestDetail;
  mode: DetailMode;
  backHref: string;
  backLabel: string;
  breadcrumbs?: { label: string; href?: string }[];
  onStageChange?: (status: RequestStatus) => Promise<void>;
  onAddContactLog?: (payload: RequestContactLogPayload) => Promise<void>;
  isUpdatingStage?: boolean;
  isAddingContactLog?: boolean;
}) {
  const contactLogs = request.contactLogs ?? [];
  const statusHistory = request.statusHistory ?? [];
  const selectableStatuses = [
    request.status,
    ...(request.capabilities?.allowedNextStatuses ?? []),
  ].filter((status, index, statuses) => statuses.indexOf(status) === index);
  const services = request.services ?? [];
  const proposals = request.proposals ?? [];
  const contracts = request.contracts ?? [];
  const calls = contactLogs.filter((log) => log.type === ContactLogType.CALL);
  const meetings = contactLogs.filter(
    (log) => log.type === ContactLogType.MEETING,
  );
  const sourceLabel = CLIENT_SOURCE_AR[request.source] || request.source;
  const businessTypeLabel =
    BUSINESS_TYPE_AR[request.businessType] || request.businessType;
  const stageLabel = REQUEST_STATUS_AR[request.status] || UNKNOWN_STATUS_LABEL;

  const primaryFields = [
    { label: "اسم جهة الاتصال", value: request.contactName || "—" },
    {
      label: "الهاتف / واتساب",
      value: request.phoneWhatsapp || "—",
      dir: "ltr" as const,
    },
    {
      label: "البريد الإلكتروني",
      value: request.email || "—",
      dir: "ltr" as const,
    },
    { label: "المسؤول الحالي", value: request.assignee?.name || "غير محدد" },
    { label: "تاريخ إنشاء السجل", value: formatDateTime(request.createdAt) },
    {
      label: "آخر تواصل",
      value: request.lastContactAt
        ? formatDateTime(request.lastContactAt)
        : "لا يوجد",
    },
  ];

  const businessFields = [
    { label: "اسم الشركة", value: request.companyName || "—" },
    { label: "اسم النشاط", value: request.businessName || "—" },
    { label: "نوع النشاط", value: businessTypeLabel || "—" },
    { label: "المصدر", value: sourceLabel || "—" },
    { label: "الحالة الحالية", value: stageLabel },
    { label: "آخر تحديث", value: formatDateTime(request.updatedAt) },
  ];

  return (
    <div className="flex flex-col gap-6   " dir="rtl">
      {breadcrumbs?.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : <BreadcrumbPage>{item.label}</BreadcrumbPage>}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <PageHeader
        title={request.companyName}
        description={`جهة الاتصال: ${request.contactName || "—"}${request.businessName ? ` • النشاط: ${request.businessName}` : ""}`}
        icon={Building2}
        actions={
          <>
            <Badge variant={statusVariant(request.status)}>{stageLabel}</Badge>
            <Button asChild variant="outline">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
            {request.client ? (
              <Button asChild variant="outline">
                <Link href={`/dashboard/${mode === "admin" ? "admin" : "sales"}/clients/${request.client.id}`}>
                  فتح ملف العميل
                </Link>
              </Button>
            ) : null}
            {onAddContactLog && request.capabilities?.canLogContact ? (
              <RequestContactLogDialog onSubmit={onAddContactLog} isSubmitting={isAddingContactLog} />
            ) : null}
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              الخدمات: {formatNumber(services.length)}
            </Badge>
            <Badge variant="outline">
              محاولات التواصل: {formatNumber(request.contactAttemptCount)}
            </Badge>
            <Badge variant="outline">
              المكالمات: {formatNumber(calls.length)}
            </Badge>
            <Badge variant="outline">
              الاجتماعات: {formatNumber(meetings.length)}
            </Badge>
            <Badge variant="outline">
              آخر نشاط: {formatRelativeTime(request.updatedAt)}
            </Badge>
          </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "المرحلة الحالية",
            value: stageLabel,
            hint: "الموضع الحالي داخل القمع",
            icon: History,
          },
          {
            label: "التواصل",
            value: formatNumber(request.contactAttemptCount),
            hint: request.lastContactAt
              ? `آخر تواصل ${formatDateTime(request.lastContactAt)}`
              : "لا يوجد تواصل بعد",
            icon: Phone,
          },
          {
            label: "التحويلات",
            value: formatNumber(
              proposals.length + contracts.length + (request.project ? 1 : 0),
            ),
            hint: "العروض والعقود والمشروع الناتج",
            icon: FileText,
          },
          {
            label: "الخدمات المطلوبة",
            value: formatNumber(services.length),
            hint: sourceLabel,
            icon: ClipboardList,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-lg font-semibold">{item.value}</span>
                <span className="text-sm text-muted-foreground">
                  {item.hint}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <item.icon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>ملف العميل المحتمل</CardTitle>
            <CardDescription>
              البيانات الأساسية التي يعتمد عليها الفريق قبل الانتقال إلى العرض
              والعقد.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Tabs defaultValue="contact" className="flex flex-col gap-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="contact">التواصل</TabsTrigger>
                <TabsTrigger value="business">الأعمال</TabsTrigger>
              </TabsList>

              <TabsContent value="contact" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {primaryFields.map((field) => (
                    <InfoField key={field.label} {...field} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="business" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {businessFields.map((field) => (
                    <InfoField key={field.label} {...field} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-2 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">ملاحظات الطلب</p>
              <p className="text-sm leading-6 text-foreground">
                {request.notes?.trim() || "لا توجد ملاحظات مسجلة حتى الآن."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>إدارة القمع</CardTitle>
            <CardDescription>
              تتبّع الحركة بين المراحل وسجّل التقدم من نفس الصفحة.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {onStageChange && request.capabilities?.canUpdateStatus ? (
              <div className="flex flex-col gap-2 rounded-lg border p-4">
                <Label htmlFor="request-stage">تحديث الحالة</Label>
                <Select
                  value={request.status}
                  onValueChange={(value) =>
                    onStageChange(value as RequestStatus)
                  }
                  disabled={isUpdatingStage}
                >
                  <SelectTrigger id="request-stage">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {selectableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {REQUEST_STATUS_AR[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {REQUEST_STAGE_ORDER.map((status) => {
              const isCurrent = status === request.status;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                      {REQUEST_STAGE_ORDER.indexOf(status) + 1}
                    </div>
                    <span className="text-sm font-medium">
                      {REQUEST_STATUS_AR[status]}
                    </span>
                  </div>
                  <Badge variant={isCurrent ? "default" : "outline"}>
                    {isCurrent ? "الآن" : "—"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>العمليات المرتبطة</CardTitle>
          <CardDescription>
            كل ما يساعد على متابعة الفرصة وإغلاقها من بطاقة واحدة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activity" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full justify-start">
              <TabsTrigger value="activity">
                كل النشاط ({formatNumber(contactLogs.length)})
              </TabsTrigger>
              <TabsTrigger value="calls">
                المكالمات ({formatNumber(calls.length)})
              </TabsTrigger>
              <TabsTrigger value="meetings">
                الاجتماعات ({formatNumber(meetings.length)})
              </TabsTrigger>
              <TabsTrigger value="workflow">الربط والتحويل</TabsTrigger>
              <TabsTrigger value="services">الخدمات</TabsTrigger>
              <TabsTrigger value="history">
                سجل الحالة ({formatNumber(statusHistory.length)})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-0">
              <ContactLogsTable logs={contactLogs} />
            </TabsContent>

            <TabsContent value="calls" className="mt-0">
              <ContactLogsTable logs={calls} />
            </TabsContent>

            <TabsContent value="meetings" className="mt-0">
              <ContactLogsTable logs={meetings} />
            </TabsContent>

            <TabsContent value="workflow" className="mt-0">
              <RelatedRecords
                request={{
                  ...request,
                  contactLogs,
                  statusHistory,
                  services,
                  proposals,
                  contracts,
                }}
                mode={mode}
              />
            </TabsContent>

            <TabsContent value="services" className="mt-0">
              {services.length === 0 ? (
                <EmptyPanel
                  title="لا توجد خدمات مرتبطة"
                  description="ستظهر هنا الخدمات المطلوبة داخل هذا السجل."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الخدمة</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.service.nameAr || service.service.name}
                          </TableCell>
                          <TableCell>
                            {formatNumber(service.quantity)}
                          </TableCell>
                          <TableCell className="max-w-[320px] truncate">
                            {service.notes?.trim() || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <StatusHistoryTable entries={statusHistory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
