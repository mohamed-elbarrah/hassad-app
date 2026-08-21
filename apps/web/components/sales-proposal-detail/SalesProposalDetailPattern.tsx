"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  Mail,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import {
  BUSINESS_TYPE_AR,
  CLIENT_SOURCE_AR,
  ContactLogResult,
  ContactLogType,
  PROPOSAL_STATUS_AR,
  ProposalStatus,
  REQUEST_STATUS_AR,
  RequestStatus,
} from "@hassad/shared";
import type { SalesProposalDetail } from "@/features/proposals/proposalsApi";
import { PageHeader } from "@/components/common/PageHeader";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function proposalStatusVariant(status: string) {
  switch (status) {
    case ProposalStatus.APPROVED:
      return "secondary";
    case ProposalStatus.REJECTED:
      return "destructive";
    case ProposalStatus.SENT:
    case ProposalStatus.REVISION_REQUESTED:
      return "default";
    default:
      return "outline";
  }
}

function requestStatusVariant(status: string) {
  switch (status) {
    case RequestStatus.SIGNED:
    case RequestStatus.PROJECT_CREATED:
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

function contactResultVariant(result: string) {
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
        <History />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof CalendarDays;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-border/60 py-3 last:border-b-0">
      {Icon ? (
        <span aria-hidden="true" className="mt-0.5 text-muted-foreground">
          <Icon />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{value || "—"}</dd>
      </div>
    </div>
  );
}

function TimelineMarker({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-4 border-background",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
    </span>
  );
}

function StatusTimeline({ proposal }: { proposal: SalesProposalDetail }) {
  const history = proposal.request?.statusHistory ?? [];

  return (
    <div className="pt-4">
      {history.length === 0 ? (
        <EmptyPanel
          title="لا يوجد سجل انتقالات"
          description="ستظهر هنا حركة الطلب بين مراحل خط المبيعات عند تسجيلها."
        />
      ) : (
        <ol className="relative flex flex-col gap-0">
          {history.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
              {index < history.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-3.5 top-7 h-[calc(100%-0.5rem)] w-px bg-border"
                />
              ) : null}
              <TimelineMarker active={index === 0} />
              <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span>
                      {entry.fromStatus
                        ? REQUEST_STATUS_AR[entry.fromStatus as RequestStatus]
                        : "بداية الطلب"}
                    </span>
                    <span className="text-muted-foreground">←</span>
                    <Badge variant={requestStatusVariant(entry.toStatus)}>
                      {REQUEST_STATUS_AR[entry.toStatus as RequestStatus] ||
                        entry.toStatus}
                    </Badge>
                  </div>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={entry.changedAt}
                  >
                    {formatRelativeTime(entry.changedAt)}
                  </time>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDateTime(entry.changedAt)}</span>
                  <span>بواسطة {entry.changer?.name || "النظام"}</span>
                </div>
                {entry.note ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {entry.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ContactAttempts({ proposal }: { proposal: SalesProposalDetail }) {
  const logs = proposal.request?.contactLogs ?? [];
  const attemptCount = proposal.request?.contactAttemptCount ?? logs.length;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone />
          محاولات التواصل
        </CardTitle>
        <CardDescription>
          آخر التحديثات المسجلة على الطلب المرتبط.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              إجمالي المحاولات
            </span>
            <span className="text-3xl font-semibold tracking-tight">
              {formatNumber(attemptCount)}
            </span>
          </div>
          <Phone className="text-muted-foreground" aria-hidden="true" />
        </div>

        {logs.length === 0 ? (
          <EmptyPanel
            title="لا توجد محاولات بعد"
            description="لم يتم تسجيل أي مكالمة أو متابعة لهذا الطلب."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-3 rounded-lg border p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Phone />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {CONTACT_LOG_TYPE_LABELS[log.type] || log.type}
                    </span>
                    <Badge variant={contactResultVariant(log.result)}>
                      {CONTACT_LOG_RESULT_LABELS[log.result] || log.result}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(log.contactedAt)} — {log.user.name}
                  </span>
                  {log.notes ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {log.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {logs.length > 5 ? (
              <p className="text-center text-xs text-muted-foreground">
                يتم عرض أحدث 5 محاولات تواصل.
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SalesProposalDetailLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5" />
            <Skeleton className="h-7 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="grid gap-3 p-6 pt-0 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SalesProposalDetailView({
  proposal,
  backHref,
  backLabel,
  fileUrl,
  actions,
}: {
  proposal: SalesProposalDetail;
  backHref: string;
  backLabel: string;
  fileUrl?: string | null;
  actions?: ReactNode;
}) {
  const request = proposal.request;
  const client = proposal.client ?? request?.client;
  const companyName = client?.companyName || request?.companyName || "—";
  const contactName = request?.contactName || client?.user?.name || "—";
  const statusLabel =
    PROPOSAL_STATUS_AR[proposal.status as ProposalStatus] || proposal.status;
  const services = proposal.servicesList ?? [];

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title={proposal.title}
        description={`${companyName} · ${statusLabel}`}
        icon={FileText}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={backHref}>
                <ArrowLeft data-icon="inline-start" />
                {backLabel}
              </Link>
            </Button>
            {request ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/sales/requests/${request.id}`}>
                  <History data-icon="inline-start" />
                  الطلب المرتبط
                </Link>
              </Button>
            ) : null}
            {client ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/sales/clients/${client.id}`}>
                  <Users data-icon="inline-start" />
                  ملف العميل
                </Link>
              </Button>
            ) : null}
            {fileUrl ? (
              <Button asChild size="sm">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download data-icon="inline-start" />
                  فتح PDF
                </a>
              </Button>
            ) : null}
            {actions}
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">ملخص العرض</CardTitle>
                    <Badge variant={proposalStatusVariant(proposal.status)}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <CardDescription>
                    نظرة مركزة على القيمة والمدة والجهة المرتبطة بهذا العرض.
                  </CardDescription>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="الجهة"
                  value={companyName}
                  icon={Building2}
                />
                <DetailItem
                  label="جهة الاتصال"
                  value={contactName}
                  icon={UserRound}
                />
                <DetailItem
                  label="القيمة الإجمالية"
                  value={formatCurrency(proposal.totalPrice)}
                  icon={CheckCircle2}
                />
                <DetailItem
                  label="المدة"
                  value={`${formatNumber(proposal.durationDays)} ${proposal.durationUnit === "MONTHS" ? "شهر" : "يوم"}`}
                  icon={Clock3}
                />
                <DetailItem
                  label="تاريخ الإنشاء"
                  value={formatDateTime(proposal.createdAt)}
                  icon={CalendarDays}
                />
                <DetailItem
                  label="أنشأه"
                  value={proposal.creator?.name || "—"}
                  icon={UserRound}
                />
              </dl>
              <Separator />
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">وصف العرض</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {proposal.serviceDescription ||
                    "لا يوجد وصف إضافي لهذا العرض."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-lg">تفاصيل العرض</CardTitle>
              <CardDescription>
                بدّل بين الخدمات والملف وحركة الطلب دون تمرير طويل في الصفحة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="services" className="flex flex-col gap-4">
                <TabsList className="grid h-auto w-full grid-cols-3">
                  <TabsTrigger value="services">الخدمات</TabsTrigger>
                  <TabsTrigger value="document">ملف PDF</TabsTrigger>
                  <TabsTrigger value="history">حركة الطلب</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-0 pt-2">
                  {services.length === 0 ? (
                    <EmptyPanel
                      title="لا توجد خدمات مضافة"
                      description="لم يتم إرفاق قائمة خدمات مفصلة لهذا العرض."
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table className="min-w-[36rem]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>الخدمة</TableHead>
                            <TableHead className="text-left">السعر</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.map((service, index) => (
                            <TableRow key={`${service.name}-${index}`}>
                              <TableCell className="font-medium">
                                {service.name}
                              </TableCell>
                              <TableCell className="text-left">
                                {formatCurrency(service.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-semibold">
                              الإجمالي
                            </TableCell>
                            <TableCell className="text-left font-semibold">
                              {formatCurrency(proposal.totalPrice)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="document" className="mt-0 pt-2">
                  {fileUrl ? (
                    <div className="flex flex-col gap-4">
                      <iframe
                        title={`ملف العرض: ${proposal.title}`}
                        src={fileUrl}
                        className="h-[32rem] w-full rounded-lg border bg-muted/20"
                      />
                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download data-icon="inline-start" />
                            تحميل الملف
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <EmptyPanel
                      title="لا يوجد ملف مرفق"
                      description="لم يتم العثور على ملف PDF لهذا العرض."
                    />
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <StatusTimeline proposal={proposal} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 />
                ملخص العميل
              </CardTitle>
              <CardDescription>
                المعلومات الضرورية لمتابعة هذا العرض.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                <Building2 className="mt-0.5 text-primary" />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold">{companyName}</span>
                  <span className="text-sm text-muted-foreground">
                    {contactName}
                  </span>
                </div>
              </div>
              <dl className="flex flex-col">
                <DetailItem
                  label="الهاتف / واتساب"
                  value={
                    request?.phoneWhatsapp || client?.user?.phoneWhatsapp || "—"
                  }
                  icon={Phone}
                />
                <DetailItem
                  label="البريد الإلكتروني"
                  value={request?.email || client?.user?.email || "—"}
                  icon={Mail}
                />
                <DetailItem
                  label="نوع النشاط"
                  value={
                    BUSINESS_TYPE_AR[
                      (request?.businessType ||
                        client?.businessType) as keyof typeof BUSINESS_TYPE_AR
                    ] ||
                    request?.businessType ||
                    client?.businessType ||
                    "—"
                  }
                />
                <DetailItem
                  label="المصدر"
                  value={
                    CLIENT_SOURCE_AR[
                      request?.source as keyof typeof CLIENT_SOURCE_AR
                    ] ||
                    request?.source ||
                    "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <ContactAttempts proposal={proposal} />

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText />
                التحويل التالي
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {proposal.contract ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      العقد المرتبط
                    </span>
                    <span className="truncate text-sm font-medium">
                      {proposal.contract.title}
                    </span>
                  </div>
                  <Badge variant="outline">{proposal.contract.status}</Badge>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  لا يوجد عقد مرتبط بهذا العرض حتى الآن.
                </p>
              )}
              {request?.assignee ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRound />
                  المسؤول: {request.assignee.name}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
