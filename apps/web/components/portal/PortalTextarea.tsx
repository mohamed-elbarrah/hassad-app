"use client";

import type { TextareaHTMLAttributes } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface PortalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function PortalTextarea({
  className,
  error,
  disabled,
  ...props
}: PortalTextareaProps) {
  return (
    <Textarea
      className={cn(
        "min-h-[96px] rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 py-3 text-base text-natural-100 placeholder:text-portal-note-text/60",
        "transition-colors focus-visible:border-secondary-500 focus-visible:ring-1 focus-visible:ring-secondary-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none",
        error &&
          "border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500/20",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
