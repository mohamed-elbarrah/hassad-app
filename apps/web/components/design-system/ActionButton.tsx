"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "toggle-active"
    | "toggle-inactive"
    | "action-purple"
    | "action-blue"
    | "pm"
    | "submit";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  iconPosition?: "left" | "right";
  type?: "button" | "submit";
  form?: string;
  className?: string;
  title?: string;
}

export function ActionButton({
  href,
  onClick,
  children,
  icon,
  variant = "outline",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  iconPosition = "left",
  type = "button",
  form,
  className,
  title,
}: ActionButtonProps) {
  const variantStyles = {
    primary:
      "bg-secondary-500 text-white hover:bg-secondary-400 hover:text-white active:bg-secondary-700",
    secondary:
      "bg-secondary-100 text-secondary-500 hover:bg-secondary-200 hover:text-secondary-600 active:bg-secondary-300",
    outline:
      "border border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 active:bg-neutral-100",
    ghost:
      "bg-transparent text-portal-icon hover:bg-neutral-100 hover:text-secondary-500 active:bg-neutral-200",
    "toggle-active":
      "bg-secondary-500 text-white border border-transparent hover:bg-secondary-400 hover:text-white active:bg-secondary-700",
    "toggle-inactive":
      "bg-transparent border border-portal-card-border text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 active:bg-neutral-100",
    "action-purple":
      "bg-action-purple text-white hover:bg-action-purple-hover hover:text-white active:bg-action-purple",
    "action-blue":
      "bg-action-blue text-white hover:bg-action-blue-hover hover:text-white active:bg-action-blue",
    pm: "bg-pm-button-bg text-pm-button-text hover:bg-pm-button-bg/80 hover:text-pm-button-text active:bg-pm-button-bg/60",
    submit:
      "bg-secondary-500 text-white hover:bg-secondary-400 hover:text-white active:bg-secondary-700",
  };

  const sizeStyles = {
    sm: "h-7 px-2.5 text-xs",
    md: "h-9 px-3 text-xs",
    lg: "h-12 px-4 text-sm",
    xl: "h-16 px-6 text-base",
  };

  const content = (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-xl font-medium shrink-0 cursor-pointer transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {icon && iconPosition === "left" && !loading && (
        <span className="shrink-0">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && !loading && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
