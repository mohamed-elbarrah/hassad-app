"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DS-styled <input> for use inside shadcn FormControl.
 * Must remain a bare <input> (no wrapper div) so FormControl's Slot
 * can pass aria-invalid / aria-describedby directly to the element.
 */
export const FormInputControl = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, disabled, ...props }, ref) => {
  return (
    <input
      type={type}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-secondary-500",
        "placeholder:text-neutral-200",
        "focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20",
        "transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "text-right",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
FormInputControl.displayName = "FormInputControl";
