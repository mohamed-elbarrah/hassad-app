"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AuthButtonVariant = "primary" | "outline" | "ghost" | "social";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AuthButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    { variant = "primary", fullWidth = false, className, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 h-12 font-medium text-sm",
          "rounded-xl transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "w-full": fullWidth,
            "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700":
              variant === "primary",
            "border border-neutral-200 bg-white text-secondary-500 hover:bg-neutral-100 hover:border-neutral-300":
              variant === "outline",
            "text-secondary-500 hover:text-secondary-600 hover:underline":
              variant === "ghost",
            "w-12 h-12 sm:flex-1 border border-neutral-200 bg-white text-secondary-500 hover:bg-neutral-100 hover:border-neutral-300 rounded-xl":
              variant === "social",
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
AuthButton.displayName = "AuthButton";
