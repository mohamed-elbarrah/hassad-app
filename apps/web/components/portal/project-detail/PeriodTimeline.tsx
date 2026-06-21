"use client";

import { CheckCircle2, Lock } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { cn } from "@/lib/utils";
import { formatShortDate } from "./helpers";

interface PeriodTimelineProps {
  periods: PortalPeriodSummary[];
  selectedId: string;
  onSelect: (period: PortalPeriodSummary) => void;
}

/** Horizontal clickable timeline of all project periods. */
export function PeriodTimeline({
  periods,
  selectedId,
  onSelect,
}: PeriodTimelineProps) {
  return (
    <div
      className="rounded-[30px] border border-portal-card-border bg-natural-0 p-6"
      dir="rtl"
    >
      <div className="relative flex items-start justify-between overflow-x-auto px-2 scrollbar-hide">
        <div className="absolute right-10 left-10 top-[22px] h-0.5 bg-portal-divider" />

        {periods.map((period) => {
          const isSelected = period.id === selectedId;
          const isClosed = period.status === "CLOSED";
          const isUpcoming = period.status === "UPCOMING";
          const isActive = period.status === "ACTIVE";
          const highlight = isSelected || isActive;

          return (
            <button
              key={period.id}
              onClick={() => onSelect(period)}
              className="group relative z-10 flex min-w-[100px] flex-col items-center gap-2 pb-2 focus:outline-none"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-base font-bold transition-all duration-300",
                  highlight
                    ? "scale-110 rounded-full bg-success-500 text-white shadow-xl shadow-success-500/30 ring-4 ring-success-100"
                    : isClosed
                      ? "border-2 border-success-400 bg-natural-0 text-success-500 hover:border-success-500"
                      : "border-2 border-neutral-200 bg-natural-0 text-neutral-400",
                )}
              >
                {isClosed ? (
                  <CheckCircle2 className="size-5" />
                ) : isUpcoming ? (
                  <Lock className="size-4" />
                ) : (
                  period.periodNumber
                )}
              </div>

              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    highlight || isClosed
                      ? "text-success-600"
                      : "text-neutral-400",
                  )}
                >
                  {isClosed ? "مكتمل" : isActive || isSelected ? "الحالية" : "قادم"}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[10px] text-portal-note-text">
                  {formatShortDate(period.startDate)}-
                  {formatShortDate(period.endDate)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}