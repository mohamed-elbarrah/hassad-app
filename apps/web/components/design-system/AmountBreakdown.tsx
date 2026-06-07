"use client";
import { cn } from "@/lib/utils";

export interface AmountItem {
  label: string;
  value: string | number;
  variant?: "default" | "positive" | "negative";
}

export interface AmountBreakdownProps {
  items: AmountItem[];
  className?: string;
}

const valueColors = {
  default: "text-natural-100",
  positive: "text-success-600",
  negative: "text-danger-600",
};

export function AmountBreakdown({ items, className }: AmountBreakdownProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-neutral-200 bg-natural-0 p-3 text-center">
          <p className="text-xs text-neutral-300 mb-1">{item.label}</p>
          <p className={cn("text-sm font-semibold", valueColors[item.variant ?? "default"])}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
