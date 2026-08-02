"use client";

import type {
  ReportPlatformDistribution,
  ReportTimeline,
} from "@/features/portal/portalApi";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactNumber } from "@/lib/format";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const metricLabels: Record<string, string> = {
  impressions: "الظهور",
  clicks: "النقرات",
  conversions: "التحويلات",
  spend: "الإنفاق",
};

const performanceChartConfig = {
  value: {
    label: "الأداء",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const comparisonChartConfig = {
  value: {
    label: "الأداء",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const distributionChartConfig = {
  google: { label: "جوجل", color: "var(--chart-1)" },
  meta: { label: "ميتا", color: "var(--chart-2)" },
  tiktok: { label: "تيكتوك", color: "var(--chart-3)" },
  snapchat: { label: "سناب شات", color: "var(--chart-4)" },
  other: { label: "أخرى", color: "var(--chart-5)" },
} satisfies ChartConfig;

const distributionColorKeys = [
  "google",
  "meta",
  "tiktok",
  "snapchat",
  "other",
] as const;

type TimelineChartProps = {
  timeline: ReportTimeline | undefined;
  selectedMetric?: string;
};

function getTimelineChartData(
  timeline: ReportTimeline,
  selectedMetric?: string,
) {
  const dataKey =
    timeline.datasets.find((dataset) => dataset.metric === selectedMetric)
      ?.metric ??
    timeline.datasets[0]?.metric ??
    "impressions";

  return {
    dataKey,
    data: timeline.labels.map((label, index) => ({
      name: label,
      value:
        timeline.datasets.find((dataset) => dataset.metric === dataKey)?.data[
          index
        ] ?? 0,
    })),
  };
}

function ChartEmptyState() {
  return (
    <p className="py-10 text-center text-xs text-muted-foreground">
      لا توجد بيانات كافية للمخطط.
    </p>
  );
}

export function PerformanceTrendChart({
  timeline,
  selectedMetric,
}: TimelineChartProps) {
  if (!timeline?.labels.length) return <ChartEmptyState />;

  const { data, dataKey } = getTimelineChartData(timeline, selectedMetric);

  return (
    <ChartContainer config={performanceChartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8 }}>
        <defs>
          <linearGradient id="performance-fill" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.3}
            />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} reversed />
        <YAxis
          tickFormatter={(value) => formatCompactNumber(Number(value))}
          tickLine={false}
          axisLine={false}
          orientation="right"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => label}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatCompactNumber(Number(value))}{" "}
                  {metricLabels[dataKey] ?? dataKey}
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          fill="url(#performance-fill)"
          stroke="var(--color-value)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function PerformanceComparisonChart({
  timeline,
  selectedMetric,
}: TimelineChartProps) {
  if (!timeline?.labels.length) return <ChartEmptyState />;

  const { data, dataKey } = getTimelineChartData(timeline, selectedMetric);

  return (
    <ChartContainer config={comparisonChartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} reversed />
        <YAxis
          tickFormatter={(value) => formatCompactNumber(Number(value))}
          tickLine={false}
          axisLine={false}
          orientation="right"
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatCompactNumber(Number(value))}{" "}
                  {metricLabels[dataKey] ?? dataKey}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function SpendDistributionChart({
  data,
}: {
  data: ReportPlatformDistribution[];
}) {
  if (!data.length) return <ChartEmptyState />;

  const totalSpend = data.reduce((total, entry) => total + entry.spend, 0);
  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: `var(--color-${distributionColorKeys[index % distributionColorKeys.length]})`,
  }));

  return (
    <ChartContainer
      config={distributionChartConfig}
      className="mx-auto aspect-square h-64 w-full"
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="platform"
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  ر.س {formatCompactNumber(Number(value))}
                </span>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="spend"
          nameKey="platform"
          innerRadius={60}
          outerRadius={92}
          paddingAngle={3}
        >
          {chartData.map((entry) => (
            <Cell key={entry.platform} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                return null;
              }

              return (
                <text
                  x={viewBox.cx}
                  y={viewBox.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <tspan className="fill-foreground text-sm font-semibold">
                    ر.س {formatCompactNumber(totalSpend)}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    dy="1.5em"
                    className="fill-muted-foreground text-xs"
                  >
                    إجمالي الإنفاق
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
