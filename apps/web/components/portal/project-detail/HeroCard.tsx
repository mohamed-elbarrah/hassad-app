"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getDaysRemaining } from "@/lib/format";
import { PeriodTimeline } from "./PeriodTimeline";

export function HeroCard({
  period,
  periods,
  onSelectPeriod,
  onDownloadReport,
}: {
  period: PortalPeriodSummary;
  periods: PortalPeriodSummary[];
  onSelectPeriod: (period: PortalPeriodSummary) => void;
  onDownloadReport: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const days = getDaysRemaining(period.endDate);
  const download = async () => {
    setDownloading(true);
    try {
      await onDownloadReport();
    } finally {
      setDownloading(false);
    }
  };
  const label =
    period.status === "ACTIVE"
      ? days > 0
        ? `متبقي ${days} يوم`
        : "ينتهي اليوم"
      : period.status === "CLOSED"
        ? "مكتملة"
        : period.status === "UPCOMING"
          ? "قادمة"
          : "موقوفة";
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 pt-6">
        <PeriodTimeline
          periods={periods}
          selectedId={period.id}
          onSelect={onSelectPeriod}
        />
        <Separator />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{label}</Badge>
            </div>
            <h2 className="text-xl font-semibold">
              الفترة {period.periodNumber}
            </h2>
            <div className="flex items-center gap-3">
              <Progress
                value={period.completionPercentage}
                aria-label="نسبة إنجاز الفترة"
              />
              <span className="font-medium">
                {period.completionPercentage}%
              </span>
            </div>
          </div>
          {period.stats.hasReport ? (
            <Button variant="outline" onClick={download} disabled={downloading}>
              <Download />
              {downloading ? "جاري التحميل..." : "تحميل تقرير الفترة"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
