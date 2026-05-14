"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PortalInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  error?: boolean;
}

export function PortalInput({
  className,
  error,
  disabled,
  ...props
}: PortalInputProps) {
  return (
    <Input
      className={cn(
        "h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 text-base text-natural-100 placeholder:text-portal-note-text/60",
        "transition-colors focus-visible:border-secondary-500 focus-visible:ring-1 focus-visible:ring-secondary-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error &&
          "border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500/20",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
