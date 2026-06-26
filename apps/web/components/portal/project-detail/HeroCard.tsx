"use client";

import { useState } from "react";
import { ChevronLeft, Download } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { CircularProgress } from "@/components/design-system/CircularProgress";
import { formatShortDate, formatDate, getDaysRemaining } from "./helpers";

interface HeroCardProps {
  period: PortalPeriodSummary;
  totalPeriods: number;
  onDownloadReport: () => void;
  onViewInvoice: () => void;
}

/** Hero card for the currently selected period: progress ring + dates + report/invoice actions. */
export function HeroCard({
  period,
  totalPeriods,
  onDownloadReport,
  onViewInvoice,
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
      <div
        className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[140px_1fr_1fr]"
        dir="rtl"
      >
        <CircularProgress
          value={period.completionPercentage}
          size={120}
          strokeWidth={10}
          color="#10b981"
          trackColor="#e5e7eb"
          label={period.status === "ACTIVE" ? "الحالية" : "مكتمل"}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700">
              الفترة {period.periodNumber} من {totalPeriods}
            </span>
            {period.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-medium text-secondary-700">
                متبقي {daysRemaining} يوم
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-natural-100">
            الفترة {period.periodNumber}: {formatShortDate(period.startDate)} —{" "}
            {formatShortDate(period.endDate)}
          </h2>
          <p className="text-sm text-portal-note-text">
            {formatDate(period.startDate)} — {formatDate(period.endDate)}
          </p>
          <div className="pt-1">
            <ProgressBar
              value={period.completionPercentage}
              variant={
                period.completionPercentage >= 80 ? "success" : "default"
              }
              size="sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
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
    </SurfaceCard>
  );
}
