"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  FileText,
  Inbox,
  MessageSquare,
  PenLine,
  TrendingUp,
  Users,
} from "lucide-react";
import { PROPOSAL_STATUS_AR, ProposalStatus } from "@hassad/shared";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export interface ProposalDetailEntity {
  id: string;
  title: string;
  status: string;
  totalPrice: number;
  createdAt: string | Date;
  filePath?: string | null;
  request?: {
    id: string;
    companyName: string;
    contactName?: string | null;
    status?: string | null;
  } | null;
  lead?: {
    id: string;
    companyName: string;
    contactName?: string | null;
  } | null;
  client?: {
    id: string;
    companyName: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  contract?: {
    id: string;
    title: string;
    status?: string | null;
  } | null;
  servicesList?: Array<{
    name: string;
    price: number;
  }> | null;
}

function proposalVariant(status?: string | null) {
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

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-2  rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function ProposalDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <Skeleton className="size-20  rounded-xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
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
              </div>
              <Skeleton className="size-10  rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProposalDetailView({
  proposal,
  backHref,
  backLabel,
  fileUrl,
  actions,
  relatedAction,
  responseArea,
  audience = "internal",
}: {
  proposal: ProposalDetailEntity;
  backHref: string;
  backLabel: string;
  fileUrl?: string | null;
  actions?: ReactNode;
  relatedAction?: ReactNode;
  responseArea?: ReactNode;
  audience?: "internal" | "client";
}) {
  const services = proposal.servicesList ?? [];
  const companyLabel =
    proposal.client?.companyName ||
    proposal.lead?.companyName ||
    proposal.request?.companyName ||
    "—";
  const contactLabel =
    proposal.request?.contactName || proposal.lead?.contactName || "—";
  const isClientAudience = audience === "client";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex size-20 items-center justify-center  rounded-xl bg-muted text-muted-foreground">
                <FileText className="size-10" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-semibold tracking-tight">
                    {proposal.title}
                  </h2>
                  <Badge variant={proposalVariant(proposal.status)}>
                    {PROPOSAL_STATUS_AR[proposal.status as ProposalStatus] ||
                      proposal.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {companyLabel}
                  {contactLabel !== "—" ? ` — ${contactLabel}` : ""}
                </p>
              </div>
            </div>

            {!isClientAudience ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
                {actions}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              القيمة: {formatCurrency(proposal.totalPrice)}
            </Badge>
            <Badge variant="outline">
              الخدمات: {formatNumber(services.length)}
            </Badge>
            <Badge variant="outline">
              الإنشاء: {formatDateTime(proposal.createdAt)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {!isClientAudience ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "قيمة العرض",
              value: formatCurrency(proposal.totalPrice),
              hint: "القيمة الإجمالية",
              icon: TrendingUp,
            },
            {
              label: "الحالة",
              value:
                PROPOSAL_STATUS_AR[proposal.status as ProposalStatus] ||
                proposal.status,
              hint: "مرحلة العرض الحالية",
              icon: CheckCircle2,
            },
            {
              label: "العميل",
              value: companyLabel,
              hint: "الجهة المرتبطة",
              icon: Users,
            },
            {
              label: "الخدمات",
              value: formatNumber(services.length),
              hint: "عدد الخدمات المضمنة",
              icon: FileText,
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
                <div className="flex size-10 items-center justify-center  rounded-xl bg-muted text-muted-foreground">
                  <item.icon />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isClientAudience ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle>بيانات العرض</CardTitle>
              <CardDescription>
                البيانات التشغيلية والتجارية الأساسية لهذا العرض.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoField label="عنوان العرض" value={proposal.title} />
              <InfoField
                label="الحالة"
                value={
                  PROPOSAL_STATUS_AR[proposal.status as ProposalStatus] ||
                  proposal.status
                }
              />
              <InfoField
                label="العميل"
                value={proposal.client?.companyName || "—"}
              />
              <InfoField
                label="العميل المحتمل / الطلب"
                value={
                  proposal.request?.companyName ||
                  proposal.lead?.companyName ||
                  "—"
                }
              />
              <InfoField label="المرسل" value={proposal.creator?.name || "—"} />
              <InfoField
                label="تاريخ الإنشاء"
                value={formatDateTime(proposal.createdAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>الربط والتحويل</CardTitle>
              <CardDescription>
                العناصر المرتبطة وما نتج عن هذا العرض داخل النظام.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className=" rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">الطلب / الفرصة</p>
                <p className="mt-2 text-sm font-medium">
                  {proposal.request?.companyName ||
                    proposal.lead?.companyName ||
                    "—"}
                </p>
              </div>
              <div className=" rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">العقد الناتج</p>
                <p className="mt-2 text-sm font-medium">
                  {proposal.contract?.title || "لا يوجد عقد مرتبط بعد"}
                </p>
              </div>
              {relatedAction}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        {!isClientAudience ? (
          <CardHeader className="gap-2">
            <CardTitle>تفاصيل العرض</CardTitle>
            <CardDescription>
              تنقل سريع داخل بطاقة واحدة بين الخدمات والملف والاستجابة.
            </CardDescription>
          </CardHeader>
        ) : null}
        <CardContent className={isClientAudience ? "p-4 sm:p-6" : undefined}>
          <Tabs defaultValue="services" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full justify-start">
              <TabsTrigger value="services">الخدمات</TabsTrigger>
              <TabsTrigger value="document">الملف</TabsTrigger>
              <TabsTrigger value="response">الاستجابة</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-0">
              {services.length === 0 ? (
                <EmptyPanel
                  title="لا توجد خدمات مضافة"
                  description="لم يتم إرفاق قائمة خدمات مفصلة لهذا العرض."
                />
              ) : (
                <div className="overflow-hidden  rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الخدمة</TableHead>
                        <TableHead>السعر</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service, index) => (
                        <TableRow key={`${service.name}-${index}`}>
                          <TableCell className="font-medium">
                            {service.name}
                          </TableCell>
                          <TableCell>{formatCurrency(service.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="document" className="mt-0">
              {fileUrl ? (
                <div className="flex items-center justify-between  rounded-xl border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center  rounded-xl bg-muted text-muted-foreground">
                      <Download />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        ملف العرض الفني
                      </span>
                      <span className="text-xs text-muted-foreground">
                        تحميل الملف لمراجعة التفاصيل الكاملة
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      تحميل
                    </a>
                  </Button>
                </div>
              ) : (
                <EmptyPanel
                  title="لا يوجد ملف مرفق"
                  description="لم يتم العثور على ملف PDF أو مرفق لهذا العرض."
                />
              )}
            </TabsContent>

            <TabsContent value="response" className="mt-0">
              {responseArea || (
                <EmptyPanel
                  title="لا توجد إجراءات متاحة هنا"
                  description="إجراءات الموافقة أو طلب التعديل تظهر فقط في واجهات العميل."
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProposalClientResponseArea({
  status,
  notes,
  onNotesChange,
  onApprove,
  onRevision,
  approving,
  requesting,
}: {
  status: string;
  notes: string;
  onNotesChange: (value: string) => void;
  onApprove: () => void;
  onRevision: () => void;
  approving?: boolean;
  requesting?: boolean;
}) {
  const canRespond = status === ProposalStatus.SENT;

  if (!canRespond) {
    const label = PROPOSAL_STATUS_AR[status as ProposalStatus] || status;
    return (
      <div className=" rounded-xl border p-4">
        <p className="text-sm font-medium">حالة الاستجابة الحالية</p>
        <p className="mt-2 text-sm text-muted-foreground">
          العرض حالياً في حالة: {label}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4  rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">ردّ العميل على العرض</p>
      </div>
      <Textarea
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="اكتب ملاحظاتك هنا..."
        rows={4}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onApprove} disabled={approving || requesting}>
          <CheckCircle2 data-icon="inline-start" />
          {approving ? "جارٍ الاعتماد..." : "موافقة على العرض"}
        </Button>
        <Button
          variant="outline"
          onClick={onRevision}
          disabled={approving || requesting}
        >
          <PenLine data-icon="inline-start" />
          {requesting ? "جارٍ الإرسال..." : "طلب تعديل"}
        </Button>
      </div>
    </div>
  );
}
