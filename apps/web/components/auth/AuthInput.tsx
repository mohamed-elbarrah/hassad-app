"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: "mail" | "lock" | "phone" | "user";
  showPasswordToggle?: boolean;
  error?: string;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
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

    const iconMap = {
      mail: <Mail className="w-5 h-5 text-neutral-200" />,
      lock: <Lock className="w-5 h-5 text-neutral-200" />,
      phone: (
        <svg
          className="w-5 h-5 text-neutral-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      user: (
        <svg
          className="w-5 h-5 text-neutral-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    };

    return (
      <div className="w-full space-y-2">
        <label className="block text-sm font-medium text-secondary-500 text-right">
          {label}
        </label>
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
              icon && "pr-12",
              showPasswordToggle && "pl-12",
              error &&
                "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
              className,
            )}
            {...props}
          />

          {/* Right icon (inside input, right side for RTL) */}
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {iconMap[icon]}
            </div>
          )}

          {/* Password toggle (left side for RTL) */}
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
        {error && <p className="text-xs text-danger-500 text-right">{error}</p>}
      </div>
    );
  },
);
AuthInput.displayName = "AuthInput";
