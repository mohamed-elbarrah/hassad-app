"use client";

import Link from "next/link";
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
} from "recharts";

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
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
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
import { ClientBusinessSectionContent } from "@/features/clients/components/client-business-section-content";
import type { ClientDetailRecord } from "@/features/clients/lib/client-detail";
import {
  getClientBusinessSections,
  getClientTypeLabel,
  getClientTypeTone,
  getPortalStatusTone,
} from "@/features/clients/lib/client-detail";

const spendChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-chart-2)",
  },
  paid: {
    label: "Paid",
    color: "var(--color-chart-3)",
  },
  outstanding: {
    label: "Outstanding",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const commercialMixConfig = {
  projects: {
    label: "Projects",
    color: "var(--color-chart-4)",
  },
  offers: {
    label: "Offers",
    color: "var(--color-chart-2)",
  },
  contracts: {
    label: "Contracts",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

export function ClientDetailWorkspace({ client }: { client: ClientDetailRecord }) {
  const typeTone = getClientTypeTone(client.summary);
  const typeLabel = getClientTypeLabel(client.summary);
  const portalTone = getPortalStatusTone(client.portalStatus);
  const businessSections = getClientBusinessSections(client.businessProfile);

  return (
    <PageScaffold
      title="Client detail"
      description="Account identity, collected business context, and operational relationship signals."
      actions={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/clients" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Clients
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
                      {client.companyName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="truncate text-2xl">{client.contactName}</CardTitle>
                      <CardDescription>{client.contactRole}</CardDescription>
                      <p className="text-sm text-muted-foreground">{client.companyName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={typeTone}>{typeLabel}</StatusBadge>
                      <StatusBadge tone={portalTone}>{client.portalStatus}</StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-right font-medium">{client.email}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-right font-medium">{client.phone}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Account owner</span>
                  <span className="text-right font-medium">{client.owner}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Last seen</span>
                  <span className="text-right font-medium">{client.lastSeen}</span>
                </div>
                <Button
                  variant="outline"
                  disabled={!client.chatTargetUserId}
                  nativeButton={false}
                  render={
                    client.chatTargetUserId
                      ? (
                          <Link
                            href={`/admin/chat?targetUserId=${encodeURIComponent(
                              client.chatTargetUserId,
                            )}&targetName=${encodeURIComponent(
                              client.contactName,
                            )}&targetKind=client`}
                          />
                        )
                      : undefined
                  }
                >
                  <MessageSquareIcon data-icon="inline-start" />
                  Message client
                </Button>
                {!client.chatTargetUserId ? (
                  <p className="text-xs text-muted-foreground">
                    This client does not have a linked portal user yet.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client summary</CardTitle>
                <CardDescription>
                  Fast account signals for spend, delivery, and CRM state.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-xs text-muted-foreground">Relationship state</span>
                  </div>
                  <span className="font-medium">{typeLabel}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Total spend</span>
                    <span className="text-xs text-muted-foreground">Closed revenue</span>
                  </div>
                  <span className="font-medium">{client.stats[1]?.value}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Active projects</span>
                    <span className="text-xs text-muted-foreground">Live execution now</span>
                  </div>
                  <span className="font-medium">{client.summary.activeProjects}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Signed contracts</span>
                    <span className="text-xs text-muted-foreground">CRM base</span>
                  </div>
                  <span className="font-medium">{client.summary.signedContracts}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Pending offers</span>
                    <span className="text-xs text-muted-foreground">Awaiting decision</span>
                  </div>
                  <span className="font-medium">{client.summary.pendingOffers}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <span className="text-xs text-muted-foreground">Still open in finance</span>
                  </div>
                  <span className="font-medium">{client.stats[2]?.value}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business info</CardTitle>
                <CardDescription>
                  Collected onboarding context from the client portal profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="identity" className="w-full">
                  <div className="overflow-x-auto pb-1">
                    <TabsList className="min-w-max">
                      {businessSections.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {businessSections.map((tab) => (
                      <TabsContent key={tab.key} value={tab.key}>
                        <ClientBusinessSectionContent section={tab} />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {client.stats.map((stat) => (
            <MetricTile
              key={stat.label}
              label={stat.label}
              value={stat.value}
              description={stat.description}
              trend={
                stat.tone && stat.trendLabel
                  ? { tone: stat.tone, label: stat.trendLabel }
                  : undefined
              }
            />
          ))}
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="commercial">Projects & CRM</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col gap-5">
              <section className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Spend and payment trend</CardTitle>
                    <CardDescription>
                      Revenue, paid amounts, and outstanding balance across the latest window.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={spendChartConfig} className="min-h-64 w-full">
                      <LineChart accessibilityLayer data={client.spendTrend}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Legend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="outstanding" stroke="var(--color-outstanding)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CRM mix</CardTitle>
                    <CardDescription>
                      Relationship mix between projects, offers, and signed contracts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={commercialMixConfig} className="min-h-64 w-full">
                      <BarChart accessibilityLayer data={client.commercialMix}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="projects" fill="var(--color-projects)" radius={8} />
                        <Bar dataKey="offers" fill="var(--color-offers)" radius={8} />
                        <Bar dataKey="contracts" fill="var(--color-contracts)" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>Account risks</CardTitle>
                  <CardDescription>
                    Delivery, CRM, and finance issues that need intervention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Blocker</TableHead>
                        <TableHead>Amount / status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Action needed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.risks.map((risk) => (
                        <TableRow key={`${risk.item}-${risk.type}`}>
                          <TableCell className="font-medium">{risk.item}</TableCell>
                          <TableCell>
                            <StatusBadge tone={risk.tone}>{risk.type}</StatusBadge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{risk.blocker}</TableCell>
                          <TableCell>{risk.amountOrStatus}</TableCell>
                          <TableCell>{risk.owner}</TableCell>
                          <TableCell>{risk.action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commercial">
            <Card>
                <CardHeader>
                  <CardTitle>Projects and CRM items</CardTitle>
                  <CardDescription>
                    Active relationship records across projects, orders, proposals, and contracts.
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.projectsCommercial.map((row) => (
                      <TableRow key={`${row.item}-${row.category}`}>
                        <TableCell className="font-medium">{row.item}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>
                          <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                        </TableCell>
                        <TableCell>{row.amount}</TableCell>
                        <TableCell>{row.owner}</TableCell>
                        <TableCell>{row.due}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Disputes</CardTitle>
                <CardDescription>
                  Open and historical dispute records connected to this client account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {client.disputes.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No disputes</EmptyTitle>
                      <EmptyDescription>
                        This client currently has no dispute records.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Related to</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Current blocker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.disputes.map((dispute) => (
                        <TableRow key={`${dispute.title}-${dispute.openedAt}`}>
                          <TableCell className="font-medium">{dispute.title}</TableCell>
                          <TableCell>{dispute.relatedTo}</TableCell>
                          <TableCell>
                            <StatusBadge tone={dispute.tone}>{dispute.status}</StatusBadge>
                          </TableCell>
                          <TableCell>{dispute.priority}</TableCell>
                          <TableCell>{dispute.openedAt}</TableCell>
                          <TableCell>{dispute.owner}</TableCell>
                          <TableCell className="text-muted-foreground">{dispute.blocker}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Important activity</CardTitle>
                <CardDescription>
                  Meaningful account activity across CRM, finance, and delivery work.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {client.activity.map((activity, index) => (
                  <div key={`${activity.title}-${activity.time}`} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{activity.title}</div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                      <StatusBadge tone={activity.tone}>{activity.impact}</StatusBadge>
                    </div>
                    {index < client.activity.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
