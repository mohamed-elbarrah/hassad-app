"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CircularProgress } from "@/components/design-system/CircularProgress";
import { PeriodTimeline } from "./PeriodTimeline";
import { formatShortDateTz, formatDateTz, getDaysRemaining } from "@/lib/format";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  period: PortalPeriodSummary;
  totalPeriods: number;
  /** Full list of periods — needed to render the embedded timeline strip. */
  periods: PortalPeriodSummary[];
  selectedPeriodId: string;
  onSelectPeriod: (period: PortalPeriodSummary) => void;
  onDownloadReport: () => void;
  onViewInvoice: () => void;
}

/**
 * Hero card for the currently selected period.
 *
 * Layout:
 *   1. Top section — circular progress ring + period meta + download action.
 *      The action column is a fixed 180px slot so its presence/absence
 *      doesn't reflow the meta column when switching between periods that
 *      do and don't have a report (UX polish #6).
 *   2. Bottom section — period timeline strip embedded as a footer.
 *
 * The circular ring is the single source of truth for the *current period*
 * completion. The status badge above the title is the single source of
 * truth for the period's lifecycle state. They used to duplicate each other
 * (the ring had its own "الحالية/مكتمل" label) — the label was removed so
 * there's exactly one indicator per concept.
 */
export function HeroCard({
  period,
  totalPeriods,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onDownloadReport,
}: HeroCardProps) {
  const daysRemaining = getDaysRemaining(period.endDate);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadReport();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SurfaceCard className="overflow-hidden">
      {/* ── Top section: ring + meta + action ─────────────────────────── */}
      <div
        className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[140px_1fr_180px] md:items-center"
        dir="rtl"
      >
        <CircularProgress
          value={period.completionPercentage}
          size={120}
          strokeWidth={10}
          color="#10b981"
          trackColor="#e5e7eb"
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700">
              الفترة {period.periodNumber} من {totalPeriods}
            </span>
            <PeriodStatusBadge
              status={period.status}
              daysRemaining={daysRemaining}
            />
          </div>
          <h2 className="text-xl font-bold text-natural-100">
            الفترة {period.periodNumber}: {formatShortDateTz(period.startDate)} —{" "}
            {formatShortDateTz(period.endDate)}
          </h2>
          <p className="text-sm text-portal-note-text">
            {formatDateTz(period.startDate)} — {formatDateTz(period.endDate)}
          </p>
        </div>

        {/* Reserved action slot — fixed width prevents layout shift when
            `hasReport` toggles between periods. When no report exists the
            cell is intentionally empty but maintains the grid track. */}
        <div className="md:justify-self-end">
          {period.stats.hasReport && (
            <ActionButton
              size="sm"
              variant="outline"
              icon={<Download className="size-4" />}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? "جاري التحميل..." : "تحميل تقرير الفترة"}
            </ActionButton>
          )}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-6 border-t border-portal-divider" />

      {/* ── Bottom section: period timeline strip ─────────────────────── */}
      <div className="px-6 py-4">
        <PeriodTimeline
          periods={periods}
          selectedId={selectedPeriodId}
          onSelect={onSelectPeriod}
          compact
        />
      </div>
    </SurfaceCard>
  );
}

/**
 * Always-visible period status badge.
 *
 * Every period now carries an explicit status indicator — previously the
 * "متبقي X يوم" badge only showed for ACTIVE periods and nothing rendered
 * for CLOSED/UPCOMING/SUSPENDED, leaving the user to infer state from
 * context (UX polish #12).
 *
 * Each status uses its own color so the badge is scannable in peripheral
 * vision.
 */
function PeriodStatusBadge({
  status,
  daysRemaining,
}: {
  status: PortalPeriodSummary["status"];
  daysRemaining: number;
}) {
  const label =
    status === "ACTIVE"
      ? daysRemaining > 0
        ? `متبقي ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"}`
        : "ينتهي اليوم"
      : status === "CLOSED"
        ? "مكتملة"
        : status === "UPCOMING"
          ? "قادمة"
          : "موقوفة";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        status === "ACTIVE" && "bg-secondary-100 text-secondary-700",
        status === "CLOSED" && "bg-neutral-100 text-neutral-600",
        status === "UPCOMING" && "bg-blue-100 text-blue-700",
        status === "SUSPENDED" && "bg-alert-100 text-alert-700",
      )}
    >
      {label}
    </span>
  );
}
