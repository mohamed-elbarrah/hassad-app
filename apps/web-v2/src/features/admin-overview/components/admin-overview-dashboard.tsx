"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis } from "recharts";

import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReportingPeriodToolbar } from "@/features/reporting/components/reporting-period-toolbar";
import {
  ReportingPeriodProvider,
  useReportingPeriod,
} from "@/features/reporting/reporting-period-context";
import { getAdminOverviewSnapshot } from "@/features/admin-overview/lib/admin-overview-data";
import { OverviewChartCard } from "@/features/admin-overview/components/overview-chart-card";
import { OverviewActiveProjectsTable } from "@/features/admin-overview/components/overview-active-projects-table";
import { OverviewClientsTable } from "@/features/admin-overview/components/overview-clients-table";
import { OverviewLeadOrdersTable } from "@/features/admin-overview/components/overview-lead-orders-table";
import { OverviewSalesLeaderboard } from "@/features/admin-overview/components/overview-sales-leaderboard";

const projectAmountConfig = {
  amount: {
    label: "Active project value",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const invoiceConfig = {
  paid: {
    label: "Paid invoices",
    color: "var(--color-chart-3)",
  },
  unpaid: {
    label: "Unpaid invoices",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const commercialConfig = {
  contracts: {
    label: "Active contracts",
    color: "var(--color-chart-4)",
  },
  offers: {
    label: "Offers sent",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

function AdminOverviewContent() {
  const { preset, range, rangeLabel, granularity } = useReportingPeriod();
  const snapshot = getAdminOverviewSnapshot(range, preset, granularity);

  return (
    <PageScaffold
      title="Admin overview"
      description="Commercial, delivery, and finance health for the latest operating window."
      actions={<ReportingPeriodToolbar />}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.kpis.map((kpi) => (
          <MetricTile
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <OverviewChartCard
          title="Active project value"
          description="Total value under active execution for the selected period."
          periodLabel={rangeLabel}
          summary={
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {snapshot.summaries.projectAmount}
                </span>
                <span className="text-sm text-muted-foreground">
                  Current active project amount
                </span>
              </div>
            </div>
          }
        >
          <ChartContainer config={projectAmountConfig} className="min-h-64 w-full">
            <BarChart accessibilityLayer data={snapshot.projectAmountChart}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-amount)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </OverviewChartCard>

        <OverviewChartCard
          title="Paid vs unpaid invoices"
          description="Invoice cash position across the selected reporting window."
          periodLabel={rangeLabel}
          summary={
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.paidInvoices}
                </span>
                <span className="text-sm text-muted-foreground">Paid invoices</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.unpaidInvoices}
                </span>
                <span className="text-sm text-muted-foreground">Unpaid invoices</span>
              </div>
            </div>
          }
        >
          <ChartContainer config={invoiceConfig} className="min-h-64 w-full">
            <BarChart accessibilityLayer data={snapshot.invoiceChart}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
              <Legend content={<ChartLegendContent />} />
              <Bar
                dataKey="paid"
                stackId="invoices"
                fill="var(--color-paid)"
                radius={[0, 0, 8, 8]}
              />
              <Bar
                dataKey="unpaid"
                stackId="invoices"
                fill="var(--color-unpaid)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </OverviewChartCard>

        <OverviewChartCard
          title="Contracts vs offers"
          description="Commercial throughput between live contracts and outbound offers."
          periodLabel={rangeLabel}
          summary={
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.activeContracts}
                </span>
                <span className="text-sm text-muted-foreground">Active contracts</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.offersSent}
                </span>
                <span className="text-sm text-muted-foreground">Offers sent</span>
              </div>
            </div>
          }
        >
          <ChartContainer config={commercialConfig} className="min-h-64 w-full">
            <BarChart accessibilityLayer data={snapshot.commercialChart}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="contracts" fill="var(--color-contracts)" radius={8} />
              <Bar dataKey="offers" fill="var(--color-offers)" radius={8} />
            </BarChart>
          </ChartContainer>
        </OverviewChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(18rem,1fr)]">
        <OverviewLeadOrdersTable
          rows={snapshot.leadOrders}
          periodLabel={rangeLabel}
        />
        <OverviewSalesLeaderboard
          rows={snapshot.salesLeaders}
          periodLabel={rangeLabel}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <OverviewActiveProjectsTable
          rows={snapshot.activeProjects}
          periodLabel={rangeLabel}
        />
        <OverviewClientsTable rows={snapshot.clients} periodLabel={rangeLabel} />
      </section>
    </PageScaffold>
  );
}

export function AdminOverviewDashboard() {
  return (
    <ReportingPeriodProvider>
      <AdminOverviewContent />
    </ReportingPeriodProvider>
  );
}
