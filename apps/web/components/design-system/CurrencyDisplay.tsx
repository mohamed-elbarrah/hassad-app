"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | undefined | null;
  className?: string;
  symbolClassName?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function CurrencyDisplay({
  amount,
  className,
  symbolClassName,
  size = "md",
}: CurrencyDisplayProps) {
  const { fmtAmount, currency, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className="animate-pulse bg-neutral-200 rounded h-4 w-16" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        sizeMap[size],
        className,
      )}
    >
      <span>{fmtAmount(amount)}</span>
      <SymbolRenderer
        currency={currency}
        className={cn("inline-flex shrink-0", symbolClassName)}
      />
    </span>
  );
}
