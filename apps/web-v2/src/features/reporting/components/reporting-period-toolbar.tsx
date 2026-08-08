"use client";

import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useReportingPeriod } from "@/features/reporting/reporting-period-context";

export function ReportingPeriodToolbar() {
  const { preset, range, rangeLabel, setPreset, setRange } = useReportingPeriod();

  function handlePresetChange(value: string[]) {
    const nextPreset = value[0];

    if (nextPreset === "30d" || nextPreset === "6m" || nextPreset === "12m") {
      setPreset(nextPreset);
    }
  }

  function handleRangeSelect(nextRange: DateRange | undefined) {
    if (!nextRange?.from || !nextRange?.to) {
      return;
    }

    setRange({
      from: nextRange.from,
      to: nextRange.to,
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant="outline">{rangeLabel}</Badge>
      <ToggleGroup
        multiple={false}
        value={[preset]}
        onValueChange={handlePresetChange}
        size="sm"
        variant="outline"
        spacing={0}
      >
        <ToggleGroupItem value="30d">30D</ToggleGroupItem>
        <ToggleGroupItem value="6m">6M</ToggleGroupItem>
        <ToggleGroupItem value="12m">12M</ToggleGroupItem>
      </ToggleGroup>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={preset === "range" ? "default" : "outline"}
              size="sm"
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          Range
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <PopoverHeader className="px-3 pt-3">
            <PopoverTitle>Date range</PopoverTitle>
            <PopoverDescription>
              Select the reporting window for every overview card.
            </PopoverDescription>
          </PopoverHeader>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={{
              from: range.from,
              to: range.to,
            }}
            onSelect={handleRangeSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
