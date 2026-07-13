"use client";

import { cn } from "@/lib/utils";

export type PeriodKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "all";

interface MiniPeriodFilterProps {
  value: PeriodKey;
  onChange: (key: PeriodKey) => void;
  className?: string;
}

const OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "thisWeek", label: "هذا الأسبوع" },
  { key: "thisMonth", label: "هذا الشهر" },
  { key: "thisYear", label: "هذه السنة" },
  { key: "all", label: "الكل" },
];

export function MiniPeriodFilter({ value, onChange, className }: MiniPeriodFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PeriodKey)}
      className={cn(
        "rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-1.5 text-sm font-medium text-natural-100 outline-none cursor-pointer",
        className,
      )}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function periodToDateRange(period: PeriodKey): { from?: string; to?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (period) {
    case "today":
      return { from: now.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { from: d.toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) };
    }
    case "thisWeek": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    }
    case "thisMonth":
      return { from: new Date(y, m, 1).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    case "thisYear":
      return { from: new Date(y, 0, 1).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    case "all":
      return {};
    default:
      return {};
  }
}
