"use client";

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BANNER_VARIANTS = {
  success: {
    border: "border-badge-green-bg",
    bg: "bg-badge-green-bg",
    iconClass: "text-badge-green-text",
    textClass: "text-badge-green-text",
    Icon: CheckCircle,
  },
  warning: {
    border: "border-badge-orange-bg",
    bg: "bg-badge-orange-bg",
    iconClass: "text-badge-orange-text",
    textClass: "text-badge-orange-text",
    Icon: AlertTriangle,
  },
  danger: {
    border: "border-danger-200",
    bg: "bg-danger-100",
    iconClass: "text-danger-500",
    textClass: "text-danger-500",
    Icon: XCircle,
  },
};

type StatusBannerVariant = keyof typeof STATUS_BANNER_VARIANTS;

interface PortalStatusBannerProps {
  variant: StatusBannerVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}

export function PortalStatusBanner({
  variant,
  title,
  children,
  className,
  icon: CustomIcon,
}: PortalStatusBannerProps) {
  const cfg = STATUS_BANNER_VARIANTS[variant];
  const Icon = CustomIcon ?? cfg.Icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-4 py-3",
        cfg.border,
        cfg.bg,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", cfg.iconClass)} />
      <div>
        {title && (
          <p className={cn("text-sm font-medium", cfg.textClass)}>{title}</p>
        )}
        {children && <p className={cn("text-xs", cfg.textClass)}>{children}</p>}
      </div>
    </div>
  );
}
