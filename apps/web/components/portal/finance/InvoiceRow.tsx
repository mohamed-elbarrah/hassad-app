"use client";

import { CreditCard, Receipt } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { cn } from "@/lib/utils";
import type { PortalInvoiceSummary } from "@/features/portal/portalApi";
import type { PayableInvoice } from "@/components/payments/PaymentSheet";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { formatShortDateLong, isInvoicePayable as isPayable } from "@/lib/format";

export interface InvoiceRowProps {
  invoice: PortalInvoiceSummary;
  onPay: (invoice: PayableInvoice) => void;
}

/**
 * Cells-only renderer for the invoices queue. The <tr> chrome
 * is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderInvoiceRowCells(
  invoice: PortalInvoiceSummary,
  props: Pick<InvoiceRowProps, "onPay">,
): React.ReactNode[] {
  const canPay = isPayable(invoice.status, invoice.remainingAmount);
  const isPartial = invoice.status === "PARTIAL";
  const remaining =
    typeof invoice.remainingAmount === "number" && invoice.remainingAmount > 0
      ? invoice.remainingAmount
      : null;

  return [
    <td key="number" className="px-5 py-3.5 align-middle">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "bg-action-blue-soft text-action-blue",
          )}
          aria-hidden="true"
        >
          <Receipt className="h-4 w-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-natural-100 tabular-nums">
            {invoice.invoiceNumber ?? "—"}
          </span>
          {invoice.contract?.title && (
            <span className="text-xs text-portal-note-text truncate max-w-[260px]">
              {invoice.contract.title}
            </span>
          )}
        </div>
      </div>
    </td>,
    <td key="date" className="px-5 py-3.5 align-middle text-[12.5px] text-portal-note-text tabular-nums">
      {formatShortDateLong(invoice.issueDate ?? invoice.dueDate)}
    </td>,
    <td key="amount" className="px-5 py-3.5 align-middle text-start">
      <div className="flex flex-col items-start gap-0.5">
        <CurrencyDisplay
          amount={invoice.amount}
          size="sm"
          className={cn(
            "text-sm font-semibold tabular-nums",
            isPartial ? "text-natural-100/70" : "text-natural-100",
          )}
        />
        {isPartial && remaining != null && (
          <span className="text-xs font-semibold text-danger-700 tabular-nums">
            متبقي <CurrencyDisplay amount={remaining} size="sm" />
          </span>
        )}
      </div>
    </td>,
    <td key="status" className="px-5 py-3.5 align-middle">
      <DomainStatusPill domain="invoice" status={invoice.status} />
    </td>,
    <td key="action" className="px-5 py-3.5 align-middle text-start w-[140px]">
      {canPay ? (
        <ActionButton
          variant="primary"
          size="md"
          onClick={() =>
            props.onPay({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.amount,
              status: invoice.status,
            })
          }
          icon={<CreditCard className="h-3.5 w-3.5" />}
          className="h-8"
        >
          دفع
        </ActionButton>
      ) : (
        <span className="text-[12px] text-portal-note-text">—</span>
      )}
    </td>,
  ];
}