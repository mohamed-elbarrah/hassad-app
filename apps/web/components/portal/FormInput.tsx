"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
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
      disabled,
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
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-secondary-500 text-right">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full h-12 px-4 text-sm text-secondary-500 bg-white",
              "border border-neutral-200 rounded-xl",
              "placeholder:text-neutral-200",
              "focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20",
              "transition-colors duration-200",
              "text-right",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pr-12",
              showPasswordToggle && "pl-12",
              error &&
                "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
              className,
            )}
            disabled={disabled}
            {...props}
          />

          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {icon}
            </div>
          )}

          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-200 hover:text-neutral-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger-500 text-right">{error}</p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";