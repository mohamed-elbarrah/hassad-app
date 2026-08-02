"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useGetPortalInvoiceDetailQuery } from "@/features/portal/portalApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PaymentSheet,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";
import { toast } from "sonner";
import {
  Receipt,
  Download,
  CheckCircle2,
  CreditCard,
  Clock,
} from "lucide-react";
import { DetailBreadcrumb } from "@/components/portal/shared/DetailBreadcrumb";
import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";
import { DetailSkeleton } from "@/components/portal/shared/DetailSkeleton";
import { mapFinanceStatusToUI } from "@/lib/utils/statusMapping";
import { useCurrency } from "@/hooks/useCurrency";
import { InvoiceStatus } from "@hassad/shared";

const INVOICE_UI_STATUS: Record<
  string,
  { label: string; className: string }
> = {
  completed: {
    label: "مدفوع",
    className: "border-success-200 bg-success-100 text-success-600",
  },
  pending: {
    label: "معلق",
    className: "border-warning-200 bg-warning-100 text-warning-600",
  },
  revision: {
    label: "مستحق",
    className: "border-warning-200 bg-warning-100 text-warning-600",
  },
  active: {
    label: "مرسل",
    className: "border-info/20 bg-info/10 text-info",
  },
  overdue: {
    label: "متأخر",
    className: "border-danger-200 bg-danger-100 text-danger-600",
  },
  cancelled: {
    label: "ملغي",
    className: "border-neutral-200 bg-neutral-100 text-neutral-600",
  },
  unpaid: {
    label: "غير مدفوع",
    className: "border-danger-200 bg-danger-100 text-danger-600",
  },
};

const PAYABLE_STATUSES = new Set([
  InvoiceStatus.DUE,
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIAL,
  InvoiceStatus.LATE,
  InvoiceStatus.PENDING,
]);

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  void useRouter();
  const id = (params?.id as string) ?? "";
  const { fmtAmount } = useCurrency();

  const {
    data: invoice,
    isLoading,
    isError,
  } = useGetPortalInvoiceDetailQuery(id, {
    skip: !id,
  });

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton variant="invoice" />;
  }

  if (isError || !invoice) {
    return (
      <DetailErrorState
        title="تعذر تحميل الفاتورة"
        backHref="/portal/finance"
        backLabel="الفواتير"
      />
    );
  }

  const isPayable = PAYABLE_STATUSES.has(invoice.status as InvoiceStatus);
  const isPaid = invoice.status === InvoiceStatus.PAID;
  const isPartial = invoice.status === InvoiceStatus.PARTIAL;

  // Reuse the existing payment sheet — its `invoice` prop only needs the
  // minimal `PayableInvoice` shape (id, number, amount, status).
  const payable: PayableInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.remainingAmount ?? invoice.amount,
    status: invoice.status,
  };

  async function handleDownload() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/v1"}/portal/invoices/${invoice!.id}/download`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json?.url) window.open(json.url, "_blank");
      else toast.error("تعذر تحميل ملف الفاتورة");
    } catch {
      toast.error("تعذر تحميل ملف الفاتورة");
    }
  }

  const uiStatus = mapFinanceStatusToUI(invoice.status);
  const invoiceBadge = INVOICE_UI_STATUS[uiStatus] ?? {
    label: uiStatus,
    className: "border-neutral-200 bg-neutral-100 text-neutral-600",
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <DetailBreadcrumb
        backHref="/portal/finance"
        backLabel="المالية"
        title={`فاتورة #${invoice.invoiceNumber}`}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            فاتورة {invoice.invoiceNumber}
          </CardTitle>
          <Badge variant="outline" className={invoiceBadge.className}>
            {invoiceBadge.label}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {invoice.contract?.title && (
            <p className="text-sm text-muted-foreground">
              العقد: {invoice.contract.title}
            </p>
          )}

          {/* Top metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">المبلغ الإجمالي</p>
              <p className="mt-1 font-semibold text-foreground">
                {fmtAmount(invoice.amount)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">المدفوع</p>
              <p className="mt-1 font-semibold text-success-600">
                {fmtAmount(invoice.paidAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">المتبقي</p>
              <p
                className={
                  invoice.remainingAmount > 0
                    ? "mt-1 font-semibold text-danger-600"
                    : "mt-1 font-semibold text-foreground"
                }
              >
                {fmtAmount(invoice.remainingAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">تاريخ الاستحقاق</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                <Clock className="h-3 w-3" />
                {fmtDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {isPaid && (
            <Alert variant="default" className="border-success-200 bg-success-100">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              <AlertTitle>تم سداد هذه الفاتورة بالكامل.</AlertTitle>
              {invoice.payments?.length
                ? `آخر دفعة: ${fmtDateTime(invoice.payments[invoice.payments.length - 1]?.createdAt)}`
                : null}
            </Alert>
          )}

          {isPartial && (
            <Alert className="border-warning-200 bg-warning-100">
              <AlertTitle>
                دفعت جزءاً من الفاتورة. المتبقي{" "}
                {fmtAmount(invoice.remainingAmount)}.
              </AlertTitle>
            </Alert>
          )}

          {invoice.status === InvoiceStatus.LATE && (
            <Alert className="border-danger-200 bg-danger-100">
              <AlertTitle>هذه الفاتورة متأخرة السداد.</AlertTitle>
              يرجى السداد في أقرب وقت لتجنب إيقاف الخدمات.
            </Alert>
          )}

          {/* Items breakdown */}
          {invoice.items && invoice.items.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                بنود الفاتورة
              </h3>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="text-right font-medium">
                        الوصف
                      </TableHead>
                      <TableHead className="text-center font-medium">
                        الكمية
                      </TableHead>
                      <TableHead className="text-center font-medium">
                        سعر الوحدة
                      </TableHead>
                      <TableHead className="text-center font-medium">
                        الإجمالي
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-foreground">
                          {it.description}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {it.quantity}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {fmtAmount(it.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center font-medium text-foreground">
                          {fmtAmount(it.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Payment history */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                سجل المدفوعات ({invoice.payments.length})
              </h3>
              <div className="flex flex-col gap-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        className={
                          p.status === "SUCCESS"
                            ? "h-4 w-4 text-success-600"
                            : "h-4 w-4 text-muted-foreground"
                        }
                      />
                      <div>
                        <p className="text-sm text-foreground">
                          {fmtAmount(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDateTime(p.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.status === "SUCCESS" ? "ناجحة" : p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button
              data-icon="inline-start"
              variant="outline"
              className="gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              تحميل الفاتورة
            </Button>
            {isPayable && (
              <Button
                data-icon="inline-start"
                className="gap-2"
                onClick={() => setIsPaymentSheetOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                ادفع الآن ({fmtAmount(invoice.remainingAmount)})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentSheet
        invoice={payable}
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
      />
    </main>
  );
}
