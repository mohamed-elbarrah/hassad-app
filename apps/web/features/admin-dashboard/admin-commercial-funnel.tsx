"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { AdminOverviewResponse } from "@hassad/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";

const config = { value: { label: "العدد", color: "var(--chart-4)" } } satisfies ChartConfig;

export function AdminCommercialFunnel({ data }: { data: AdminOverviewResponse["funnel"] }) {
  const stages = [
    ["الطلبات", data.leads],
    ["العروض", data.proposals],
    ["العقود", data.contracts],
    ["المشاريع", data.projects],
  ].map(([label, value]) => ({ label, value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>القمع التجاري</CardTitle>
        <CardDescription>مقارنة مراحل تحويل الطلبات إلى مشاريع.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart accessibilityLayer data={stages} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={64} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-3 gap-2 text-center text-xs" aria-label="معدلات التحويل">
          <span>طلبات ← عروض: {formatNumber(data.conversionRates.requestsToOffers)}%</span>
          <span>عروض ← عقود: {formatNumber(data.conversionRates.offersToContracts)}%</span>
          <span>عقود ← مشاريع: {formatNumber(data.conversionRates.contractsToProjects)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
