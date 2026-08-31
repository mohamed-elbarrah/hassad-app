"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { AdminOverviewResponse } from "@hassad/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCompactNumber, formatCurrency } from "@/lib/format";

const config = {
  paid: { label: "مدفوع", color: "var(--chart-2)" },
  unpaid: { label: "غير مدفوع", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function AdminInvoiceChart({ data }: { data: AdminOverviewResponse["invoiceChart"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>التحصيلات</CardTitle>
        <CardDescription>مقارنة المبالغ المدفوعة وغير المدفوعة.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), data[0]?.currency)} />} />
            <Bar dataKey="paid" stackId="invoices" fill="var(--color-paid)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="unpaid" stackId="invoices" fill="var(--color-unpaid)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
