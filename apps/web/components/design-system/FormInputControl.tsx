"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * Shadcn-styled <input> for use inside shadcn FormControl.
 * Must remain a bare <input> (no wrapper div) so FormControl's Slot
 * can pass aria-invalid / aria-describedby directly to the element.
 */
export const FormInputControl = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <Input
      type={type}
      className={cnRtl(className)}
      ref={ref}
      {...props}
    />
  );
});
FormInputControl.displayName = "FormInputControl";

function cnRtl(className?: string) {
  return ["text-right", className].filter(Boolean).join(" ");
}
