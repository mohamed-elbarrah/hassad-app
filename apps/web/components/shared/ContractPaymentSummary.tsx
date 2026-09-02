"use client";

import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  FileText,
} from "lucide-react";
import type { InvoiceSummary } from "@/features/contracts/contractsApi";
import type { ServiceItem } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  InlinePaymentCard,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  PAID: { label: "مدفوع", icon: CheckCircle, color: "text-success-600" },
  PENDING: { label: "معلق", icon: Clock, color: "text-alert-600" },
  SENT: { label: "مرسل", icon: Send, color: "text-action-blue" },
  DUE: { label: "مستحق", icon: AlertCircle, color: "text-alert-600" },
  PARTIAL: {
    label: "مدفوع جزئياً",
    icon: AlertCircle,
    color: "text-alert-600",
  },
  LATE: { label: "متأخر", icon: AlertCircle, color: "text-danger-600" },
  CANCELLED: { label: "ملغي", icon: Ban, color: "text-natural-100" },
};

const PAYABLE_STATUSES = new Set(["PENDING", "SENT", "DUE", "PARTIAL", "LATE"]);

interface ContractPaymentSummaryProps {
  services: ServiceItem[];
  totalValue: number;
  currency?: string;
  invoices?: Array<
    InvoiceSummary & {
      currency?: string;
      paidAmount?: number;
      remainingAmount?: number;
    }
  > | null;
  initialPaymentRequired?: boolean;
  initialPaymentAmount?: number | null;
  initialPaymentRemainingAmount?: number | null;
  initialPaymentStatus?: string | null;
  isPaymentLoading?: boolean;
  paymentError?: boolean;
  showPayButton?: boolean;
  onPaymentComplete?: () => void;
}

export function ContractPaymentSummary({
  services,
  totalValue,
  currency,
  invoices,
  initialPaymentRequired = false,
  initialPaymentAmount,
  initialPaymentRemainingAmount,
  initialPaymentStatus,
  isPaymentLoading = false,
  paymentError = false,
  showPayButton = false,
  onPaymentComplete,
}: ContractPaymentSummaryProps) {
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const hasPaymentSection = initialPaymentRequired || safeInvoices.length > 0;
  if ((!services || services.length === 0) && !hasPaymentSection) return null;

  const toPayable = (
    invoice: InvoiceSummary & {
      remainingAmount?: number;
      currency?: string;
    },
  ): PayableInvoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.remainingAmount ?? invoice.amount,
    currency: invoice.currency ?? currency,
    status: invoice.status,
  });

  return (
    <Card dir="rtl">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText />
          الفوترة والدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {services && services.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium">الخدمات</div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableBody>
                  {services.map((service, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="text-left tabular-nums">
                        {formatCurrency(service.price, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">الإجمالي</TableCell>
                    <TableCell className="text-left font-semibold tabular-nums">
                      {formatCurrency(totalValue, currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">الفواتير</div>
          {isPaymentLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : paymentError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              تعذر تحميل بيانات الدفع. يرجى المحاولة مرة أخرى.
            </p>
          ) : safeInvoices.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {initialPaymentRequired
                ? `الدفعة الأولى مطلوبة بقيمة ${formatCurrency(initialPaymentAmount ?? 0, currency)} (المتبقي ${formatCurrency(initialPaymentRemainingAmount ?? initialPaymentAmount ?? 0, currency)})، وستصبح الفاتورة متاحة للدفع قريباً.`
                : "لا توجد فواتير متاحة للدفع حالياً."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {safeInvoices.map((invoice) => {
                const config = STATUS_CONFIG[invoice.status] ?? {
                  label: invoice.status,
                  icon: Clock,
                  color: "text-muted-foreground",
                };
                const Icon = config.icon;
                const isPaid = invoice.status === "PAID";
                const isPayable =
                  showPayButton && PAYABLE_STATUSES.has(invoice.status);

                return (
                  <Card key={invoice.id}>
                    <CardContent className="flex flex-col gap-4 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon className={config.color} />
                          <span className="truncate text-sm font-medium">
                            {invoice.invoiceNumber}
                          </span>
                          <Badge variant={isPaid ? "secondary" : "outline"}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-sm font-semibold tabular-nums">
                          {formatCurrency(
                            invoice.amount,
                            invoice.currency ?? currency,
                          )}
                        </div>
                      </div>
                      {(() => {
                        const paid =
                          invoice.paidAmount ??
                          (invoice.payments ?? [])
                            .filter((payment) => payment.status === "SUCCESS")
                            .reduce((sum, payment) => sum + payment.amount, 0);
                        const remaining =
                          invoice.remainingAmount ??
                          Math.max(0, invoice.amount - paid);
                        return remaining > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            المتبقي:{" "}
                            {formatCurrency(
                              remaining,
                              invoice.currency ?? currency,
                            )}
                          </p>
                        ) : null;
                      })()}

                      {isPayable ? (
                        <InlinePaymentCard
                          invoice={toPayable(invoice)}
                          onPaymentComplete={onPaymentComplete}
                          compact
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        {initialPaymentRequired && initialPaymentStatus === "PAID" ? (
          <p className="flex items-center gap-2 text-sm text-success-600">
            <CheckCircle className="size-4" /> تم استلام الدفعة الأولى.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
