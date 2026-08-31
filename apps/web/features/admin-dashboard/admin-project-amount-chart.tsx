"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { AdminOverviewResponse } from "@hassad/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCompactNumber, formatCurrency } from "@/lib/format";

const config = { amount: { label: "قيمة المشاريع", color: "var(--chart-2)" } } satisfies ChartConfig;

export function AdminProjectAmountChart({ data }: { data: AdminOverviewResponse["projectAmountChart"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>قيمة المشاريع</CardTitle>
        <CardDescription>قيمة المشاريع النشطة عبر الفترات المحددة.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), data[0]?.currency)} />} />
            <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
