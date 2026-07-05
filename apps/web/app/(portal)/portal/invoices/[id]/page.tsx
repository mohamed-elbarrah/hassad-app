"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetPortalInvoiceDetailQuery } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { InfoPanel } from "@/components/design-system/InfoPanel";
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
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <DetailBreadcrumb
        backHref="/portal/finance"
        backLabel="المالية"
        title={`فاتورة #${invoice.invoiceNumber}`}
      />

      <SurfaceCard
        title={`فاتورة ${invoice.invoiceNumber}`}
        icon={Receipt}
        action={<StatusBadge status={mapFinanceStatusToUI(invoice.status)} />}
      >
        <div className="space-y-5">
          {invoice.contract?.title && (
            <p className="text-sm text-portal-note-text">
              العقد: {invoice.contract.title}
            </p>
          )}

          {/* Top metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoPanel variant="default" title="المبلغ الإجمالي">
              <p className="font-semibold text-natural-100">
                {fmtAmount(invoice.amount)}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="المدفوع">
              <p className="font-semibold text-success-600">
                {fmtAmount(invoice.paidAmount)}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="المتبقي">
              <p
                className={
                  invoice.remainingAmount > 0
                    ? "font-semibold text-danger-600"
                    : "font-semibold text-natural-100"
                }
              >
                {fmtAmount(invoice.remainingAmount)}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ الاستحقاق">
              <p className="font-semibold text-natural-100 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fmtDate(invoice.dueDate)}
              </p>
            </InfoPanel>
          </div>

          {isPaid && (
            <StatusBanner
              variant="success"
              title="تم سداد هذه الفاتورة بالكامل."
            >
              {invoice.payments?.length
                ? `آخر دفعة: ${fmtDateTime(invoice.payments[invoice.payments.length - 1]?.createdAt)}`
                : null}
            </StatusBanner>
          )}

          {isPartial && (
            <StatusBanner
              variant="warning"
              title={`دفعت جزءاً من الفاتورة. المتبقي ${fmtAmount(invoice.remainingAmount)}.`}
            />
          )}

          {invoice.status === InvoiceStatus.LATE && (
            <StatusBanner variant="danger" title="هذه الفاتورة متأخرة السداد.">
              يرجى السداد في أقرب وقت لتجنب إيقاف الخدمات.
            </StatusBanner>
          )}

          {/* Items breakdown */}
          {invoice.items && invoice.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-natural-100 mb-3">
                بنود الفاتورة
              </h3>
              <div className="overflow-hidden rounded-2xl border-[1.5px] border-portal-divider">
                <table className="w-full text-sm" dir="rtl">
                  <thead className="bg-portal-bg text-portal-note-text">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">
                        الوصف
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        الكمية
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        سعر الوحدة
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it) => (
                      <tr
                        key={it.id}
                        className="border-t-[1.5px] border-portal-divider"
                      >
                        <td className="px-4 py-3 text-natural-100">
                          {it.description}
                        </td>
                        <td className="px-4 py-3 text-center text-portal-note-text">
                          {it.quantity}
                        </td>
                        <td className="px-4 py-3 text-center text-portal-note-text">
                          {fmtAmount(it.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-natural-100">
                          {fmtAmount(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment history */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-natural-100 mb-3">
                سجل المدفوعات ({invoice.payments.length})
              </h3>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border-[1.5px] border-portal-divider px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        className={
                          p.status === "SUCCESS"
                            ? "h-4 w-4 text-success-600"
                            : "h-4 w-4 text-portal-note-text"
                        }
                      />
                      <div>
                        <p className="text-sm text-natural-100">
                          {fmtAmount(p.amount)}
                        </p>
                        <p className="text-xs text-portal-note-text">
                          {fmtDateTime(p.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-portal-note-text">
                      {p.status === "SUCCESS" ? "ناجحة" : p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <ActionButton
              variant="outline"
              size="md"
              icon={<Download className="h-4 w-4" />}
              className="gap-2 border-[1.5px] border-portal-card-border bg-natural-0"
              onClick={handleDownload}
            >
              تحميل الفاتورة
            </ActionButton>
            {isPayable && (
              <ActionButton
                variant="primary"
                size="md"
                icon={<CreditCard className="h-4 w-4" />}
                className="gap-2 bg-secondary-500 hover:bg-secondary-600"
                onClick={() => setIsPaymentSheetOpen(true)}
              >
                ادفع الآن ({fmtAmount(invoice.remainingAmount)})
              </ActionButton>
            )}
          </div>
        </div>
      </SurfaceCard>

      <PaymentSheet
        invoice={payable}
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
      />
    </div>
  );
}
