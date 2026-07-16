"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Pill, type PillTone } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { Sparkline } from "@/components/dashboard/admin/overview/Sparkline";

interface MetricCardProps {
  title: string;
  value?: string | number | ReactNode;
  amount?: number;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "lg" | "sm";
  icon?: LucideIcon | ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  pillText?: string;
  pillTone?: PillTone;
  href?: string;
  onClick?: () => void;
  sparklineData?: number[];
  sparklineColor?: string;
  className?: string;
}

const variantOuter = {
  default: "border-portal-card-border",
  success: "border-success-200",
  warning: "border-alert-200",
  danger: "border-danger-200",
};

const variantInner = {
  default: "bg-natural-0",
  success: "bg-success-100/30",
  warning: "bg-alert-100/30",
  danger: "bg-danger-100/30",
};

const trendColors = {
  up: "text-success-600",
  down: "text-danger-600",
  neutral: "text-neutral-300",
};

function MetricCardInner({
  title,
  value,
  amount,
  variant = "default",
  size = "lg",
  icon,
  trend,
  trendValue,
  description,
  pillText,
  pillTone,
  sparklineData,
  sparklineColor,
  className,
}: MetricCardProps) {
  const { fmtAmount, currency } = useCurrency();

  const hasCurrency = amount !== undefined;
  const displayValue = hasCurrency
    ? fmtAmount(amount)
    : value;

  const large = size === "lg";

  return (
    <div
      className={cn(
        "border-[1.5px] transition-shadow hover:shadow-sm",
        large
          ? "rounded-[30px] px-6 py-7"
          : "rounded-2xl px-4 py-3",
        variantOuter[variant ?? "default"],
        variantInner[variant ?? "default"],
        className,
      )}
    >
      {/* Header: title + icon + pill (lg: row, sm: row) */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-portal-icon",
            large ? "text-base font-medium leading-8" : "text-xs leading-5",
          )}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline data={sparklineData} color={sparklineColor} />
          )}
          {icon && (
            <div className="shrink-0">
              {typeof icon === "function" || (typeof icon === "object" && "render" in icon)
                ? <IconDisplay icon={icon as LucideIcon} />
                : icon}
            </div>
          )}
          {pillText && <Pill tone={pillTone ?? "neutral"}>{pillText}</Pill>}
        </div>
      </div>

      {/* Value row */}
      {displayValue !== undefined && (
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-1">
            {hasCurrency ? (
              <>
                <span
                  className={cn(
                    "font-bold text-natural-100",
                    large
                      ? "text-[48px] font-semibold leading-none lg:text-[54px]"
                      : "text-lg font-semibold leading-7 text-secondary-500",
                  )}
                >
                  {String(displayValue)}
                </span>
                <SymbolRenderer
                  currency={currency}
                  className={cn(
                    "font-medium text-portal-icon",
                    large ? "text-sm" : "text-xs",
                  )}
                />
              </>
            ) : (
              <span
                className={cn(
                  "text-natural-100",
                  large
                    ? "text-[48px] font-semibold leading-none lg:text-[54px]"
                    : "text-lg font-semibold leading-7 text-secondary-500",
                )}
              >
                {String(displayValue)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Trend */}
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trendColors[trend])}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </p>
      )}

      {/* Description */}
      {description && !trend && (
        <p className="mt-1 text-xs text-portal-note-text">{description}</p>
      )}
    </div>
  );
}

function IconDisplay({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="h-5 w-5 text-secondary-500" />;
}

export function MetricCard(props: MetricCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block" onClick={props.onClick}>
        <MetricCardInner {...props} />
      </Link>
    );
  }

  if (props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="block w-full text-right"
      >
        <MetricCardInner {...props} />
      </button>
    );
  }

  return <MetricCardInner {...props} />;
}

// ── KpiCurrency — kept for custom layouts that need raw currency formatting ──

export interface KpiCurrencyProps {
  amount: number;
  className?: string;
}

export function KpiCurrency({ amount, className }: KpiCurrencyProps) {
  const { fmtAmount, currency } = useCurrency();
  return (
    <div className={cn("flex items-baseline justify-start gap-1", className)}>
      <span className="text-[28px] font-bold text-natural-100">
        {fmtAmount(amount)}
      </span>
      <SymbolRenderer
        currency={currency}
        className="text-sm font-medium text-portal-icon"
      />
    </div>
  );
}
