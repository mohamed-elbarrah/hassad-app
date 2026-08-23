"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Download, FileClock, Inbox } from "lucide-react";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { PageHeader } from "@/components/common/PageHeader";
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
import {
  formatCurrency,
  formatDateTime,
  formatPortalDate,
  formatNumber,
} from "@/lib/format";
import {
  contractStatusLabel,
  contractTypeLabel,
  invoiceStatusLabel,
  paymentPlanTriggerLabel,
} from "@/lib/i18n";
import { buildPortalFileUrl } from "@/lib/portal-files";

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
  fileUrl?: string | null;
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
    user?: {
      name?: string | null;
      email?: string | null;
      phoneWhatsapp?: string | null;
    } | null;
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
    payments?: Array<{
      id: string;
      amount: number;
      status: string;
      date?: string;
      createdAt?: string;
    }>;
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
  paymentPlans?: Array<{
    id: string;
    label: string;
    sequence: number;
    triggerType: string;
    amountType: string;
    amountValue: number;
    isRecurring: boolean;
    dueOffsetDays?: number | null;
    isActive: boolean;
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
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-left text-sm font-medium">
        {value || "—"}
      </dd>
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
      <PageHeader
        title={contract.title}
        description={contract.client?.companyName || "—"}
        icon={FileClock}
        actions={
          !isClientAudience ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={backHref}>{backLabel}</Link>
              </Button>
              {actions}
            </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={contractVariant(contract.status)}>
          {contractStatusLabel(contract.status)}
        </Badge>
        <Badge variant="outline">
          القيمة الإجمالية: {formatCurrency(contract.totalValue)}
        </Badge>
        <Badge variant="outline">
          القيمة الشهرية: {formatCurrency(contract.monthlyValue)}
        </Badge>
        <Badge variant="outline">
          الفواتير: {formatNumber(invoices.length)}
        </Badge>
        {!isClientAudience ? (
          <Badge variant="outline">
            الإصدارات: {formatNumber(versions.length)}
          </Badge>
        ) : null}
      </div>

      {!isClientAudience ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle>بيانات العقد</CardTitle>
              <CardDescription>المرجع التشغيلي والتجاري للعقد.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 md:grid-cols-2">
                <InfoField
                  label="العميل"
                  value={contract.client?.companyName || "—"}
                />
                <InfoField
                  label="النوع"
                  value={contractTypeLabel(contract.type)}
                />
                <InfoField
                  label="تاريخ البداية"
                  value={formatPortalDate(contract.startDate) || "—"}
                />
                <InfoField
                  label="تاريخ النهاية"
                  value={formatPortalDate(contract.endDate) || "—"}
                />
                <InfoField
                  label="تاريخ التوقيع"
                  value={formatPortalDate(contract.signedAt) || "—"}
                />
                <InfoField
                  label="تاريخ الإنشاء"
                  value={formatDateTime(contract.createdAt)}
                />
                <InfoField
                  label="الطلب المرتبط"
                  value={contract.requestId || "—"}
                />
                <InfoField
                  label="العرض المرتبط"
                  value={
                    getProposalTitle(contract.proposal) ||
                    contract.proposalId ||
                    "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>الربط والتحويل</CardTitle>
              <CardDescription>
                علاقة العقد بالعميل والمشروع والملفات المالية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl>
                <InfoField
                  label="المشروع الناتج"
                  value={contract.project?.name || "لا يوجد مشروع مرتبط بعد"}
                />
                <InfoField
                  label="التوقيع الإلكتروني"
                  value={contract.eSigned ? "مفعل" : "غير مفعل"}
                />
                {contract.downPaymentValue != null ? (
                  <InfoField
                    label="خطة الدفع"
                    value={`دفعة أولى ${formatCurrency(contract.downPaymentValue)}${contract.numberOfMonths ? ` • ${formatNumber(contract.numberOfMonths)} أشهر` : ""}`}
                  />
                ) : null}
              </dl>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isClientAudience ? (
        <ClientContractWorkspace
          fileUrl={fileUrl}
          billingArea={billingArea}
          responseArea={responseArea}
        />
      ) : null}

      {!isClientAudience ? (
      <Card>
        {!isClientAudience ? (
          <CardHeader className="gap-2">
            <CardTitle>تفاصيل العقد</CardTitle>
            <CardDescription>
              تنقل سريع داخل بطاقة واحدة بين الفواتير والملف والسجل المالي
              والحالة.
            </CardDescription>
          </CardHeader>
        ) : null}
        <CardContent className={isClientAudience ? "p-4 sm:p-6" : undefined}>
          <Tabs defaultValue="billing" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="billing">الفوترة والدفع</TabsTrigger>
              <TabsTrigger value="payment-plan">خطة الدفع</TabsTrigger>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
              {!isClientAudience ? (
                <TabsTrigger value="history">سجل الحالة</TabsTrigger>
              ) : null}
              {!isClientAudience ? (
                <TabsTrigger value="versions">الإصدارات</TabsTrigger>
              ) : null}
              <TabsTrigger value="document">الملف</TabsTrigger>
              {responseArea ? (
                <TabsTrigger value="action">
                  {isClientAudience ? "الإجراء" : "إجراء العميل"}
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="billing" className="mt-0">
              {billingArea || (
                <EmptyPanel
                  title="لا توجد بيانات فوترة إضافية"
                  description="سيظهر هنا ملخص الفوترة والدفع عندما يكون متاحًا لهذا الدور."
                />
              )}
            </TabsContent>

            <TabsContent value="payment-plan" className="mt-0">
              {(contract.paymentPlans ?? []).length === 0 ? (
                <EmptyPanel
                  title="لا توجد خطة دفع"
                  description="لم يتم تعريف دفعات أو مراحل تحصيل لهذا العقد."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-[42rem]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>الدفعة</TableHead>
                        <TableHead>المحفز</TableHead>
                        <TableHead>القيمة</TableHead>
                        <TableHead>الاستحقاق</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(contract.paymentPlans ?? []).map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.label}
                          </TableCell>
                          <TableCell>
                            {paymentPlanTriggerLabel(plan.triggerType)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(plan.amountValue)}
                          </TableCell>
                          <TableCell>
                            {plan.dueOffsetDays != null
                              ? `${formatNumber(plan.dueOffsetDays)} يوم`
                              : "عند الحدث"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={plan.isActive ? "secondary" : "outline"}
                            >
                              {plan.isActive ? "نشطة" : "متوقفة"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                          <TableCell>
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "PAID"
                                  ? "secondary"
                                  : invoice.status === "CANCELLED"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {invoiceStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatPortalDate(invoice.dueDate) || "—"}
                          </TableCell>
                          <TableCell>
                            {formatPortalDate(invoice.paidAt) || "—"}
                          </TableCell>
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
                            <TableCell>
                              {contractStatusLabel(entry.fromStatus)}
                            </TableCell>
                            <TableCell>
                              {contractStatusLabel(entry.toStatus)}
                            </TableCell>
                            <TableCell>{entry.changer?.name || "—"}</TableCell>
                            <TableCell>
                              {formatDateTime(entry.changedAt)}
                            </TableCell>
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
                            <TableCell>
                              {formatNumber(version.versionNumber)}
                            </TableCell>
                            <TableCell>
                              {version.filePath ? (
                                <Button asChild variant="ghost" size="sm">
                                  <a
                                    href={buildPortalFileUrl(version.filePath)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download data-icon="inline-start" />
                                    فتح الملف
                                  </a>
                                </Button>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(version.createdAt)}
                            </TableCell>
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
                      <span className="text-xs text-muted-foreground">
                        تحميل الملف لمراجعة الشروط الكاملة
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
      ) : null}
    </div>
  );
}

function ClientContractWorkspace({
  fileUrl,
  billingArea,
  responseArea,
}: {
  fileUrl?: string | null;
  billingArea?: ReactNode;
  responseArea?: ReactNode;
}) {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {billingArea || (
          <EmptyPanel
            title="لا توجد بيانات مالية"
            description="ستظهر تفاصيل الخدمات والفوترة عند توفرها."
          />
        )}
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>ملف العقد</CardTitle>
            <CardDescription>راجع الشروط الكاملة قبل التوقيع.</CardDescription>
          </CardHeader>
          <CardContent>
            {fileUrl ? (
              <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">ملف العقد</span>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowPdf((value) => !value)}>
                    {showPdf ? "إخفاء الملف" : "عرض الملف"}
                  </Button>
                  <Button asChild variant="outline">
                    <a href={fileUrl} download target="_blank" rel="noopener noreferrer">تحميل الملف</a>
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyPanel title="لا يوجد ملف مرفق" description="لم يتم العثور على ملف لهذا العقد." />
            )}
            {fileUrl && showPdf ? (
              <div className="mt-4 overflow-hidden rounded-xl border bg-muted/20">
                <iframe src={fileUrl} title="معاينة ملف العقد" className="h-[min(70vh,48rem)] w-full" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="lg:sticky lg:top-6">
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle>توقيع العقد</CardTitle>
            <CardDescription>راجع الخدمات والدفعات والملف ثم أكمل التوقيع.</CardDescription>
          </CardHeader>
          <CardContent>{responseArea || <EmptyPanel title="لا توجد إجراءات متاحة" description="لا يمكن توقيع هذا العقد حالياً." />}</CardContent>
        </Card>
      </div>
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
