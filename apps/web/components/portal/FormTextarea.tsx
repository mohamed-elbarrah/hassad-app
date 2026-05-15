"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(({ label, error, className, disabled, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-500 text-right">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            "w-full min-h-[96px] px-4 py-3 text-sm text-secondary-500 bg-white",
            "border border-neutral-200 rounded-xl",
            "placeholder:text-neutral-200",
            "focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20",
            "transition-colors duration-200",
            "text-right resize-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
            className,
          )}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger-500 text-right">{error}</p>
      )}
    </div>
  );
});
FormTextarea.displayName = "FormTextarea";