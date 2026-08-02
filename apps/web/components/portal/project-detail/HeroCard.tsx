"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  formatDateTz,
  formatShortDateTz,
  getDaysRemaining,
} from "@/lib/format";
import { PeriodTimeline } from "./PeriodTimeline";

export function HeroCard({
  period,
  totalPeriods,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onDownloadReport,
}: {
  period: PortalPeriodSummary;
  totalPeriods: number;
  periods: PortalPeriodSummary[];
  selectedPeriodId: string;
  onSelectPeriod: (period: PortalPeriodSummary) => void;
  onDownloadReport: () => void;
  onViewInvoice: () => void;
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
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>
                الفترة {period.periodNumber} من {totalPeriods}
              </Badge>
              <Badge variant="secondary">{label}</Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                الفترة {period.periodNumber}:{" "}
                {formatShortDateTz(period.startDate)} -{" "}
                {formatShortDateTz(period.endDate)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTz(period.startDate)} -{" "}
                {formatDateTz(period.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={period.completionPercentage} />
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
        <Separator />
        <PeriodTimeline
          periods={periods}
          selectedId={selectedPeriodId}
          onSelect={onSelectPeriod}
          compact
        />
      </CardContent>
    </Card>
  );
}
