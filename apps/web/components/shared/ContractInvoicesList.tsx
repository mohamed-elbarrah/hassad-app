"use client";

import { useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  CreditCard,
} from "lucide-react";
import type { InvoiceSummary } from "@/features/contracts/contractsApi";
import {
  PaymentSheet,
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

interface ContractInvoicesListProps {
  invoices: InvoiceSummary[];
  showPayButton?: boolean;
  onPaymentComplete?: () => void;
}

export function ContractInvoicesList({
  invoices,
  showPayButton = false,
  onPaymentComplete,
}: ContractInvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<PayableInvoice | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!invoices || invoices.length === 0) return null;

  const handlePayClick = (invoice: InvoiceSummary) => {
    setSelectedInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
    });
    setSheetOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold">الفواتير</p>
        {invoices.map((invoice) => {
          const config = STATUS_CONFIG[invoice.status] ?? {
            label: invoice.status,
            icon: Clock,
            color: "text-muted-foreground",
          };
          const Icon = config.icon;
          const isPayable =
            showPayButton && PAYABLE_STATUSES.has(invoice.status);

          return (
            <div
              key={invoice.id}
              className="flex items-center justify-between text-sm py-1.5 flex-wrap gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <span className="text-portal-note-text truncate">
                  {invoice.invoiceNumber}
                </span>
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="text-portal-note-text text-xs">
                  {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="font-medium">
                  {invoice.amount.toLocaleString("en-US")} ر.س
                </span>
                {isPayable && (
                  <button
                    onClick={() => handlePayClick(invoice)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-secondary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-secondary-500/90 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    ادفع
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PaymentSheet
        invoice={selectedInvoice}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onPaymentComplete={onPaymentComplete}
      />
    </>
  );
}
