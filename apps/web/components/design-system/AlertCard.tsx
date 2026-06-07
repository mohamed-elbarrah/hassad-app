"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AlertCardProps {
  variant?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  info:    "bg-action-blue-soft border-action-blue text-action-blue",
  warning: "bg-alert-100/50 border-alert-200 text-alert-600",
  danger:  "bg-danger-100/50 border-danger-200 text-danger-600",
  success: "bg-success-100/50 border-success-200 text-success-600",
};

export function AlertCard({ variant = "info", title, children, className }: AlertCardProps) {
  return (
    <div className={cn("rounded-xl border p-4", variantClasses[variant], className)}>
      {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
