"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis } from "recharts";

import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
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
import { OverviewChartCard } from "@/features/admin-overview/components/overview-chart-card";
import { OverviewAmount } from "@/features/admin-overview/components/overview-amount";
import { OverviewActiveProjectsTable } from "@/features/admin-overview/components/overview-active-projects-table";
import { OverviewClientsTable } from "@/features/admin-overview/components/overview-clients-table";
import { OverviewLeadOrdersTable } from "@/features/admin-overview/components/overview-lead-orders-table";
import { OverviewSalesLeaderboard } from "@/features/admin-overview/components/overview-sales-leaderboard";
import { useGetAdminOverviewQuery } from "@/lib/api/admin-overview-api";
import {
  localizeOverviewChartLabel,
  translateAdminOverviewText,
  useTranslations,
} from "@/lib/i18n";

function AdminOverviewContent() {
  const { locale, t } = useTranslations();
  const { range, rangeLabel, granularity } = useReportingPeriod();
  const projectAmountConfig = {
    amount: { label: t("activeProjectValue"), color: "var(--color-chart-2)" },
  } satisfies ChartConfig;
  const invoiceConfig = {
    paid: { label: t("paidInvoices"), color: "var(--color-chart-3)" },
    unpaid: { label: t("unpaidInvoices"), color: "var(--color-chart-1)" },
  } satisfies ChartConfig;
  const crmConfig = {
    contracts: { label: t("activeContracts"), color: "var(--color-chart-4)" },
    offers: { label: t("offersSent"), color: "var(--color-chart-2)" },
  } satisfies ChartConfig;
  const {
    data: snapshot,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetAdminOverviewQuery({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    granularity,
  });

  if (isLoading && !snapshot) {
    return (
      <PageScaffold
        title={t("adminOverview")}
        description={t("adminOverviewDescription")}
        actions={<ReportingPeriodToolbar />}
      >
        <WorkspaceQueryState
          kind="loading"
          loadingTitle={t("loadingAdminOverview")}
          loadingDescription={t("loadingAdminOverviewDescription")}
        />
      </PageScaffold>
    );
  }

  if (isError && !snapshot) {
    return (
      <PageScaffold
        title={t("adminOverview")}
        description={t("adminOverviewDescription")}
        actions={<ReportingPeriodToolbar />}
      >
        <WorkspaceQueryState
          kind="error"
          error={error}
          errorTitle={t("overviewErrorTitle")}
          errorDescription={t("overviewErrorDescription")}
          retryLabel={t("retry")}
          onRetry={() => {
            void refetch();
          }}
        />
      </PageScaffold>
    );
  }

  if (!snapshot) {
    return (
      <PageScaffold
        title={t("adminOverview")}
        description={t("adminOverviewDescription")}
        actions={<ReportingPeriodToolbar />}
      >
        <WorkspaceQueryState
          kind="error"
          error={undefined}
          errorTitle={t("overviewErrorTitle")}
          errorDescription={t("overviewErrorDescription")}
          retryLabel={t("retry")}
          onRetry={() => {
            void refetch();
          }}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title={t("adminOverview")}
      description={t("adminOverviewDescription")}
      actions={<ReportingPeriodToolbar />}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.kpis.map((kpi) => (
          <MetricTile
            key={kpi.label}
            label={translateAdminOverviewText(locale, kpi.label)}
            value={<OverviewAmount value={kpi.value} locale={locale} />}
            description={translateAdminOverviewText(locale, kpi.description)}
            trend={kpi.trend}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <OverviewChartCard
          title={t("activeProjectValue")}
          description={t("activeProjectValueDescription")}
          periodLabel={rangeLabel}
          summary={
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  <OverviewAmount value={snapshot.summaries.projectAmount} locale={locale} />
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("currentActiveProjectAmount")}
                </span>
              </div>
            </div>
          }
        >
          <ChartContainer config={projectAmountConfig} className="min-h-64 w-full">
            <BarChart
              accessibilityLayer
              data={snapshot.projectAmountChart.map((point) => ({
                ...point,
                label: localizeOverviewChartLabel(locale, point.label),
              }))}
            >
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
          title={`${t("paidInvoices")} / ${t("unpaidInvoices")}`}
          description={t("invoiceCashPosition")}
          periodLabel={rangeLabel}
          summary={
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  <OverviewAmount value={snapshot.summaries.paidInvoices} locale={locale} />
                </span>
                <span className="text-sm text-muted-foreground">{t("paidInvoices")}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  <OverviewAmount value={snapshot.summaries.unpaidInvoices} locale={locale} />
                </span>
                <span className="text-sm text-muted-foreground">{t("unpaidInvoices")}</span>
              </div>
            </div>
          }
        >
          <ChartContainer config={invoiceConfig} className="min-h-64 w-full">
            <BarChart
              accessibilityLayer
              data={snapshot.invoiceChart.map((point) => ({
                ...point,
                label: localizeOverviewChartLabel(locale, point.label),
              }))}
            >
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
          title={`${t("activeContracts")} / ${t("offersSent")}`}
          description={t("contractsOffersDescription")}
          periodLabel={rangeLabel}
          summary={
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.activeContracts}
                </span>
                <span className="text-sm text-muted-foreground">{t("activeContracts")}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight">
                  {snapshot.summaries.offersSent}
                </span>
                <span className="text-sm text-muted-foreground">{t("offersSent")}</span>
              </div>
            </div>
          }
        >
          <ChartContainer config={crmConfig} className="min-h-64 w-full">
            <BarChart
              accessibilityLayer
              data={snapshot.commercialChart.map((point) => ({
                ...point,
                label: localizeOverviewChartLabel(locale, point.label),
              }))}
            >
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
