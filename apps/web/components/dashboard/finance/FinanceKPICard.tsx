"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface FinanceKPICardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percent";
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function FinanceKPICard({
  title,
  value,
  format = "currency",
  icon: Icon,
  change,
  changeLabel,
  description,
  className,
  onClick,
}: FinanceKPICardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : formatNumber(value);

  const isPositive = change !== undefined ? change >= 0 : undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-portal-card-border bg-natural-0 shadow-sm",
        "p-5 transition-all hover:shadow-md hover:border-neutral-200",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Top: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="text-xs font-medium text-neutral-400">{title}</span>
      </div>

      {/* Middle: value + inline trend badge */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-[26px] font-bold text-natural-100 tracking-tight leading-none">
          {formattedValue}
        </span>

        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold",
              isPositive
                ? "bg-success-50 text-success-600"
                : "bg-danger-50 text-danger-600",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>

      {/* Bottom: description */}
      <p className="text-[11px] text-neutral-400 mt-1">
        {description || changeLabel || "\u00A0"}
      </p>
    </div>
  );
}
