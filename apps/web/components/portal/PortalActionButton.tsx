"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalActionButtonProps {
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
  className?: string;
}

export function PortalActionButton({
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
  className,
}: PortalActionButtonProps) {
  const variantStyles = {
    primary:
      "bg-secondary-500 text-white hover:bg-secondary-600",
    secondary:
      "bg-secondary-100 text-secondary-500 hover:bg-secondary-200",
    outline:
      "border border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
    ghost:
      "bg-transparent text-portal-icon hover:bg-neutral-100",
    "toggle-active":
      "bg-secondary-500 text-white border-transparent hover:bg-secondary-600",
    "toggle-inactive":
      "bg-transparent border border-portal-card-border text-portal-icon hover:bg-badge-gray-bg",
    "action-purple":
      "bg-action-purple text-white hover:bg-action-purple-hover",
    "action-blue":
      "bg-action-blue text-white hover:bg-action-blue-hover",
    pm:
      "bg-pm-button-bg text-pm-button-text hover:bg-pm-button-bg/80",
    submit:
      "bg-secondary-500 text-white hover:bg-secondary-600",
  };

  const sizeStyles = {
    sm: "h-7 px-2.5 text-xs",
    md: "h-9 px-3 text-xs",
    lg: "h-12 px-4 text-sm",
    xl: "h-16 px-6 text-base",
  };

  const content = (
      <Button
      type={type}
      variant="ghost"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        "gap-1 rounded-xl font-medium shrink-0",
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
    </Button>
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
