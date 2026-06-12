"use client";

import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type RangeValue = "today" | "week" | "month" | "quarter" | "year" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

const RANGE_OPTIONS: { value: RangeValue; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "quarter", label: "هذا الربع" },
  { value: "year", label: "هذه السنة" },
];

function getRangeDates(value: RangeValue): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (value) {
    case "today":
      break;
    case "week":
      from.setDate(to.getDate() - to.getDay());
      break;
    case "month":
      from.setDate(1);
      break;
    case "quarter":
      from.setMonth(Math.floor(to.getMonth() / 3) * 3, 1);
      break;
    case "year":
      from.setMonth(0, 1);
      break;
    default:
      from.setMonth(to.getMonth() - 1, 1);
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

interface Props {
  value: RangeValue;
  onChange: (value: RangeValue, dates: DateRange) => void;
  className?: string;
}

export function FinanceDateRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (v: RangeValue) => {
    const dates = getRangeDates(v);
    onChange(v, dates);
    setOpen(false);
  };

  const activeLabel = RANGE_OPTIONS.find((o) => o.value === value)?.label || "هذا الشهر";

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
          "border-portal-card-border bg-natural-0 hover:border-secondary-500/40",
          open && "border-secondary-500 ring-2 ring-secondary-500/10",
        )}
      >
        <Calendar className="w-4 h-4 text-neutral-300" />
        <span>{activeLabel}</span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-neutral-300 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 w-48 rounded-xl border border-portal-card-border bg-natural-0 shadow-lg overflow-hidden">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50",
                  value === opt.value && "bg-secondary-50 text-secondary-600 font-semibold",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
