"use client";

import { Select, SelectItem } from "./Select";


export type TimeRange = "last7days" | "last30days" | "last12months";

export type TimelineGranularity = "day" | "week" | "month";

interface RangeConfig {
  key: TimeRange;
  label: string;
  granularity: TimelineGranularity;
}

const RANGES: RangeConfig[] = [
  { key: "last7days", label: "آخر 7 أيام", granularity: "day" },
  { key: "last30days", label: "آخر 30 يوم", granularity: "day" },
  { key: "last12months", label: "آخر 12 شهر", granularity: "month" },
];

export function getTimeRangeParams(range: TimeRange): {
  dateFrom: string;
  dateTo: string;
  granularity: TimelineGranularity;
} {
  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  let dateFrom: string;

  switch (range) {
    case "last7days": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFrom = d.toISOString().slice(0, 10);
      break;
    }
    case "last30days": {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      dateFrom = d.toISOString().slice(0, 10);
      break;
    }
    case "last12months": {
      const d = new Date();
      d.setMonth(d.getMonth() - 12);
      dateFrom = d.toISOString().slice(0, 10);
      break;
    }
  }

  const config = RANGES.find((r) => r.key === range) || RANGES[0];
  return { dateFrom, dateTo, granularity: config.granularity };
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {


  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TimeRange)}
      triggerClassName="w-[150px] h-10 rounded-xl border border-portal-card-border bg-natural-0 text-sm text-natural-100 font-medium"
    >
      {RANGES.map((r) => (
        <SelectItem key={r.key} value={r.key}>
          {r.label}
        </SelectItem>
      ))}
    </Select>
  );
}
