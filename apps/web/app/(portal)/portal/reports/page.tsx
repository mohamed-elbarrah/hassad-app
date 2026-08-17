"use client";

import { useMemo, useState } from "react";
import {
  BarChart2,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Wallet,
  AlertCircle,
  PieChart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ReportSmartTip,
  type ReportSummary,
  useGetPortalReportsQuery,
  useGetReportTimelineQuery,
} from "@/features/portal/portalApi";
import {
  PerformanceComparisonChart,
  PerformanceTrendChart,
  SpendDistributionChart,
} from "@/components/portal/reports/ReportCharts";
import { useAppSelector } from "@/lib/hooks";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { formatCompactNumber } from "@/lib/format";

type TimeRange = "last7days" | "last30days" | "last12months";

const timeRangeOptions: Array<{
  value: TimeRange;
  label: string;
  granularity: "day" | "month";
}> = [
  { value: "last7days", label: "آخر 7 أيام", granularity: "day" },
  { value: "last30days", label: "آخر 30 يوم", granularity: "day" },
  { value: "last12months", label: "آخر 12 شهر", granularity: "month" },
];

const tipIcons: Record<ReportSmartTip["type"], typeof Lightbulb> = {
  budget: Wallet,
  warning: AlertCircle,
  insight: Lightbulb,
};

function getTimeRangeParams(range: TimeRange) {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  const option = timeRangeOptions.find((item) => item.value === range)!;

  if (range === "last12months") {
    dateFrom.setMonth(dateFrom.getMonth() - 12);
  } else {
    dateFrom.setDate(dateFrom.getDate() - (range === "last7days" ? 7 : 30));
  }

  return {
    dateFrom: dateFrom.toISOString().slice(0, 10),
    dateTo: dateTo.toISOString().slice(0, 10),
    granularity: option.granularity,
  };
}

function KpiCardShell() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 pt-6">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ card }: { card: ReportSummary["kpiCards"][number] }) {
  const trend = card.trendPercent ?? 0;
  const value =
    card.metric === "spend"
      ? formatCompactNumber(card.value)
      : card.metric === "conversionRate" || card.metric === "ctr"
        ? `${card.value.toFixed(1)}%`
        : formatCompactNumber(card.value);

  return (
    <Card>
      <CardHeader className="items-center gap-2 pb-2 text-center">
        <CardDescription>{card.label}</CardDescription>
        <CardTitle className="text-2xl text-primary">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center pt-0">
        <Badge variant={trend < 0 ? "destructive" : "secondary"}>
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </Badge>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center gap-2">
        <Icon className="size-5 text-muted-foreground" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
  } = useGetPortalReportsQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const { data: timeline } = useGetReportTimelineQuery(rangeParams, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const topCampaigns = useMemo(
    () =>
      [...(report?.topCampaigns ?? [])]
        .sort((first, second) => second.conversions - first.conversions)
        .slice(0, 5),
    [report?.topCampaigns],
  );

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <BarChart3 className="size-6 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <CardTitle>التقارير</CardTitle>
              <CardDescription>
                لوحة تحليلات شاملة لأداء حملاتك الإعلانية، الزيارات، التحويلات،
                والعائد على الإنفاق.
              </CardDescription>
            </div>
          </div>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="اختر الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {!clientId && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3 />
            </EmptyMedia>
            <EmptyTitle>لا يوجد ملف عميل مرتبط</EmptyTitle>
            <EmptyDescription>
              لم يتم ربط حسابك بملف عميل لعرض التقارير.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {clientId && isError && !isLoading && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>تعذر تحميل التقارير</EmptyTitle>
            <EmptyDescription>
              يرجى المحاولة لاحقاً أو تحديث الصفحة.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </Empty>
      )}

      {clientId && !isError && (
        <>
          {isLoading && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <KpiCardShell key={index} />
              ))}
            </div>
          )}

          {!isLoading && report && report.kpiCards.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 />
                </EmptyMedia>
                <EmptyTitle>لا توجد حملات في الفترة المحددة</EmptyTitle>
                <EmptyDescription>
                  حدد فترة زمنية مختلفة أو عد بمجرد بدء حملاتك الإعلانية.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && report && report.kpiCards.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {report.kpiCards.map((card) => (
                  <KpiCard key={card.metric} card={card} />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <SectionCard
                  title="تطور الأداء"
                  icon={TrendingUp}
                  className="md:col-span-3"
                >
                  <PerformanceTrendChart timeline={timeline} />
                </SectionCard>
                <SectionCard
                  title="مقارنة الأداء"
                  icon={BarChart3}
                  className="md:col-span-2"
                >
                  <PerformanceComparisonChart timeline={timeline} />
                </SectionCard>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <SectionCard
                  title="توصيات ذكية"
                  icon={Lightbulb}
                  className="md:col-span-3"
                >
                  {report.smartTips.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {report.smartTips.map((tip) => {
                        const Icon = tipIcons[tip.type];

                        return (
                          <Card key={`${tip.type}-${tip.title}`}>
                            <CardContent className="flex items-start gap-3 pt-6">
                              <Icon className="size-5 shrink-0 text-muted-foreground" />
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">
                                  {tip.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {tip.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      لا توجد توصيات حالياً.
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  title="أفضل الإعلانات أداءً"
                  icon={BarChart2}
                  className="md:col-span-5"
                >
                  {topCampaigns.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الإعلان</TableHead>
                          <TableHead>المنصة</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>التحويلات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCampaigns.map((campaign) => {
                          const ctr =
                            campaign.impressions > 0
                              ? (campaign.clicks / campaign.impressions) * 100
                              : 0;

                          return (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">
                                {campaign.name}
                              </TableCell>
                              <TableCell>{campaign.platform}</TableCell>
                              <TableCell>{ctr.toFixed(1)}%</TableCell>
                              <TableCell>
                                {formatCompactNumber(campaign.conversions)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      لا توجد بيانات.
                    </p>
                  )}
                </SectionCard>

                <SectionCard
                  title="توزيع الإنفاق الإعلاني"
                  icon={PieChart}
                  className="md:col-span-4"
                >
                  <SpendDistributionChart data={report.platformDistribution} />
                </SectionCard>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
