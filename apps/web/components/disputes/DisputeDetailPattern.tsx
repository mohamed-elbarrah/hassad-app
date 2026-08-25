"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  FileText,
  History,
  MessageSquare,
  Paperclip,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import {
  DISPUTE_CATEGORY_AR,
  DISPUTE_PRIORITY_AR,
  DISPUTE_STATUS_AR,
} from "@hassad/shared";
import { disputeHistoryMessage } from "@/lib/i18n";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";
import { DisputeMessageThread } from "./DisputeMessageThread";
import { DisputeResolutionTimer } from "./DisputeResolutionTimer";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

type DisputeActor = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type DisputeMessage = {
  id: string;
  content: string;
  createdAt: string;
  isInternal?: boolean;
  author: DisputeActor;
};

type DisputeAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploader: { id: string; name: string };
};

type DisputeHistoryEntry = {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  changedAt: string;
  note?: string | null;
  changer: { id: string; name: string };
};

type DisputeParty = {
  id: string;
  name?: string;
  companyName?: string;
  avatarUrl?: string | null;
};

type Metric = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
};

type InfoField = {
  label: string;
  value?: ReactNode;
};

export interface DisputeDetailPatternProps {
  audience: "admin" | "pm" | "client";
  title: string;
  backHref: string;
  backLabel: string;
  breadcrumbs?: { label: string; href?: string }[];
  projectHref?: string;
  projectLabel?: string;
  dispute: {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    openedAt: string;
    deadlineAt?: string | null;
    approvedAt?: string | null;
    resolvedAt?: string | null;
    closedAt?: string | null;
    escalatedAt?: string | null;
    clientNotifiedAt?: string | null;
    clientRespondedAt?: string | null;
    rejectionReason?: string | null;
    resolution?: string | null;
    project: DisputeParty;
    client?: DisputeParty | null;
    pm?: DisputeParty | null;
    reviewer?: DisputeParty | null;
    resolver?: DisputeParty | null;
    newPm?: DisputeParty | null;
    messages?: DisputeMessage[] | null;
    attachments?: DisputeAttachment[] | null;
    history?: DisputeHistoryEntry[] | null;
    _count?: { messages?: number | null } | null;
  };
  metrics?: Metric[];
  overviewFields?: InfoField[];
  timelineFields?: InfoField[];
  actionBanner?: ReactNode;
  actionTab?: ReactNode;
  onSendMessage?: (content: string, files?: File[]) => void | Promise<void>;
  isSendingMessage?: boolean;
  canSendMessage?: boolean;
  showInternalMessages?: boolean;
  messagesDescription?: string;
  attachmentsDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function fieldCard(field: InfoField, key: string) {
  return (
    <div key={key} className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{field.label}</p>
      <div className="mt-2 text-sm font-medium">{field.value || "—"}</div>
    </div>
  );
}

export function DisputeDetailPattern({
  audience,
  title,
  backHref,
  backLabel,
  breadcrumbs,
  projectHref,
  projectLabel = "المشروع",
  dispute,
  metrics = [],
  overviewFields = [],
  timelineFields = [],
  actionBanner,
  actionTab,
  onSendMessage,
  isSendingMessage = false,
  canSendMessage = false,
  showInternalMessages = false,
  messagesDescription = "سجل النقاش المرتبط بالنزاع.",
  attachmentsDescription = "الملفات المرفقة داخل هذا النزاع.",
  emptyTitle = "النزاع غير موجود",
  emptyDescription = "لم نتمكن من العثور على بيانات هذا النزاع.",
}: DisputeDetailPatternProps) {
  const messages = dispute.messages ?? [];
  const attachments = dispute.attachments ?? [];
  const history = dispute.history ?? [];
  const messageCount = dispute._count?.messages ?? messages.length;
  const summaryMetrics = metrics.length
    ? metrics
    : [
        {
          label: "الحالة",
          value:
            DISPUTE_STATUS_AR[
              dispute.status as keyof typeof DISPUTE_STATUS_AR
            ] || dispute.status,
          icon: <ShieldAlert className="text-muted-foreground" />,
        },
        {
          label: "الأولوية",
          value:
            DISPUTE_PRIORITY_AR[
              dispute.priority as keyof typeof DISPUTE_PRIORITY_AR
            ] || dispute.priority,
          icon: <MessageSquare className="text-muted-foreground" />,
        },
        {
          label: "الرسائل",
          value: formatNumber(messageCount),
          icon: <MessageSquare className="text-muted-foreground" />,
        },
        {
          label: "المرفقات",
          value: formatNumber(attachments.length),
          icon: <Paperclip className="text-muted-foreground" />,
        },
      ];

  const descriptionFields: InfoField[] = [
    ...(overviewFields || []),
    {
      label: "وصف المشكلة",
      value: (
        <p className="whitespace-pre-wrap leading-7 text-foreground">
          {dispute.description || "—"}
        </p>
      ),
    },
  ];

  return (
    <div dir="rtl" className="flex flex-col gap-6   ">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            {breadcrumbs?.length ? (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <BreadcrumbItem>
                        {item.href ? (
                          <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 ? (
                        <BreadcrumbSeparator />
                      ) : null}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}

            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldAlert />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>
                  مساحة موحدة لمتابعة النزاع، الرسائل، والإجراءات حسب الدور.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={backHref}>
                <ArrowLeft />
                {backLabel}
              </Link>
            </Button>
            {projectHref ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={projectHref}>
                  <Users />
                  {projectLabel}
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <div className="flex size-20 items-center justify-center rounded-xl bg-muted">
              <DisputeCategoryIcon
                category={dispute.category as never}
                size="lg"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {dispute.title}
                </h2>
                <DisputeStatusBadge status={dispute.status as never} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>#{dispute.ticketNumber}</span>
                <span>•</span>
                <span>
                  {dispute.project.name || dispute.project.companyName || "—"}
                </span>
                {dispute.deadlineAt ? (
                  <>
                    <span>•</span>
                    <DisputeResolutionTimer
                      deadlineAt={dispute.deadlineAt}
                      status={dispute.status}
                    />
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {DISPUTE_CATEGORY_AR[
                    dispute.category as keyof typeof DISPUTE_CATEGORY_AR
                  ] || dispute.category}
                </Badge>
                <Badge variant="outline">
                  {DISPUTE_PRIORITY_AR[
                    dispute.priority as keyof typeof DISPUTE_PRIORITY_AR
                  ] || dispute.priority}
                </Badge>
                {audience !== "client" && dispute.pm?.name ? (
                  <Badge variant="secondary">{dispute.pm.name}</Badge>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {summaryMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-lg font-semibold">{metric.value}</span>
                  {metric.hint ? (
                    <span className="text-xs text-muted-foreground">
                      {metric.hint}
                    </span>
                  ) : null}
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  {metric.icon || (
                    <ShieldAlert className="text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {actionBanner}

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>مساحة النزاع</CardTitle>
          <CardDescription>
            تنقل سريع بين المعلومات، المحادثة، المرفقات، والسجل دون مغادرة
            الصفحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="messages">المحادثة</TabsTrigger>
              <TabsTrigger value="attachments">المرفقات</TabsTrigger>
              <TabsTrigger value="history">السجل</TabsTrigger>
              {actionTab ? (
                <TabsTrigger value="actions">الإجراءات</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle>البيانات الأساسية</CardTitle>
                    <CardDescription>
                      المعلومات المهمة لفهم النزاع بسرعة.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {descriptionFields.map((item, index) =>
                      fieldCard(item, `overview-${index}`),
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle>الأطراف والحالة</CardTitle>
                    <CardDescription>
                      من يشارك في المعالجة وما آخر المحطات.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: audience === "client" ? "المشروع" : "العميل",
                        value:
                          audience === "client"
                            ? dispute.project.name || "—"
                            : dispute.client?.companyName ||
                              dispute.client?.name ||
                              "—",
                      },
                      { label: "مدير المشروع", value: dispute.pm?.name || "—" },
                      {
                        label: "تاريخ الفتح",
                        value: formatDateTime(dispute.openedAt),
                      },
                      {
                        label: "الموعد النهائي",
                        value: formatDateTime(dispute.deadlineAt),
                      },
                      ...(timelineFields || []),
                    ].map((item, index) => fieldCard(item, `party-${index}`))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle>المحادثة</CardTitle>
                  <CardDescription>{messagesDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DisputeMessageThread
                    messages={messages}
                    onSendMessage={onSendMessage || (() => undefined)}
                    isLoading={isSendingMessage}
                    canSendMessage={canSendMessage}
                    showInternalBadge={showInternalMessages}
                    currentAudience={audience}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-0">
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle>المرفقات</CardTitle>
                  <CardDescription>{attachmentsDescription}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الملف</TableHead>
                        <TableHead>الحجم</TableHead>
                        <TableHead>بواسطة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attachments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-28 text-center text-muted-foreground"
                          >
                            لا توجد مرفقات
                          </TableCell>
                        </TableRow>
                      ) : (
                        attachments.map((attachment) => (
                          <TableRow key={attachment.id}>
                            <TableCell>{attachment.fileName}</TableCell>
                            <TableCell>
                              {formatNumber(attachment.fileSize)}
                            </TableCell>
                            <TableCell>{attachment.uploader.name}</TableCell>
                            <TableCell>
                              {formatDateTime(attachment.uploadedAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle>السجل</CardTitle>
                  <CardDescription>
                    كل تغييرات الحالة والقرارات المسجلة على النزاع.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <Empty>
                      <EmptyMedia variant="icon">
                        <History />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>لا يوجد سجل بعد</EmptyTitle>
                        <EmptyDescription>
                          سيظهر هنا أي تحديث أو قرار يتم تسجيله.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <ScrollArea className="max-h-[420px]">
                      <div className="flex flex-col gap-4">
                        {history.map((entry, index) => (
                          <div key={entry.id} className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex size-9 items-center justify-center rounded-full bg-muted">
                                <UserRound className="text-muted-foreground" />
                              </div>
                              <div className="flex flex-1 flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">
                                    {entry.changer.name}
                                  </span>
                                  <Badge variant="outline">
                                    {DISPUTE_STATUS_AR[
                                      entry.toStatus as keyof typeof DISPUTE_STATUS_AR
                                    ] || entry.toStatus}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDateTime(entry.changedAt)}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  من{" "}
                                  {entry.fromStatus
                                    ? DISPUTE_STATUS_AR[
                                        entry.fromStatus as keyof typeof DISPUTE_STATUS_AR
                                      ] || entry.fromStatus
                                    : "—"}{" "}
                                  إلى{" "}
                                  {DISPUTE_STATUS_AR[
                                    entry.toStatus as keyof typeof DISPUTE_STATUS_AR
                                  ] || entry.toStatus}
                                </div>
                                {entry.note ? (
                                  <p className="text-sm leading-6 text-foreground">
                                    {disputeHistoryMessage(entry.note)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {index < history.length - 1 ? <Separator /> : null}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {actionTab ? (
              <TabsContent value="actions" className="mt-0">
                {actionTab}
              </TabsContent>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export function DisputeDetailEmptyState({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div dir="rtl" className="  ">
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href={backHref}>
                  <ArrowLeft />
                  {backLabel}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
