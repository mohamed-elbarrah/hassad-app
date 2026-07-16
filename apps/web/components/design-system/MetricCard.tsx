"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Pill, type PillTone } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";

interface MetricCardProps {
  title: string;
  value?: string | number | ReactNode;
  amount?: number;
  variant?: "default" | "success" | "warning" | "danger";
  icon?: LucideIcon | ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  pillText?: string;
  pillTone?: PillTone;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  default: "bg-natural-0 border-portal-card-border",
  success: "bg-success-100/30 border-success-200",
  warning: "bg-alert-100/30 border-alert-200",
  danger: "bg-danger-100/30 border-danger-200",
};

const trendPills: Record<string, { tone: PillTone; arrow: string }> = {
  up: { tone: "success", arrow: "↑" },
  down: { tone: "danger", arrow: "↓" },
  neutral: { tone: "neutral", arrow: "→" },
};

function MetricCardInner({
  title,
  value,
  amount,
  variant = "default",
  icon,
  trend,
  trendValue,
  pillText,
  pillTone,
  className,
}: MetricCardProps) {
  const { fmtAmount, currency } = useCurrency();

  const hasCurrency = amount !== undefined;
  const displayValue = hasCurrency ? fmtAmount(amount) : value;
  const trendPill = trend ? trendPills[trend] : null;

  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] px-6 py-7 transition-shadow hover:shadow-sm",
        variantStyles[variant ?? "default"],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-medium leading-8 text-portal-icon">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {icon && (
            <div className="shrink-0">
              {typeof icon === "function" || (typeof icon === "object" && "render" in icon)
                ? <IconDisplay icon={icon as LucideIcon} />
                : icon}
            </div>
          )}
          {trendPill && (
            <Pill tone={trendPill.tone}>
              {trendPill.arrow} {trendValue}
            </Pill>
          )}
          {pillText && <Pill tone={pillTone ?? "neutral"}>{pillText}</Pill>}
        </div>
      </div>

      {displayValue !== undefined && (
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-1">
            {hasCurrency ? (
              <>
                <span className="text-[48px] font-semibold leading-none text-natural-100 lg:text-[54px]">
                  {String(displayValue)}
                </span>
                <SymbolRenderer
                  currency={currency}
                  className="text-sm font-medium text-portal-icon"
                />
              </>
            ) : (
              <span className="text-[48px] font-semibold leading-none text-natural-100 lg:text-[54px]">
                {String(displayValue)}
              </span>
            )}
          </div>
        </div>
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
