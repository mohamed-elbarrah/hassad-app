"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/portal/CurrencySymbol";

interface PortalKpiPillProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function PortalKpiPill({ label, value, className }: PortalKpiPillProps) {
  return (
    <div
      className={cn(
        "min-w-[132px] rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 py-3",
        className,
      )}
    >
      <p className="text-xs leading-5 text-portal-note-text">{label}</p>
      <div className="mt-1 text-lg font-semibold leading-7 text-secondary-500">
        {value}
      </div>
    </div>
  );
}

export interface PortalKpiCurrencyProps {
  amount: number;
  className?: string;
}

export function PortalKpiCurrency({
  amount,
  className,
}: PortalKpiCurrencyProps) {
  const { fmtAmount, currency } = useCurrency();

  return (
    <div className={cn("flex items-baseline justify-end gap-1", className)}>
      <span className="text-[28px] font-bold text-natural-100">
        {fmtAmount(amount)}
      </span>
      <SymbolRenderer
        currency={currency}
        className="text-sm font-medium text-portal-icon"
      />
    </div>
  );
}
