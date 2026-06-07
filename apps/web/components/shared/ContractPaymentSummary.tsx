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
  PARTIAL: { label: "مدفوع جزئياً", icon: AlertCircle, color: "text-alert-600" },
  LATE: { label: "متأخر", icon: AlertCircle, color: "text-danger-600" },
  CANCELLED: { label: "ملغي", icon: Ban, color: "text-neutral-600" },
};

const PAYABLE_STATUSES = new Set(["PENDING", "SENT", "DUE", "PARTIAL", "LATE"]);

interface ContractPaymentSummaryProps {
  services: ServiceItem[];
  totalValue: number;
  invoices: InvoiceSummary[];
  showPayButton?: boolean;
  onPaymentComplete?: () => void;
}

export function ContractPaymentSummary({
  services,
  totalValue,
  invoices,
  showPayButton = false,
  onPaymentComplete,
}: ContractPaymentSummaryProps) {
  if (!services || services.length === 0 || !invoices || invoices.length === 0) {
    return null;
  }

  const toPayable = (invoice: InvoiceSummary): PayableInvoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    status: invoice.status,
  });

  return (
    <div className="rounded-xl border bg-card" dir="rtl">
        <div className="p-4 border-b bg-neutral-50/20">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-secondary-500" />
          ملخص العقد والدفع
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Services */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-300 font-medium">الخدمات المشمولة</p>
          <div className="rounded-lg border divide-y">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-natural-100">{service.name}</span>
                <span className="text-neutral-300 font-medium tabular-nums">
                  {service.price.toLocaleString("en-US")} ر.س
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 text-sm font-bold bg-neutral-50/20">
              <span>الإجمالي</span>
              <span className="tabular-nums">{totalValue.toLocaleString("en-US")} ر.س</span>
            </div>
          </div>
        </div>

        {/* Invoices list with inline forms inside each row */}
        <div className="space-y-2">
          <p className="text-xs text-neutral-300 font-medium">الفواتير</p>

          <div className="rounded-lg border">
            {invoices.map((invoice) => {
              const config = STATUS_CONFIG[invoice.status] ?? {
                label: invoice.status,
                icon: Clock,
                color: "text-neutral-300",
              };
              const Icon = config.icon;
              const isPaid = invoice.status === "PAID";
              const isPayable = showPayButton && PAYABLE_STATUSES.has(invoice.status);

              return (
                <div key={invoice.id} className="border-b last:border-b-0">
                  {/* Invoice info row */}
                  <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                       <span className="text-natural-100 truncate font-medium">
                        {invoice.invoiceNumber}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                        isPaid
                          ? "bg-success-50 text-success-700"
                          : "bg-alert-50 text-alert-700"
                        }`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums shrink-0">
                      {invoice.amount.toLocaleString("en-US")} ر.س
                    </span>
                  </div>

                  {/* Inline payment form — inside the same card, no extra border */}
                  {isPayable && (
                    <div className="px-3 pb-4">
                      <InlinePaymentCard
                        invoice={toPayable(invoice)}
                        onPaymentComplete={onPaymentComplete}
                        compact
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
