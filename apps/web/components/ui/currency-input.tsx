"use client";

import * as React from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
  const { currency } = useCurrency();

  return (
    <div className="relative">
      <Input
        ref={ref}
        {...props}
        className={cn("pl-16 text-right", className)}
      />
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-input px-3 text-sm text-muted-foreground">
        {currency.symbol}
      </span>
    </div>
  );
});
CurrencyInput.displayName = "CurrencyInput";
