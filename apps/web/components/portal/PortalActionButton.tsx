"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalActionButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export function PortalActionButton({
  href,
  onClick,
  children,
  icon,
  variant = "outline",
  className,
}: PortalActionButtonProps) {
  const variants = {
    primary:
      "h-9 rounded-xl bg-secondary-500 px-3 text-xs font-medium text-white hover:bg-secondary-600",
    secondary:
      "h-9 rounded-xl bg-secondary-100 px-3 text-xs font-medium text-secondary-500 hover:bg-secondary-200",
    outline:
      "h-9 rounded-xl border border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
  };

  if (href) {
    return (
      <Link href={href} className="inline-block">
        <Button
          type="button"
          variant="ghost"
          className={cn(variants[variant], "gap-1", className)}
        >
          {icon ?? <ExternalLink className="h-3.5 w-3.5" />}
          {children}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(variants[variant], "gap-1", className)}
    >
      {icon ?? <ExternalLink className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );
}
