"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import type { PortalPeriodSummary } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "./EmptyState";

export function ReportsTab({
  period,
  onDownloadReport,
}: {
  period: PortalPeriodSummary;
  onDownloadReport: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      await onDownloadReport();
    } finally {
      setDownloading(false);
    }
  };
  if (!period.stats.hasReport && !period.summary)
    return (
      <EmptyState
        icon={FileText}
        title="لا توجد تقارير لهذه الفترة"
        description="سيقوم مدير المشروع برفع تقرير الفترة عند إغلاقها."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText />
          تقرير الفترة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {period.stats.hasReport ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  تقرير الفترة {period.periodNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  تم رفعه من قبل مدير المشروع
                </p>
              </div>
              <Button
                variant="outline"
                onClick={download}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                {downloading ? "جاري التحميل..." : "تحميل"}
              </Button>
            </div>
            {period.summary ? <Separator /> : null}
          </>
        ) : null}
        {period.summary ? (
          <div>
            <p className="font-medium">ملخص الفترة</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {period.summary}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
