"use client";

import { useId } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShortDateTz } from "@/lib/format";

export function PeriodTimeline({
  periods,
  selectedId,
  onSelect,
}: {
  periods: PortalPeriodSummary[];
  selectedId: string;
  onSelect: (period: PortalPeriodSummary) => void;
}) {
  const periodsTitleId = useId();
  const selectedIndex = periods.findIndex((period) => period.id === selectedId);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selected = periods[safeIndex];
  const previous = safeIndex > 0 ? periods[safeIndex - 1] : undefined;
  const next =
    safeIndex < periods.length - 1 ? periods[safeIndex + 1] : undefined;

  return (
    <section
      className="flex flex-col gap-3"
      dir="rtl"
      aria-labelledby={periodsTitleId}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id={periodsTitleId} className="text-base font-semibold">
            الفترات
          </h2>
          <Badge variant="outline">
            {selected
              ? `الفترة ${selected.periodNumber} من ${periods.length}`
              : "—"}
          </Badge>
        </div>

        {selected ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!next}
              onClick={() => next && onSelect(next)}
              aria-label="الفترة التالية"
              type="button"
            >
              <ChevronLeft data-icon="inline-end" />
              التالية
            </Button>
            <span
              className="min-w-36 text-center text-sm font-medium"
              aria-live="polite"
            >
              {formatShortDateTz(selected.startDate)} -{" "}
              {formatShortDateTz(selected.endDate)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!previous}
              onClick={() => previous && onSelect(previous)}
              aria-label="الفترة السابقة"
              type="button"
            >
              السابقة
              <ChevronRight data-icon="inline-start" />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        className="overflow-x-auto pb-2"
        role="region"
        aria-label="قائمة الفترات"
        tabIndex={0}
      >
        <ol className="flex min-w-max items-start justify-centerhere px-2 py-1">
          {periods.map((period, index) => {
            const isSelected = period.id === selectedId;
            const isClosed = period.status === "CLOSED";
            const isUpcoming = period.status === "UPCOMING";

            return (
              <li key={period.id} className="flex items-center">
                <Button
                  variant="ghost"
                  className="flex h-auto min-w-24 flex-col gap-1 px-2 py-0 text-center hover:bg-transparent"
                  onClick={() => onSelect(period)}
                  aria-current={isSelected ? "step" : undefined}
                  type="button"
                >
                  <span
                    className={
                      isSelected
                        ? "flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : "flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                    }
                  >
                    {isClosed ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      period.periodNumber
                    )}
                  </span>
                  <span
                    className={
                      isSelected
                        ? "text-sm font-semibold"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    الفترة {period.periodNumber}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {isClosed
                      ? "مكتملة"
                      : isUpcoming
                        ? "قادمة"
                        : period.status === "SUSPENDED"
                          ? "موقوفة"
                          : "الحالية"}
                  </span>
                </Button>
                {index < periods.length - 1 ? (
                  <span
                    className="mt-4 h-px w-8 shrink-0 bg-border"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
