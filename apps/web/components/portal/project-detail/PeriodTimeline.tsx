"use client";

import { CheckCircle2, Lock } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatShortDateTz } from "@/lib/format";

export function PeriodTimeline({
  periods,
  selectedId,
  onSelect,
}: {
  periods: PortalPeriodSummary[];
  selectedId: string;
  onSelect: (period: PortalPeriodSummary) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2" dir="rtl">
      {periods.map((period) => {
        const selected = period.id === selectedId;
        const closed = period.status === "CLOSED";
        const upcoming = period.status === "UPCOMING";
        return (
          <Button
            key={period.id}
            variant={selected ? "default" : "outline"}
            className="h-auto min-w-28 flex-col gap-2 py-3"
            onClick={() => onSelect(period)}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-background text-foreground">
              {closed ? (
                <CheckCircle2 />
              ) : upcoming ? (
                <Lock />
              ) : (
                period.periodNumber
              )}
            </span>
            <Badge variant={selected ? "secondary" : "outline"}>
              {closed ? "مكتمل" : upcoming ? "قادم" : "الحالية"}
            </Badge>
            <span className="text-xs">
              {formatShortDateTz(period.startDate)} -{" "}
              {formatShortDateTz(period.endDate)}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
