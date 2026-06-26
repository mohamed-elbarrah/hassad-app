"use client";

import { DollarSign, FileText } from "lucide-react";
import type { PortalPeriodInvoice } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import { EmptyState } from "./EmptyState";
import { formatDate } from "./helpers";
import { useCurrency } from "@/hooks/useCurrency";

interface InvoiceTabProps {
  invoice: PortalPeriodInvoice | null;
}

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-portal-note-text">{label}</span>
      <span className="text-sm font-medium text-natural-100">{value}</span>
    </div>
  );
}

/** Invoice tab — the period's invoice summary (PDF generation deferred). */
export function InvoiceTab({ invoice }: InvoiceTabProps) {
  const { fmtAmount } = useCurrency();

  if (!invoice) {
    return (
      <EmptyState
        icon={DollarSign}
        title="لا توجد فاتورة لهذه الفترة"
        description="سيتم إصدار فاتورة الفترة عند إغلاقها."
      />
    );
  }

  return (
    <SurfaceCard title="فاتورة هذه الفترة" icon={DollarSign}>
      <div
        className="grid grid-cols-1 gap-6 p-2 md:grid-cols-3 md:items-center"
        dir="rtl"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <DollarSign className="size-7" />
          </div>
          <div>
            <p className="text-sm text-portal-note-text">المبلغ المستحق</p>
            <p className="text-3xl font-bold text-natural-100">
              {fmtAmount(invoice.remainingAmount)}{" "}
              <CurrencySymbol className="inline-block" />
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:border-r md:border-portal-divider md:pr-6">
          <DetailRow label="رقم الفاتورة" value={invoice.invoiceNumber} />
          <DetailRow
            label="المبلغ الإجمالي"
            value={
              <>
                {fmtAmount(invoice.amount)}{" "}
                <CurrencySymbol className="inline-block" />
              </>
            }
          />
          <DetailRow
            label="المدفوع"
            value={
              <>
                {fmtAmount(invoice.paidAmount)}{" "}
                <CurrencySymbol className="inline-block" />
              </>
            }
          />
          <DetailRow
            label="تاريخ الاستحقاق"
            value={formatDate(invoice.dueDate)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <StatusBadge status={invoice.status} />
          <span className="inline-flex items-center gap-1.5 text-xs text-portal-note-text">
            <FileText className="size-4" />
            {formatDate(invoice.issueDate)}
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
}
