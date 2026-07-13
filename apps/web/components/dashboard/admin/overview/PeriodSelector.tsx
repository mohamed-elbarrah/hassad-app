"use client";

import { TimeRangeSelector } from "@/components/design-system/TimeRangeSelector";
import type { TimeRange } from "@/components/design-system/TimeRangeSelector";
import { cn } from "@/lib/utils";

export type PeriodKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "custom";

interface PeriodOption {
  key: PeriodKey;
  label: string;
}

const PERIODS: PeriodOption[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "thisWeek", label: "هذا الأسبوع" },
  { key: "lastWeek", label: "الأسبوع الماضي" },
  { key: "thisMonth", label: "هذا الشهر" },
  { key: "lastMonth", label: "الشهر الماضي" },
];

const TIME_RANGE_MAP: Record<PeriodKey, TimeRange | undefined> = {
  today: undefined,
  yesterday: undefined,
  thisWeek: undefined,
  lastWeek: undefined,
  thisMonth: undefined,
  lastMonth: undefined,
  custom: undefined,
};

interface PeriodSelectorProps {
  value: PeriodKey;
  onChange: (key: PeriodKey) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-1">
        {PERIODS.map((period) => (
          <button
            key={period.key}
            type="button"
            onClick={() => onChange(period.key)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              value === period.key
                ? "bg-natural-100 text-white"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
