"use client";

import { CheckCircle, Clock, AlertCircle, Send, Ban } from "lucide-react";
import type { InvoiceSummary } from "@/features/contracts/contractsApi";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  PAID: { label: "مدفوع", icon: CheckCircle, color: "text-emerald-600" },
  PENDING: { label: "معلق", icon: Clock, color: "text-amber-600" },
  SENT: { label: "مرسل", icon: Send, color: "text-blue-600" },
  DUE: { label: "مستحق", icon: AlertCircle, color: "text-orange-600" },
  PARTIAL: { label: "مدفوع جزئياً", icon: AlertCircle, color: "text-yellow-600" },
  LATE: { label: "متأخر", icon: AlertCircle, color: "text-red-600" },
  CANCELLED: { label: "ملغي", icon: Ban, color: "text-gray-600" },
};

interface ContractInvoicesListProps {
  invoices: InvoiceSummary[];
}

export function ContractInvoicesList({
  invoices,
}: ContractInvoicesListProps) {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm font-semibold">الفواتير</p>
      {invoices.map((invoice) => {
        const config = STATUS_CONFIG[invoice.status] ?? {
          label: invoice.status,
          icon: Clock,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;

        return (
          <div
            key={invoice.id}
            className="flex items-center justify-between text-sm py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
              <span className="text-foreground truncate">
                {invoice.invoiceNumber}
              </span>
              <span
                className={`text-xs font-medium ${config.color}`}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-muted-foreground text-xs">
                {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="font-medium">
                {invoice.amount.toLocaleString("en-US")} ر.س
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
