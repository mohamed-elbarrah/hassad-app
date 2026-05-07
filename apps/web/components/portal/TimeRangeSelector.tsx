"use client";

import { Button } from "@/components/ui/button";

export type TimeRange = "last30" | "thisMonth" | "last3Months";

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "last30", label: "آخر 30 يوم" },
  { key: "thisMonth", label: "هذا الشهر" },
  { key: "last3Months", label: "آخر 3 أشهر" },
];

export function getTimeRangeDates(range: TimeRange): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  let dateFrom: string;

  switch (range) {
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFrom = start.toISOString().slice(0, 10);
      break;
    }
    case "last3Months": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      dateFrom = start.toISOString().slice(0, 10);
      break;
    }
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      dateFrom = start.toISOString().slice(0, 10);
      break;
    }
  }

  return { dateFrom, dateTo };
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1" dir="rtl">
      {RANGES.map((r) => (
        <Button
          key={r.key}
          variant={value === r.key ? "default" : "outline"}
          size="sm"
          className="text-xs h-7 px-3"
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}