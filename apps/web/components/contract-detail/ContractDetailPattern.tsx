"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, CircleDollarSign, Download, FileClock, Inbox, Layers3, ShieldCheck } from "lucide-react";
import { CONTRACT_STATUS_AR } from "@hassad/shared";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime, formatPortalDate, formatNumber } from "@/lib/format";

export interface ContractDetailEntity {
  id: string;
  clientId?: string;
  proposalId?: string | null;
  requestId?: string | null;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  filePath?: string | null;
  shareLinkToken?: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt?: string | null;
  createdAt: string;
  currency?: string | null;
  downPaymentType?: string | null;
  downPaymentValue?: number | null;
  numberOfMonths?: number | null;
  servicesList?: unknown;
  client?: {
    id: string;
    companyName: string;
    user?: { name?: string | null; email?: string | null; phoneWhatsapp?: string | null } | null;
  } | null;
  proposal?: unknown;
  project?: { id: string; name: string; status?: string | null } | null;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate?: string | null;
    createdAt?: string | null;
    issueDate?: string | null;
    paidAt?: string | null;
    paymentMethod?: string | null;
    payments?: Array<{ id: string; amount: number; status: string; date?: string; createdAt?: string }>;
  }> | null;
  statusHistory?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    changedAt: string;
    changer?: { id: string; name: string } | null;
    reason?: string | null;
  }> | null;
  versions?: Array<{
    id: string;
    versionNumber: number;
    filePath?: string | null;
    createdAt: string;
  }> | null;
}

function contractVariant(status?: string | null) {
  switch (status) {
    case "SIGNED":
    case "ACTIVE":
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
    case "EXPIRED":
      return "destructive";
    case "SENT":
      return "default";
    default:
      return "outline";
  }
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
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
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function getProposalTitle(proposal: unknown) {
  if (!proposal || typeof proposal !== "object") {
    return null;
  }

  const maybeTitle = (proposal as { title?: unknown }).title;
  return typeof maybeTitle === "string" ? maybeTitle : null;
}

export function ContractDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardContent className="flex gap-4 p-6">
          <Skeleton className="size-20 rounded-lg" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContractDetailView({
  contract,
  backHref,
  backLabel,
  fileUrl,
  actions,
  billingArea,
  responseArea,
  audience = "internal",
}: {
  contract: ContractDetailEntity;
  backHref: string;
  backLabel: string;
  fileUrl?: string | null;
  actions?: ReactNode;
  billingArea?: ReactNode;
  responseArea?: ReactNode;
  audience?: "internal" | "client";
}) {
  const invoices = contract.invoices ?? [];
  const statusHistory = contract.statusHistory ?? [];
  const versions = contract.versions ?? [];
  const isClientAudience = audience === "client";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileClock className="size-10" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-semibold tracking-tight">{contract.title}</h2>
                  <Badge variant={contractVariant(contract.status)}>
                    {CONTRACT_STATUS_AR[contract.status as keyof typeof CONTRACT_STATUS_AR] || contract.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{contract.client?.companyName || "—"}</p>
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
            <Badge variant="outline">القيمة الإجمالية: {formatCurrency(contract.totalValue)}</Badge>
            <Badge variant="outline">القيمة الشهرية: {formatCurrency(contract.monthlyValue)}</Badge>
            <Badge variant="outline">الفواتير: {formatNumber(invoices.length)}</Badge>
            {!isClientAudience ? (
              <Badge variant="outline">الإصدارات: {formatNumber(versions.length)}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!isClientAudience ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "إجمالي القيمة", value: formatCurrency(contract.totalValue), hint: "القيمة التعاقدية", icon: CircleDollarSign },
            { label: "القيمة الشهرية", value: formatCurrency(contract.monthlyValue), hint: "إن وجدت", icon: CalendarDays },
            { label: "الفواتير", value: formatNumber(invoices.length), hint: "السجلات المالية المرتبطة", icon: Layers3 },
            { label: "الإصدارات", value: formatNumber(versions.length), hint: `الإصدار الحالي ${formatNumber(contract.versionNumber)}`, icon: ShieldCheck },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-lg font-semibold">{item.value}</span>
                  <span className="text-sm text-muted-foreground">{item.hint}</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
              <CardTitle>بيانات العقد</CardTitle>
              <CardDescription>المرجع التشغيلي والتجاري للعقد.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoField label="العميل" value={contract.client?.companyName || "—"} />
              <InfoField label="النوع" value={contract.type} />
              <InfoField label="تاريخ البداية" value={formatPortalDate(contract.startDate) || "—"} />
              <InfoField label="تاريخ النهاية" value={formatPortalDate(contract.endDate) || "—"} />
              <InfoField label="تاريخ التوقيع" value={formatPortalDate(contract.signedAt) || "—"} />
              <InfoField label="تاريخ الإنشاء" value={formatDateTime(contract.createdAt)} />
              <InfoField label="الطلب المرتبط" value={contract.requestId || "—"} />
              <InfoField label="العرض المرتبط" value={getProposalTitle(contract.proposal) || contract.proposalId || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>الربط والتحويل</CardTitle>
              <CardDescription>علاقة العقد بالعميل والمشروع والملفات المالية.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">المشروع الناتج</p>
                <p className="mt-2 text-sm font-medium">{contract.project?.name || "لا يوجد مشروع مرتبط بعد"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">التوقيع الإلكتروني</p>
                <p className="mt-2 text-sm font-medium">{contract.eSigned ? "مفعل" : "غير مفعل"}</p>
              </div>
              {contract.downPaymentValue != null ? (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">خطة الدفع</p>
                  <p className="mt-2 text-sm font-medium">
                    دفعة أولى {formatCurrency(contract.downPaymentValue)}{contract.numberOfMonths ? ` • ${formatNumber(contract.numberOfMonths)} أشهر` : ""}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        {!isClientAudience ? (
          <CardHeader className="gap-2">
            <CardTitle>تفاصيل العقد</CardTitle>
            <CardDescription>تنقل سريع داخل بطاقة واحدة بين الفواتير والملف والسجل المالي والحالة.</CardDescription>
          </CardHeader>
        ) : null}
        <CardContent className={isClientAudience ? "p-4 sm:p-6" : undefined}>
          <Tabs defaultValue="billing" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full justify-start">
              <TabsTrigger value="billing">الفوترة والدفع</TabsTrigger>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
              {!isClientAudience ? <TabsTrigger value="history">سجل الحالة</TabsTrigger> : null}
              {!isClientAudience ? <TabsTrigger value="versions">الإصدارات</TabsTrigger> : null}
              <TabsTrigger value="document">الملف</TabsTrigger>
              {responseArea ? <TabsTrigger value="action">{isClientAudience ? "الإجراء" : "إجراء العميل"}</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="billing" className="mt-0">
              {billingArea || (
                <EmptyPanel
                  title="لا توجد بيانات فوترة إضافية"
                  description="سيظهر هنا ملخص الفوترة والدفع عندما يكون متاحًا لهذا الدور."
                />
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              {invoices.length === 0 ? (
                <EmptyPanel
                  title="لا توجد فواتير مرتبطة"
                  description="ستظهر هنا الفواتير عند إنشائها لهذا العقد."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفاتورة</TableHead>
                        <TableHead>القيمة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الاستحقاق</TableHead>
                        <TableHead>المدفوع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell>{formatPortalDate(invoice.dueDate) || "—"}</TableCell>
                          <TableCell>{formatPortalDate(invoice.paidAt) || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {!isClientAudience ? (
              <TabsContent value="history" className="mt-0">
                {statusHistory.length === 0 ? (
                  <EmptyPanel
                    title="لا يوجد سجل حالة"
                    description="سجل انتقالات حالة العقد سيظهر هنا."
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>من</TableHead>
                          <TableHead>إلى</TableHead>
                          <TableHead>بواسطة</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statusHistory.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.fromStatus || "—"}</TableCell>
                            <TableCell>{entry.toStatus}</TableCell>
                            <TableCell>{entry.changer?.name || "—"}</TableCell>
                            <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ) : null}

            {!isClientAudience ? (
              <TabsContent value="versions" className="mt-0">
                {versions.length === 0 ? (
                  <EmptyPanel
                    title="لا توجد إصدارات محفوظة"
                    description="سيظهر هنا أرشيف الإصدارات عند وجود أكثر من نسخة للعقد."
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الإصدار</TableHead>
                          <TableHead>الملف</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((version) => (
                          <TableRow key={version.id}>
                            <TableCell>{formatNumber(version.versionNumber)}</TableCell>
                            <TableCell>{version.filePath || "—"}</TableCell>
                            <TableCell>{formatDateTime(version.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ) : null}

            <TabsContent value="document" className="mt-0">
              {fileUrl ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Download />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">ملف العقد</span>
                      <span className="text-xs text-muted-foreground">تحميل الملف لمراجعة الشروط الكاملة</span>
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
                  description="لم يتم العثور على ملف PDF أو مرفق لهذا العقد."
                />
              )}
            </TabsContent>

            {responseArea ? (
              <TabsContent value="action" className="mt-0">
                {responseArea}
              </TabsContent>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContractClientBillingArea({
  services,
  totalValue,
  invoices,
  canPay,
  onPaymentComplete,
}: {
  services: Array<{ name: string; price: number }>;
  totalValue: number;
  invoices: NonNullable<ContractDetailEntity["invoices"]>;
  canPay?: boolean;
  onPaymentComplete?: () => void;
}) {
  return (
    <ContractPaymentSummary
      services={services}
      totalValue={totalValue}
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status as any,
        paymentMethod: (invoice.paymentMethod || "BANK_TRANSFER") as any,
        issueDate: invoice.issueDate || invoice.createdAt || "",
        dueDate: invoice.dueDate || "",
        paidAt: invoice.paidAt || null,
        payments: invoice.payments?.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          date: payment.date || payment.createdAt || "",
        })),
      }))}
      showPayButton={canPay}
      onPaymentComplete={onPaymentComplete}
    />
  );
}
