"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

/**
 * Shadcn-styled <textarea> for use inside shadcn FormControl.
 * Must remain a bare <textarea> (no wrapper div) so FormControl's Slot
 * can pass aria-invalid / aria-describedby directly to the element.
 */
export const FormTextareaControl = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <Textarea
      className={["text-right resize-none", className].filter(Boolean).join(" ")}
      ref={ref}
      {...props}
    />
  );
});
FormTextareaControl.displayName = "FormTextareaControl";
