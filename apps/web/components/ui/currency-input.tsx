"use client";

import * as React from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
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
        className={cn("min-h-11 pe-16 text-start", className)}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 flex items-center border-s border-input px-3 text-sm text-muted-foreground">
        <SymbolRenderer currency={currency} width={24} height={20} />
      </span>
    </div>
  );
});
CurrencyInput.displayName = "CurrencyInput";
