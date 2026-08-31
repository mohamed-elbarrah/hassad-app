"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatShortDateLong } from "@/lib/format";

export type AdminOverviewFilters = {
  from: string;
  to: string;
  granularity: "day" | "month";
  preset?: "30d" | "6m" | "12m";
};

type RangePreset = "30d" | "6m" | "12m" | "custom";

const PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: "30d", label: "آخر 30 يوماً" },
  { value: "6m", label: "آخر 6 أشهر" },
  { value: "12m", label: "آخر 12 شهراً" },
  { value: "custom", label: "نطاق مخصص" },
];

function toQueryDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function today() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDefaultAdminOverviewFilters(): AdminOverviewFilters {
  const range = presetRange("30d");
  return {
    from: toQueryDate(range.from!),
    to: toQueryDate(range.to!),
    granularity: "day",
    preset: "30d",
  };
}

function presetRange(preset: Exclude<RangePreset, "custom">): DateRange {
  const end = today();
  return {
    from: preset === "30d" ? subDays(end, 29) : subMonths(end, preset === "6m" ? 6 : 12),
    to: end,
  };
}

export function AdminOverviewFilters({ onChange }: { onChange: (filters: AdminOverviewFilters) => void }) {
  const initialRange = useMemo(() => presetRange("30d"), []);
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [range, setRange] = useState<DateRange>(initialRange);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const applyRange = (nextRange: DateRange, nextPreset: RangePreset) => {
    if (!nextRange.from || !nextRange.to) return;
    setRange(nextRange);
    setPreset(nextPreset);
    onChange({
      from: toQueryDate(nextRange.from),
      to: toQueryDate(nextRange.to),
      granularity: nextPreset === "30d" || nextPreset === "custom" ? "day" : "month",
      ...(nextPreset === "custom" ? {} : { preset: nextPreset }),
    });
  };

  const handlePresetChange = (value: string) => {
    const nextPreset = value as RangePreset;
    if (nextPreset === "custom") {
      setPreset(nextPreset);
      setCalendarOpen(true);
      return;
    }
    applyRange(presetRange(nextPreset), nextPreset);
  };

  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="مرشح الفترة الزمنية">
      <span className="text-sm font-medium text-muted-foreground">الفترة</span>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="min-h-11 w-44" aria-label="اختيار الفترة الزمنية">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PRESETS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-h-11 justify-start gap-2" aria-label="اختيار نطاق مخصص">
              <CalendarDays data-icon="inline-start" />
              {range.from && range.to ? `${formatShortDateLong(range.from)} - ${formatShortDateLong(range.to)}` : "اختر النطاق"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(nextRange) => {
                if (!nextRange) return;
                setRange(nextRange);
                if (nextRange.from && nextRange.to) {
                  applyRange(nextRange, "custom");
                  setCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
