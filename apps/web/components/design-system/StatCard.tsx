"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/admin/overview/Sparkline";
import { Pill, type PillTone } from "@/components/design-system/Pill";

export interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  extra?: React.ReactNode;
  sparklineData?: number[];
  sparklineColor?: string;
  href?: string;
  onClick?: () => void;
  pill?: { text: string; tone: PillTone };
  className?: string;
}

const variantClasses = {
  default: "bg-natural-0 border-portal-card-border",
  success: "bg-success-100/30 border-success-200",
  warning: "bg-alert-100/30 border-alert-200",
  danger: "bg-danger-100/30 border-danger-200",
};

const trendColors = {
  up: "text-success-600",
  down: "text-danger-600",
  neutral: "text-neutral-300",
};

function StatCardInner({
  title,
  value,
  icon: Icon,
  variant,
  trend,
  trendValue,
  description,
  extra,
  sparklineData,
  sparklineColor,
  pill: pillProp,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] p-5 transition-shadow hover:shadow-sm",
        variantClasses[variant ?? "default"],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-neutral-300">{title}</p>
          <p className="text-2xl font-semibold text-natural-100">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trendColors[trend])}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </p>
          )}
          {description && !trend && (
            <p className="text-xs text-portal-note-text">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {sparklineData && (
            <Sparkline
              data={sparklineData}
              color={sparklineColor}
            />
          )}
          <div className="flex items-center gap-2">
            {pillProp && (
              <Pill tone={pillProp.tone}>{pillProp.text}</Pill>
            )}
            {Icon && <Icon className="h-5 w-5 text-secondary-500" />}
            {extra}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatCard(props: StatCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block" onClick={props.onClick}>
        <StatCardInner {...props} />
      </Link>
    );
  }

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className="block w-full text-right">
        <StatCardInner {...props} />
      </button>
    );
  }

  return <StatCardInner {...props} />;
}
