"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DS-styled <textarea> for use inside shadcn FormControl.
 * Must remain a bare <textarea> (no wrapper div) so FormControl's Slot
 * can pass aria-invalid / aria-describedby directly to the element.
 */
export const FormTextareaControl = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, disabled, ...props }, ref) => {
  return (
    <textarea
      disabled={disabled}
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-secondary-500",
        "placeholder:text-neutral-200",
        "focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20",
        "transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "text-right resize-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
FormTextareaControl.displayName = "FormTextareaControl";
