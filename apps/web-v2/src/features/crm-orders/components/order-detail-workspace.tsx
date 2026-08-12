"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  ArrowLeftIcon,
  Building2Icon,
  FileTextIcon,
  PhoneCallIcon,
} from "lucide-react";
import { ProposalStatus } from "@hassad/shared";

import {
  EntityTimeline,
  type EntityTimelineItem,
} from "@/components/patterns/entity-timeline";
import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { OrderDetailRecord } from "@/features/crm-orders/lib/order-detail";
import {
  formatBusinessType,
  formatClientRelationship,
  formatContactLogResult,
  formatContactLogType,
  formatPipelineStage,
  formatProposalResponse,
} from "@/features/crm-orders/lib/order-detail";
import {
  formatOrderCurrency,
  formatOrderSource,
} from "@/features/crm-orders/lib/order-directory";

const contactOutcomeChartConfig = {
  total: {
    label: "Touchpoints",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

function getContactResultTone(result: OrderDetailRecord["contactTimeline"][number]["result"]) {
  if (result === "RESPONDED") return "success";
  if (result === "BUSY") return "warning";
  return "attention";
}

function getContactOutcomeSummary(contactTimeline: OrderDetailRecord["contactTimeline"]) {
  const counts = {
    total: contactTimeline.length,
    successful: 0,
    failed: 0,
    meetings: 0,
    responded: 0,
    noResponse: 0,
    busy: 0,
    wrongNumber: 0,
    notInterested: 0,
  };

  for (const entry of contactTimeline) {
    if (entry.result === "RESPONDED") {
      counts.successful += 1;
      counts.responded += 1;
    }
    if (
      entry.result === "NO_RESPONSE" ||
      entry.result === "WRONG_NUMBER" ||
      entry.result === "NOT_INTERESTED"
    ) {
      counts.failed += 1;
    }
    if (entry.result === "NO_RESPONSE") counts.noResponse += 1;
    if (entry.result === "BUSY") counts.busy += 1;
    if (entry.result === "WRONG_NUMBER") counts.wrongNumber += 1;
    if (entry.result === "NOT_INTERESTED") counts.notInterested += 1;
    if (entry.type === "MEETING") counts.meetings += 1;
  }

  return {
    stats: [
      {
        label: "All contact",
        value: String(counts.total),
        description: "Every logged touchpoint on this order.",
      },
      {
        label: "Successful",
        value: String(counts.successful),
        description: "Contacts that produced an actual response.",
        trend: { label: "Reached", tone: "success" as const },
      },
      {
        label: "Failed",
        value: String(counts.failed),
        description: "No response, wrong number, or not interested.",
        trend: counts.failed > 0 ? { label: "Needs cleanup", tone: "attention" as const } : undefined,
      },
      {
        label: "Meetings held",
        value: String(counts.meetings),
        description: "Meetings logged by CRM on this order.",
      },
    ],
    chart: [
      { label: "Responded", total: counts.responded },
      { label: "No response", total: counts.noResponse },
      { label: "Busy", total: counts.busy },
      { label: "Wrong number", total: counts.wrongNumber },
      { label: "Not interested", total: counts.notInterested },
    ],
  };
}

export function OrderDetailWorkspace({
  order,
  backHref = "/admin/crm/orders",
  backLabel = "Orders",
}: {
  order: OrderDetailRecord;
  backHref?: string;
  backLabel?: string;
}) {
  const contactOutcome = getContactOutcomeSummary(order.contactTimeline);
  const contactTimelineItems: EntityTimelineItem[] = order.contactTimeline.map((entry) => ({
    id: entry.id,
    date: entry.happenedAt,
    title: entry.summary,
    badges: (
      <>
        <StatusBadge tone="neutral">{formatContactLogType(entry.type)}</StatusBadge>
        <StatusBadge tone={getContactResultTone(entry.result)}>
          {formatContactLogResult(entry.result)}
        </StatusBadge>
      </>
    ),
    meta: <span>{entry.owner}</span>,
    content: (
      <div className="flex flex-col gap-3">
        <p>{entry.report}</p>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground">
            Next follow-up
          </span>
          <span>{entry.nextAction}</span>
        </div>
      </div>
    ),
    completed: entry.result === "RESPONDED",
  }));
  const stageHistoryItems: EntityTimelineItem[] = order.stageHistory.map((item) => ({
    id: item.id,
    date: item.changedAt,
    title: `${formatPipelineStage(item.fromStage)} -> ${formatPipelineStage(item.toStage)}`,
    badges: (
      <StatusBadge tone={item.toStage === order.stage ? order.stageTone : "active"}>
        {formatPipelineStage(item.toStage)}
      </StatusBadge>
    ),
    meta: <span>{item.changedBy}</span>,
    content: <p>{item.note}</p>,
    completed: true,
  }));

  return (
    <PageScaffold
      title="Order detail"
      description="Pipeline state, contact reports, proposal context, and client linkage for a single CRM order."
      actions={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {backLabel}
        </Button>
      }
    >
      <EntityDetailLayout
        sidebar={
          <>
            <Card>
              <CardHeader className="gap-4">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>
                      {order.companyName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="truncate text-2xl">{order.companyName}</CardTitle>
                      <CardDescription>{order.contactName}</CardDescription>
                      <p className="text-sm text-muted-foreground">{order.serviceLine}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={order.stageTone}>
                        {formatPipelineStage(order.stage)}
                      </StatusBadge>
                      <StatusBadge tone={order.client ? "success" : "neutral"}>
                        {formatClientRelationship(order.client)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{order.statusSummary}</p>
                <div className="flex flex-wrap gap-2">
                  {order.client ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/admin/clients/${order.client.id}`} />}
                    >
                      <Building2Icon data-icon="inline-start" />
                      Open client
                    </Button>
                  ) : null}
                  {order.proposals[0] ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/admin/proposals/${order.proposals[0].id}`} />}
                    >
                      <FileTextIcon data-icon="inline-start" />
                      Open proposal
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order info</CardTitle>
                <CardDescription>
                  Identity and commercial facts that stay stable across tabs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="text-right font-medium">{order.phone}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="text-right font-medium">{order.email}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Business type</dt>
                    <dd className="text-right font-medium">
                      {formatBusinessType(order.businessType)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="text-right font-medium">{order.owner}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Opened</dt>
                    <dd className="text-right font-medium">{order.openedAt}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="text-right font-medium">
                      {formatOrderSource(order.source)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick summary</CardTitle>
                <CardDescription>
                  Fast CRM signals for follow-up discipline, proposal state, and relationship readiness.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {order.sidebarSummary.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.helper}</span>
                    </div>
                    <span className="text-right font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {order.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              trend={metric.trend}
            />
          ))}
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contact timeline</TabsTrigger>
            <TabsTrigger value="history">Pipeline history</TabsTrigger>
            <TabsTrigger value="records">Services & records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col gap-5">
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact outcome breakdown</CardTitle>
                    <CardDescription>
                      Response quality across every logged CRM contact on this order.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {contactOutcome.stats.map((metric) => (
                        <div
                          key={metric.label}
                          className="flex flex-col gap-3 rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">
                              {metric.label}
                            </span>
                            {metric.trend ? (
                              <StatusBadge tone={metric.trend.tone}>
                                {metric.trend.label}
                              </StatusBadge>
                            ) : null}
                          </div>
                          <div className="text-2xl font-medium">{metric.value}</div>
                          <p className="text-sm text-muted-foreground">
                            {metric.description}
                          </p>
                        </div>
                      ))}
                    </section>
                    <ChartContainer config={contactOutcomeChartConfig} className="min-h-64 w-full">
                      <BarChart accessibilityLayer data={contactOutcome.chart}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commercial snapshot</CardTitle>
                    <CardDescription>
                      The business context behind the current stage, not a duplicate of the KPI row.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Latest note</span>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">Next follow-up</span>
                        <span className="text-right font-medium">{order.nextFollowUp}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">Primary proposal</span>
                        <span className="text-right font-medium">
                          {order.proposals[0]
                            ? formatProposalResponse(order.proposals[0].status)
                            : "Not started"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">Client relation</span>
                        <span className="text-right font-medium">
                          {formatClientRelationship(order.client)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground">Potential value</span>
                        <span className="text-right font-medium">
                          {formatOrderCurrency(order.estimatedValue)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contact timeline</CardTitle>
              <CardDescription>
                  Every call, meeting, or follow-up with the summary and report the CRM owner logged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline items={contactTimelineItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline history</CardTitle>
              <CardDescription>
                  Stage movement history with the operator and reason behind each commercial step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline items={stageHistoryItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <div className="flex flex-col gap-5">
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal records</CardTitle>
                    <CardDescription>
                      Commercial documents already created for this order.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {order.proposals.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileTextIcon />
                          </EmptyMedia>
                          <EmptyTitle>No proposals yet</EmptyTitle>
                          <EmptyDescription>
                            This order still needs its first proposal package.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proposal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Signal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.proposals.map((proposal) => (
                            <TableRow key={proposal.id}>
                              <TableCell>
                                <Link
                                  href={`/admin/proposals/${proposal.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {proposal.title}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  tone={
                                    proposal.status === ProposalStatus.APPROVED
                                      ? "success"
                                      : proposal.status === ProposalStatus.REVISION_REQUESTED
                                        ? "attention"
                                        : proposal.status === ProposalStatus.SENT
                                          ? "warning"
                                          : "neutral"
                                  }
                                >
                                  {formatProposalResponse(proposal.status)}
                                </StatusBadge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatOrderCurrency(proposal.amount)}
                              </TableCell>
                              <TableCell>{proposal.createdAt}</TableCell>
                              <TableCell>{proposal.responseSignal}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commercial context</CardTitle>
                    <CardDescription>
                      Client linkage, blockers, source context, and the business notes that explain the current CRM state.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {order.client ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">Linked client</span>
                            <span className="font-medium">{order.client.companyName}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.client.contactName} · {order.client.lastSeen}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/admin/clients/${order.client.id}`} />}
                          >
                            Open
                          </Button>
                        </div>
                        <Separator />
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 rounded-lg border p-4">
                          <PhoneCallIcon />
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">No client account yet</span>
                            <span className="text-sm text-muted-foreground">
                              Keep this order in CRM flow until the commercial path is approved.
                            </span>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {order.relatedRecords.map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                        <span className="text-xs text-muted-foreground">{item.helper}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
