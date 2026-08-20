"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

interface CalculatedAmountProps {
  value: string | number | null | undefined;
  ariaLabel: string;
  className?: string;
}

export function CalculatedAmount({
  value,
  ariaLabel,
  className,
}: CalculatedAmountProps) {
  return (
    <CurrencyInput
      aria-label={ariaLabel}
      aria-readonly="true"
      readOnly
      tabIndex={-1}
      value={String(value ?? 0)}
      className={cn("pointer-events-none bg-muted/40", className)}
    />
  );
}
