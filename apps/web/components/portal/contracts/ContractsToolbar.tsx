"use client";

import { Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatShortDateLong } from "@/lib/format";

export interface DateRange {
  from?: Date;
  to?: Date;
}

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
  const label =
    dateRange.from || dateRange.to
      ? `${formatShortDateLong(dateRange.from?.toISOString() ?? null)} - ${formatShortDateLong(dateRange.to?.toISOString() ?? null)}`
      : "اختر التاريخ";
  const toDate = (date?: Date) => (date ? date.toISOString().slice(0, 10) : "");
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
          >
            <X />
          </Button>
        ) : null}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Calendar />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex flex-col gap-3" dir="rtl">
          <div className="flex items-center justify-between">
            <p className="font-medium">تحديد الفترة</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange({})}
            >
              مسح
            </Button>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onDateRangeChange({
                  from: new Date(new Date().setDate(new Date().getDate() - 7)),
                  to: new Date(),
                })
              }
            >
              آخر 7 أيام
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onDateRangeChange({ from: new Date(), to: new Date() })
              }
            >
              اليوم
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contract-date-from">من</Label>
              <Input
                id="contract-date-from"
                type="date"
                value={toDate(dateRange.from)}
                onChange={(event) =>
                  onDateRangeChange({
                    ...dateRange,
                    from: event.target.value
                      ? new Date(event.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contract-date-to">إلى</Label>
              <Input
                id="contract-date-to"
                type="date"
                value={toDate(dateRange.to)}
                onChange={(event) =>
                  onDateRangeChange({
                    ...dateRange,
                    to: event.target.value
                      ? new Date(event.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
