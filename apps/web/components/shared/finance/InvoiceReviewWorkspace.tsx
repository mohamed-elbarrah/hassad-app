"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  Landmark,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import {
  InvoiceStatus,
  PAYMENT_METHOD_AR,
  PaymentMethod,
  PaymentStatus,
} from "@hassad/shared";
import type {
  InvoicePaymentDetails,
  PaginatedInvoices,
} from "@/features/finance/financeApi";
import { portalErrorMessage } from "@/lib/i18n";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export type InvoiceReviewRow = PaginatedInvoices["items"][number];

interface InvoiceReviewWorkspaceProps {
  title: string;
  description: string;
  invoices: InvoiceReviewRow[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;
  selectedInvoiceId: string | null;
  selectedInvoice: InvoicePaymentDetails | null;
  isDetailLoading: boolean;
  isReviewing: boolean;
  onSelectInvoice: (id: string | null) => void;
  onFiltersChange: (filters: {
    status?: string;
    method?: string;
    search?: string;
  }) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onApprove: (paymentId: string, reason?: string) => Promise<void>;
  onReject: (paymentId: string, reason: string) => Promise<void>;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "مرسلة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  PENDING: "قيد المراجعة",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: "تم إنشاء العملية",
  PENDING: "بانتظار المراجعة",
  SUCCESS: "مقبولة",
  FAILED: "فاشلة",
  REJECTED: "مرفوضة",
  REFUNDED: "مستردة",
};

function invoiceStatusVariant(status: string) {
  if (status === InvoiceStatus.PAID) return "secondary" as const;
  if (status === InvoiceStatus.LATE || status === InvoiceStatus.CANCELLED) {
    return "destructive" as const;
  }
  return "outline" as const;
}

function paymentStatusVariant(status: string) {
  if (status === PaymentStatus.SUCCESS) return "secondary" as const;
  if (status === PaymentStatus.FAILED || status === PaymentStatus.REJECTED) {
    return "destructive" as const;
  }
  return "outline" as const;
}

function getPaidAmount(invoice: InvoiceReviewRow) {
  return (
    invoice.paidAmount ??
    (invoice.payments ?? [])
      .filter((payment) => payment.status === PaymentStatus.SUCCESS)
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
}

function getPendingAmount(invoice: InvoiceReviewRow) {
  return (
    invoice.pendingAmount ??
    (invoice.payments ?? [])
      .filter((payment) => payment.status === PaymentStatus.PENDING)
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
}

function formatAmountByCurrency(
  invoices: InvoiceReviewRow[],
  getAmount: (invoice: InvoiceReviewRow) => number,
) {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    const currency = invoice.currency ?? "SAR";
    totals.set(currency, (totals.get(currency) ?? 0) + getAmount(invoice));
  }
  return Array.from(totals.entries())
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" + ");
}

function getPendingReviewAmount(invoice: InvoiceReviewRow) {
  return (invoice.payments ?? [])
    .filter(
      (payment) =>
        payment.method === PaymentMethod.BANK_TRANSFER &&
        payment.status === PaymentStatus.PENDING,
    )
    .reduce((sum, payment) => sum + payment.amount, 0);
}

function ReviewActions({
  payment,
  disabled,
  onApprove,
  onReject,
}: {
  payment: InvoicePaymentDetails["payments"][number];
  disabled: boolean;
  onApprove: (paymentId: string) => Promise<void>;
  onReject: (paymentId: string, reason: string) => Promise<void>;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (
    payment.method !== PaymentMethod.BANK_TRANSFER ||
    payment.status !== PaymentStatus.PENDING
  ) {
    return null;
  }

  const reject = async () => {
    if (!reason.trim()) {
      toast.error("يجب إدخال سبب الرفض.");
      return;
    }
    try {
      await onReject(payment.id, reason.trim());
      setRejectOpen(false);
      setReason("");
      toast.success("تم رفض التحويل البنكي.");
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  };

  const approve = async () => {
    try {
      await onApprove(payment.id);
      toast.success("تم اعتماد التحويل البنكي.");
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  };

  return (
    <>
      {!payment.receiptUrl ? (
        <p className="text-sm text-muted-foreground">
          لا يمكن اعتماد التحويل قبل إرفاق الإيصال.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={disabled || !payment.receiptUrl}
          onClick={approve}
        >
          {disabled ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <CheckCircle2 data-icon="inline-start" />
          )}
          اعتماد التحويل
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={disabled}
          onClick={() => setRejectOpen(true)}
        >
          <XCircle data-icon="inline-start" />
          رفض التحويل
        </Button>
      </div>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض التحويل البنكي</DialogTitle>
            <DialogDescription>
              أدخل سبباً واضحاً ليظهر للمتابعة الداخلية.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`reject-reason-${payment.id}`}>سبب الرفض</Label>
            <Textarea
              id={`reject-reason-${payment.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="مثال: المبلغ المحول لا يطابق الفاتورة"
              aria-required="true"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={disabled || !reason.trim()}
              onClick={reject}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InvoiceReviewWorkspace({
  title,
  description,
  invoices,
  total,
  page,
  limit,
  isLoading,
  isError,
  selectedInvoiceId,
  selectedInvoice,
  isDetailLoading,
  isReviewing,
  onSelectInvoice,
  onFiltersChange,
  onPageChange,
  onRefresh,
  onApprove,
  onReject,
}: InvoiceReviewWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");

  const filteredInvoices = invoices;

  const pendingReviewCount = invoices.reduce(
    (count, invoice) => count + (getPendingReviewAmount(invoice) > 0 ? 1 : 0),
    0,
  );

  if (isLoading) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onRefresh}>
            تحديث
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                الفواتير في الصفحة الحالية
              </span>
              <strong className="text-2xl">
                {formatNumber(filteredInvoices.length)}
              </strong>
            </div>
            <FileText className="text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                التحويلات المعلقة في الصفحة
              </span>
              <strong className="text-2xl">
                {formatNumber(pendingReviewCount)}
              </strong>
            </div>
            <Landmark className="text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                المحصل في الصفحة
              </span>
              <strong className="text-2xl">
                {formatAmountByCurrency(filteredInvoices, getPaidAmount)}
              </strong>
            </div>
            <CheckCircle2 className="text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger
                  value="ALL"
                  onClick={() => {
                    setStatus("ALL");
                    onFiltersChange({});
                    onPageChange(1);
                  }}
                >
                  الكل
                </TabsTrigger>
                <TabsTrigger
                  value="PENDING_REVIEW"
                  onClick={() => {
                    setStatus("PENDING_REVIEW");
                    onFiltersChange({ status: "PENDING_REVIEW" });
                    onPageChange(1);
                  }}
                >
                  تحويلات قيد المراجعة
                </TabsTrigger>
                <TabsTrigger
                  value={InvoiceStatus.PENDING}
                  onClick={() => {
                    setStatus(InvoiceStatus.PENDING);
                    onFiltersChange({ status: InvoiceStatus.PENDING });
                    onPageChange(1);
                  }}
                >
                  فواتير معلقة
                </TabsTrigger>
                <TabsTrigger
                  value={InvoiceStatus.PAID}
                  onClick={() => {
                    setStatus(InvoiceStatus.PAID);
                    onFiltersChange({ status: InvoiceStatus.PAID });
                    onPageChange(1);
                  }}
                >
                  مدفوعة
                </TabsTrigger>
                <TabsTrigger
                  value={InvoiceStatus.PARTIAL}
                  onClick={() => {
                    setStatus(InvoiceStatus.PARTIAL);
                    onFiltersChange({ status: InvoiceStatus.PARTIAL });
                    onPageChange(1);
                  }}
                >
                  جزئية
                </TabsTrigger>
                <TabsTrigger
                  value={InvoiceStatus.LATE}
                  onClick={() => {
                    setStatus(InvoiceStatus.LATE);
                    onFiltersChange({ status: InvoiceStatus.LATE });
                    onPageChange(1);
                  }}
                >
                  متأخرة
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[540px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    onFiltersChange({
                      status: status === "ALL" ? undefined : status,
                      method: method === "ALL" ? undefined : method,
                      search: value || undefined,
                    });
                    onPageChange(1);
                  }}
                  placeholder="ابحث برقم الفاتورة أو العميل"
                  className="pr-10"
                />
              </div>
              <Select
                value={method}
                onValueChange={(value) => {
                  setMethod(value);
                  onFiltersChange({
                    status: status === "ALL" ? undefined : status,
                    method: value === "ALL" ? undefined : value,
                    search: search || undefined,
                  });
                  onPageChange(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل طرق الدفع</SelectItem>
                  {Object.entries(PAYMENT_METHOD_AR).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <Empty>
              <EmptyMedia variant="icon">
                <AlertTriangle />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل الفواتير</EmptyTitle>
                <EmptyDescription>حاول التحديث مرة أخرى.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filteredInvoices.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد فواتير مطابقة</EmptyTitle>
                <EmptyDescription>غيّر البحث أو الفلاتر.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>المحصّل</TableHead>
                    <TableHead>قيد المراجعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الاستحقاق</TableHead>
                    <TableHead>التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">
                            {invoice.invoiceNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {PAYMENT_METHOD_AR[invoice.paymentMethod] ??
                              invoice.paymentMethod}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{invoice.client?.companyName ?? "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.client?.user?.name ??
                              invoice.client?.user?.email ??
                              "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          getPaidAmount(invoice),
                          invoice.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {formatCurrency(
                              getPendingAmount(invoice),
                              invoice.currency,
                            )}
                          </span>
                          {getPendingReviewAmount(invoice) > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              تحويل يحتاج مراجعة
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={invoiceStatusVariant(invoice.status)}>
                            {INVOICE_STATUS_LABELS[invoice.status] ??
                              invoice.status}
                          </Badge>
                          {getPendingReviewAmount(invoice) > 0 ? (
                            <Badge variant="outline">مراجعة مطلوبة</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(invoice.dueDate)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectInvoice(invoice.id)}
                        >
                          <Eye data-icon="inline-start" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {total > limit ? (
          <div className="border-t p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    direction="rtl"
                    text="السابق"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">
                    صفحة {page} من {Math.ceil(total / limit)}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    direction="rtl"
                    text="التالي"
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() =>
                      onPageChange(Math.min(Math.ceil(total / limit), page + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </Card>

      <Drawer
        open={Boolean(selectedInvoiceId)}
        onOpenChange={(open) => !open && onSelectInvoice(null)}
      >
        <DrawerContent>
          <DrawerHeader className="border-b text-right">
            <DrawerTitle>
              {selectedInvoice?.invoiceNumber ?? "تفاصيل الفاتورة"}
            </DrawerTitle>
            <DrawerDescription>
              بيانات الفاتورة، الدفعات، الإيصالات، وسجل المراجعة.
            </DrawerDescription>
          </DrawerHeader>
          {isDetailLoading || !selectedInvoice ? (
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      الإجمالي
                    </span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.amount,
                        selectedInvoice.currency,
                      )}
                    </strong>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      المحصّل
                    </span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.paidAmount,
                        selectedInvoice.currency,
                      )}
                    </strong>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      قيد المراجعة
                    </span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.pendingAmount,
                        selectedInvoice.currency,
                      )}
                    </strong>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      الحالة
                    </span>
                    <Badge
                      variant={invoiceStatusVariant(selectedInvoice.status)}
                    >
                      {INVOICE_STATUS_LABELS[selectedInvoice.status] ??
                        selectedInvoice.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الفاتورة والعميل</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">
                      العميل
                    </span>
                    <strong>
                      {selectedInvoice.client?.companyName ?? "—"}
                    </strong>
                    <span className="text-sm text-muted-foreground">
                      {selectedInvoice.client?.user?.name ?? "—"} ·{" "}
                      {selectedInvoice.client?.user?.email ?? "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">العقد</span>
                    <strong>
                      {selectedInvoice.contract?.title ?? "بدون عقد مرتبط"}
                    </strong>
                    <span className="text-sm text-muted-foreground">
                      {selectedInvoice.contract?.status ?? "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">
                      تاريخ الإصدار
                    </span>
                    <span>{formatDateTime(selectedInvoice.issueDate)}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">
                      تاريخ الاستحقاق
                    </span>
                    <span>{formatDateTime(selectedInvoice.dueDate)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الدفعات والمراجعة</CardTitle>
                  <CardDescription>
                    لا تعتبر الدفعة البنكية محصلة إلا بعد اعتمادها.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {selectedInvoice.payments.length === 0 ? (
                    <Empty>
                      <EmptyMedia variant="icon">
                        <Landmark />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>لا توجد دفعات</EmptyTitle>
                        <EmptyDescription>
                          لم تسجل دفعة لهذه الفاتورة.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    selectedInvoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col gap-4 rounded-lg border p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                              المبلغ
                            </span>
                            <strong>
                              {formatCurrency(payment.amount, payment.currency)}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                              الطريقة
                            </span>
                            <span>
                              {PAYMENT_METHOD_AR[payment.method] ??
                                payment.method}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                              الحالة
                            </span>
                            <Badge
                              variant={paymentStatusVariant(payment.status)}
                            >
                              {PAYMENT_STATUS_LABELS[payment.status] ??
                                payment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                              التاريخ
                            </span>
                            <span>{formatDateTime(payment.date)}</span>
                          </div>
                        </div>
                        {payment.providerPaymentId ? (
                          <p className="text-sm text-muted-foreground">
                            مرجع المزود:{" "}
                            <span className="font-mono text-foreground">
                              {payment.providerPaymentId}
                            </span>
                          </p>
                        ) : null}
                        {payment.receiptUrl ? (
                          <a
                            className="text-sm text-primary underline"
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            عرض إيصال التحويل
                          </a>
                        ) : payment.method === PaymentMethod.BANK_TRANSFER ? (
                          <p className="text-sm text-muted-foreground">
                            لم يتم إرفاق إيصال.
                          </p>
                        ) : null}
                        {payment.notes ? (
                          <p className="text-sm text-muted-foreground">
                            ملاحظات:{" "}
                            <span className="text-foreground">
                              {payment.notes}
                            </span>
                          </p>
                        ) : null}
                        {payment.reviewReason ? (
                          <p className="text-sm text-muted-foreground">
                            سبب المراجعة:{" "}
                            <span className="text-foreground">
                              {payment.reviewReason}
                            </span>
                          </p>
                        ) : null}
                        {payment.reviewer ? (
                          <p className="text-sm text-muted-foreground">
                            راجعها:{" "}
                            <span className="text-foreground">
                              {payment.reviewer.name}
                            </span>{" "}
                            · {formatDateTime(payment.reviewedAt)}
                          </p>
                        ) : null}
                        <ReviewActions
                          payment={payment}
                          disabled={isReviewing}
                          onApprove={onApprove}
                          onReject={onReject}
                        />
                        {payment.events.length > 0 ? (
                          <div className="flex flex-col gap-2 border-t pt-3">
                            <span className="text-sm font-medium">السجل</span>
                            {payment.events.map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
                              >
                                <span>
                                  {PAYMENT_STATUS_LABELS[event.type] ??
                                    event.type}
                                </span>
                                <span>{formatDateTime(event.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={() => onSelectInvoice(null)}>
              إغلاق
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
