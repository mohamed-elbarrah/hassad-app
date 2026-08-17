"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface FormInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      icon,
      showPasswordToggle = false,
      error,
      className,
      type,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="block text-right text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              "h-12 rounded-xl px-4 text-right",
              icon && "pr-12",
              showPasswordToggle && "pl-12",
              error &&
                "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
              className,
            )}
            {...props}
          />

          {icon && (
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-right text-xs text-danger-600">{error}</p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";
