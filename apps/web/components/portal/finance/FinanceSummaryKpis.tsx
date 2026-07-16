"use client";

import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/design-system/Skeleton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { KpiCurrency } from "@/components/design-system/MetricCard";
import { cn } from "@/lib/utils";
import type { PortalFinanceSummary } from "@/features/portal/portalApi";
import { formatShortDateLong } from "@/lib/format";

interface FinanceSummaryKpisProps {
  data: PortalFinanceSummary | undefined;
  isLoading: boolean;
}

/**
 * Four-up KPI strip above the invoice queue.
 *
 * Order is intentional: money in (invoiced) → money owed
 * (remaining, brand-emphasized) → money settled (paid) → next
 * due. The "remaining" card is the only one tinted gold, so the
 * eye lands on the number that actually requires action.
 */
export function FinanceSummaryKpis({
  data,
  isLoading,
}: FinanceSummaryKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const summary: PortalFinanceSummary = data ?? {
    totalInvoiced: 0,
    totalPaid: 0,
    totalRemaining: 0,
    nextInvoiceDueDate: null,
    nextInvoiceAmount: 0,
  };

  const nextDate = formatShortDateLong(summary.nextInvoiceDueDate);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        title="إجمالي المفوتر"
        amount={summary.totalInvoiced}
      />
      <RemainingKpi amount={summary.totalRemaining} />
      <MetricCard
        title="إجمالي المدفوع"
        amount={summary.totalPaid}
      />
      <MetricCard
        title="الفاتورة القادمة"
        {...(nextDate
          ? { value: <NextDueDateDisplay date={nextDate} amount={summary.nextInvoiceAmount} /> }
          : { amount: summary.nextInvoiceAmount }
        )}
      />
    </div>
  );
}

/** Brand-emphasized KPI for the outstanding balance. */
function RemainingKpi({ amount }: { amount: number }) {
  return (
    <div
      className={cn(
        "min-w-[132px] rounded-2xl px-4 py-3",
        "bg-gradient-to-bl from-primary-100 to-primary-200/60",
        "ring-1 ring-inset ring-primary-300/60",
      )}
    >
      <div className="flex items-center gap-1.5 text-[12px] leading-5 text-primary-700">
        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-medium">المستحقات عليك</span>
      </div>
      <div className="mt-1">
        <KpiCurrency amount={amount} className="text-primary-800" />
      </div>
    </div>
  );
}

function NextDueDateDisplay({
  date,
  amount,
}: {
  date: string;
  amount: number;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-lg font-bold leading-7 text-secondary-500 tabular-nums">
        {date}
      </span>
      {amount > 0 && <KpiCurrency amount={amount} className="opacity-80" />}
    </div>
  );
}
