"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetPortalReportsQuery,
  useGetReportTimelineQuery,
  type ReportSummary,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  BarChart3,
  TrendingUp,
  Lightbulb,
  BarChart2,
  PieChart,
} from "lucide-react";
import { MonthlyComparisonBarChart } from "@/components/design-system/MonthlyComparisonBarChart";
import { PerformanceTrendLineChart } from "@/components/design-system/PerformanceTrendLineChart";
import { SpendDistributionDonutChart } from "@/components/design-system/SpendDistributionDonutChart";
import { SmartTips } from "@/components/design-system/SmartTips";
import { TopCampaignsTable } from "@/components/design-system/TopCampaignsTable";
import {
  TimeRangeSelector,
  getTimeRangeParams,
  type TimeRange,
} from "@/components/design-system/TimeRangeSelector";

function fmtCompact(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function fmtSpend(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function KpiCardShell() {
  return (
    <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-5">
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
    <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-4 md:p-5 text-center">
      <p className="text-xs text-portal-note-text mb-2">{card.label}</p>
      <div className="flex items-center justify-center gap-2">
        <span
          className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isNegative
              ? "var(--color-danger-100)"
              : isPositive
                ? "var(--color-success-100)"
                : "var(--color-portal-bg)",
            color: isNegative
              ? "var(--color-danger-500)"
              : isPositive
                ? "var(--color-success-500)"
                : "var(--color-portal-note-text)",
          }}
        >
          {isPositive && "+"}
          {card.trendPercent?.toFixed(1)}%
        </span>
        <span className="text-xl md:text-2xl font-bold text-secondary-500">
          {card.metric === "spend"
            ? `${fmtSpend(card.value)}`
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

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useGetPortalReportsQuery(undefined, { skip: !clientId, pollingInterval: 30_000 });
  const { data: timeline } = useGetReportTimelineQuery(
    {
      dateFrom: rangeParams.dateFrom,
      dateTo: rangeParams.dateTo,
      granularity: rangeParams.granularity,
    },
    { skip: !clientId, pollingInterval: 30_000 },
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="التقارير"
        description="لوحة تحليلات شاملة لأداء حملاتك الإعلانية، الزيارات، التحويلات، والعائد على الإنفاق."
        icon={BarChart3}
        actions={
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        }
      />

      {!clientId && (
        <p className="text-sm text-portal-note-text">
          لم يتم ربط حسابك بملف عميل.
        </p>
      )}

      {clientId && isError && !isLoading && (
            <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
          <p className="text-base font-medium text-danger-700">
            تعذر تحميل التقارير.
          </p>
          <p className="mt-2 text-sm text-danger-600">
            يرجى المحاولة لاحقاً أو تحديث الصفحة.
          </p>
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-3"
          >
            إعادة المحاولة
          </ActionButton>
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
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
                <BarChart3 className="h-8 w-8 text-secondary-500" />
              </div>
              <p className="text-lg font-medium text-natural-100">
                لا توجد حملات في الفترة المحددة.
              </p>
              <p className="max-w-md text-sm leading-6 text-portal-note-text">
                حدد فترة زمنية مختلفة أو عد بمجرد بدء حملاتك الإعلانية.
              </p>
            </div>
          )}

          {!isLoading && report && report.kpiCards.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.kpiCards.map((card) => (
                  <KpiCard key={card.metric} card={card} />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SurfaceCard
                  title="تطور الأداء"
                  icon={TrendingUp}
                  className="md:col-span-3"
                  contentClassName="h-[220px] md:h-[260px]"
                >
                  <PerformanceTrendLineChart timeline={timeline} />
                </SurfaceCard>

                <SurfaceCard
                  title="مقارنة الأداء"
                  icon={BarChart3}
                  className="md:col-span-2"
                  contentClassName="h-[220px] md:h-[260px]"
                >
                  <MonthlyComparisonBarChart timeline={timeline} />
                </SurfaceCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <SurfaceCard
                  title="توصيات ذكية"
                  icon={Lightbulb}
                  className="md:col-span-3"
                >
                  {report.smartTips.length > 0 ? (
                    <SmartTips tips={report.smartTips} />
                  ) : (
                    <p className="text-xs text-portal-note-text">
                      لا توجد توصيات حالياً.
                    </p>
                  )}
                </SurfaceCard>

                <SurfaceCard
                  title="أفضل الإعلانات أداءً"
                  icon={BarChart2}
                  className="md:col-span-5"
                >
                  {report.topCampaigns.length > 0 ? (
                    <TopCampaignsTable campaigns={report.topCampaigns} />
                  ) : (
                    <p className="text-xs text-portal-note-text">
                      لا توجد بيانات.
                    </p>
                  )}
                </SurfaceCard>

                <SurfaceCard
                  title="توزيع الإنفاق الإعلاني"
                  icon={PieChart}
                  className="md:col-span-4"
                  contentClassName="h-[240px] md:h-[280px]"
                >
                  <SpendDistributionDonutChart
                    data={report.platformDistribution}
                  />
                </SurfaceCard>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
