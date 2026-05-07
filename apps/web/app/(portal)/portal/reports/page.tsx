"use client";

import { useState, useMemo } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetPortalReportsQuery,
  useGetReportTimelineQuery,
  type ReportSummary,
} from "@/features/portal/portalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Lightbulb, BarChart2, PieChart } from "lucide-react";
import { MonthlyComparisonBarChart } from "@/components/portal/MonthlyComparisonBarChart";
import { PerformanceTrendLineChart } from "@/components/portal/PerformanceTrendLineChart";
import { SpendDistributionDonutChart } from "@/components/portal/SpendDistributionDonutChart";
import { SmartTips } from "@/components/portal/SmartTips";
import { TopCampaignsTable } from "@/components/portal/TopCampaignsTable";
import { TimeRangeSelector, getTimeRangeParams, type TimeRange } from "@/components/portal/TimeRangeSelector";

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function fmtPercent(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function fmtSpend(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function KpiCardShell() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <Skeleton className="h-3 w-24 mx-auto mb-2" />
      <div className="flex items-center justify-center gap-2 mb-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

interface KpiCardProps {
  card: ReportSummary["kpiCards"][number];
}

function KpiCard({ card }: KpiCardProps) {
  const isPositive = (card.trendPercent ?? 0) >= 0;
  const isNegative = (card.trendPercent ?? 0) < 0;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 text-center" >
      <p className="text-xs text-muted-foreground mb-2">{card.label}</p>
      <div className="flex items-center justify-center gap-2">
        <span
          className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isNegative
              ? "#FEF2F2"
              : isPositive
                ? "#F0FDF4"
                : "#F9FAFB",
            color: isNegative
              ? "#EF4444"
              : isPositive
                ? "#22C55E"
                : "#6B7280",
          }}
        >
          {isPositive && "+"}{card.trendPercent?.toFixed(1)}%
        </span>
        <span className="text-xl md:text-2xl font-bold" style={{ color: "#121936" }}>
          {card.metric === "spend"
            ? `﷼${fmtSpend(card.value)}`
            : card.metric === "conversionRate" || card.metric === "ctr"
              ? `${card.value.toFixed(1)}%`
              : fmtCompact(card.value)}
        </span>
      </div>
    </div>
  );
}

export default function PortalReportsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const [timeRange, setTimeRange] = useState<TimeRange>("last7days");

  const rangeParams = useMemo(() => getTimeRangeParams(timeRange), [timeRange]);

  const { data: report, isLoading, isError, refetch } = useGetPortalReportsQuery(
    undefined,
    { skip: !clientId },
  );

  const { data: timeline } = useGetReportTimelineQuery(
    { dateFrom: rangeParams.dateFrom, dateTo: rangeParams.dateTo, granularity: rangeParams.granularity },
    { skip: !clientId },
  );

  return (
    <div className="flex flex-col gap-5" >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#121936" }}>التقارير</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            نظرة شاملة على أداء جميع حملاتك الإعلانية.
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">لم يتم ربط حسابك بملف عميل.</p>
      )}

      {clientId && isError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center flex flex-col items-center gap-4">
              <p className="text-muted-foreground text-sm">
                تعذر تحميل التقارير. يرجى المحاولة مرة أخرى.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {clientId && !isError && (
        <>
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <KpiCardShell key={i} />
              ))}
            </div>
          )}

          {!isLoading && report && report.kpiCards.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-muted-foreground">لا توجد حملات في الفترة المحددة.</p>
            </div>
          )}

          {!isLoading && report && report.kpiCards.length > 0 && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.kpiCards.map((card) => (
                  <KpiCard key={card.metric} card={card} />
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3 bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-end mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      تطور الأداء
                      <TrendingUp size={16} style={{ color: "#9CA3AF" }} />
                    </h3>
                  </div>
                  <div className="h-[220px] md:h-[260px]">
                    <PerformanceTrendLineChart timeline={timeline} />
                  </div>
                </div>
                
                <div className="md:col-span-2 bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <BarChart3 size={16} style={{ color: "#9CA3AF" }} />
                      مقارنة الأداء
                    </h3>
                  </div>
                  <div className="h-[220px] md:h-[260px]">
                    <MonthlyComparisonBarChart
                      timeline={timeline}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Smart Tips / Table / Donut */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Smart Tips — 25% */}
                <div className="md:col-span-3 bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      توصيات ذكية
                      <Lightbulb size={16} style={{ color: "#9CA3AF" }} />
                    </span>
                  </h3>
                  {report.smartTips.length > 0 ? (
                    <SmartTips tips={report.smartTips} />
                  ) : (
                    <p className="text-xs text-muted-foreground">لا توجد توصيات حالياً.</p>
                  )}
                </div>

                {/* Top Campaigns Table — 40% */}
                <div className="md:col-span-5 bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      أفضل الإعلانات أداءً
                      <BarChart2 size={16} style={{ color: "#9CA3AF" }} />
                    </span>
                  </h3>
                  {report.topCampaigns.length > 0 ? (
                    <TopCampaignsTable campaigns={report.topCampaigns} />
                  ) : (
                    <p className="text-xs text-muted-foreground">لا توجد بيانات.</p>
                  )}
                </div>

                {/* Donut Chart — 35% */}
                <div className="md:col-span-4 bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      توزيع الإنفاق الإعلاني
                      <PieChart size={16} style={{ color: "#9CA3AF" }} />
                    </span>
                  </h3>
                  <div className="h-[240px] md:h-[280px]">
                    <SpendDistributionDonutChart data={report.platformDistribution} />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}