"use client";

import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { arSA } from "date-fns/locale";
import type { DateRange as CalendarDateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatShortDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DateRange = CalendarDateRange;

export function ContractsToolbar({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  totalCount: number;
  visibleCount: number;
}) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      dir="rtl"
    >
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9 pe-9"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث باسم العقد..."
        />
        {search ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
            onClick={() => onSearchChange("")}
            aria-label="مسح البحث"
            type="button"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="contract-date-range"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal sm:w-[300px]",
                !dateRange.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon />
              {dateRange.from ? (
                dateRange.to ? (
                  `${formatShortDateLong(dateRange.from.toISOString())} - ${formatShortDateLong(dateRange.to.toISOString())}`
                ) : (
                  formatShortDateLong(dateRange.from.toISOString())
                )
              ) : (
                <span>اختر الفترة</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            className="w-auto p-0"
            dir="rtl"
          >
            <Calendar
              initialFocus
              dir="rtl"
              locale={arSA}
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => onDateRangeChange(range ?? {})}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateRange.from || dateRange.to ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateRangeChange({})}
            aria-label="مسح فلتر التاريخ"
            type="button"
          >
            <X data-icon="inline-start" />
            مسح الفلتر
          </Button>
        ) : null}
      </div>
    </div>
  );
}
