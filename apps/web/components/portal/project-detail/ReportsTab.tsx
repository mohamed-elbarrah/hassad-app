"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { EmptyState } from "./EmptyState";

interface ReportsTabProps {
  period: PortalPeriodSummary;
  onDownloadReport: () => void;
}

/** Reports tab — the PM-uploaded end-of-period report + the period summary. */
export function ReportsTab({ period, onDownloadReport }: ReportsTabProps) {
  const [downloading, setDownloading] = useState(false);
  const hasReport = period.stats.hasReport;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadReport();
    } finally {
      setDownloading(false);
    }
  };

  if (!hasReport && !period.summary) {
    return (
      <EmptyState
        icon={FileText}
        title="لا توجد تقارير لهذه الفترة"
        description="سيقوم مدير المشروع برفع تقرير الفترة عند إغلاقها."
      />
    );
  }

  return (
    <SurfaceCard title="تقرير الفترة" icon={FileText}>
      <div className="space-y-4" dir="rtl">
        {hasReport && (
          <div className="flex items-center justify-between rounded-2xl border border-portal-card-border bg-natural-0 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-badge-gray-bg">
                <FileText className="size-5 text-portal-icon" />
              </div>
              <div>
                <p className="text-sm font-medium text-natural-100">
                  تقرير الفترة {period.periodNumber}
                </p>
                <p className="text-xs text-portal-note-text">
                  تم رفعه من قبل مدير المشروع
                </p>
              </div>
            </div>
            <ActionButton
              variant="outline"
              size="sm"
              icon={
                downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )
              }
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? "جاري التحميل..." : "تحميل"}
            </ActionButton>
          </div>
        )}

        {period.summary && (
          <div className="rounded-2xl border border-portal-card-border bg-natural-0 p-4">
            <p className="mb-2 text-sm font-semibold text-natural-100">
              ملخص الفترة
            </p>
            <p className="whitespace-pre-line text-sm leading-6 text-portal-note-text">
              {period.summary}
            </p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}