"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { AdminOverviewResponse } from "@hassad/shared";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatNumber } from "@/lib/format";

const metrics = {
  requests: { label: "الطلبات", color: "var(--chart-1)" },
  offers: { label: "العروض", color: "var(--chart-2)" },
  contracts: { label: "العقود", color: "var(--chart-3)" },
} as const satisfies ChartConfig;

type SummaryMetric = keyof typeof metrics;

type AdminSummaryChartProps = {
  data: AdminOverviewResponse["commercialChart"];
};

export function AdminSummaryChart({ data }: AdminSummaryChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<SummaryMetric>("requests");

  const total = useMemo(
    () => data.reduce((sum, bucket) => sum + bucket[selectedMetric], 0),
    [data, selectedMetric],
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>ملخص المسار التجاري</CardTitle>
          <CardDescription>
            تابع حجم الطلبات والعروض والعقود حسب الفترة المحددة.
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={selectedMetric}
          onValueChange={(value) => {
            if (value) setSelectedMetric(value as SummaryMetric);
          }}
          variant="outline"
          aria-label="اختيار مقياس المسار التجاري"
        >
          {Object.entries(metrics).map(([key, metric]) => (
            <ToggleGroupItem key={key} value={key} aria-label={metric.label}>
              {metric.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">الإجمالي</span>
          <span className="text-2xl font-semibold">{formatNumber(total)}</span>
        </div>
        <ChartContainer config={metrics} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey={selectedMetric} fill={`var(--color-${selectedMetric})`} radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
