import { UserRole } from "@hassad/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import { StatusBadge } from "@/components/patterns/status-badge";
import {
  Card,
  CardAction,
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
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";
import { getEmployeeDetailInsights } from "@/features/employees/lib/employee-detail-insights";
import { OverviewChartCard } from "@/features/admin-overview/components/overview-chart-card";

const performanceTrendConfig = {
  onTrack: {
    label: "On-track milestones",
    color: "var(--color-chart-3)",
  },
  delayed: {
    label: "Delayed milestones",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const capacityMixConfig = {
  active: {
    label: "Active load",
    color: "var(--color-chart-2)",
  },
  review: {
    label: "Review queue",
    color: "var(--color-chart-4)",
  },
  blocked: {
    label: "Blocked items",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

const employeeRoleContent: Record<
  UserRole,
  {
    overviewTabLabel: string;
    workloadTabLabel: string;
    activityTabLabel: string;
    summaryTitle: string;
    summaryDescription: string;
    summaryChartTitle: string;
    summaryChartDescription: string;
    summarySignalLabel: string;
    workloadSignalLabel: string;
    capacityChartTitle: string;
    capacityChartDescription: string;
    workloadTitle: string;
    workloadDescription: string;
    attentionTitle: string;
    attentionDescription: string;
    attentionTableDescription: string;
    activityDescription: string;
  }
> = {
  [UserRole.ADMIN]: {
    overviewTabLabel: "Admin overview",
    workloadTabLabel: "Assigned work",
    activityTabLabel: "Activity feed",
    summaryTitle: "Admin performance",
    summaryDescription: "Current outcomes and operational reading for this admin seat.",
    summaryChartTitle: "Admin performance trend",
    summaryChartDescription: "How this admin seat is performing across the latest operating window.",
    summarySignalLabel: "Current admin signal",
    workloadSignalLabel: "Open admin items",
    capacityChartTitle: "Admin workload mix",
    capacityChartDescription: "How the current admin load is split between active work, reviews, and blockers.",
    workloadTitle: "Active admin work",
    workloadDescription: "Items this admin is currently driving or holding.",
    attentionTitle: "What needs intervention",
    attentionDescription: "Signals that require action from leadership.",
    attentionTableDescription: "Operational issues that currently need intervention or reassignment.",
    activityDescription: "Only activity that changed ownership, approvals, or business state.",
  },
  [UserRole.PM]: {
    overviewTabLabel: "Delivery overview",
    workloadTabLabel: "Projects & workload",
    activityTabLabel: "Activity feed",
    summaryTitle: "Delivery performance",
    summaryDescription: "Project health, milestone control, and where delivery may slip.",
    summaryChartTitle: "Delivery performance",
    summaryChartDescription: "Milestone execution over the latest delivery window.",
    summarySignalLabel: "Current milestone signal",
    workloadSignalLabel: "Active delivery items",
    capacityChartTitle: "Delivery capacity",
    capacityChartDescription: "How the current PM load is split between active work, reviews, and blockers.",
    workloadTitle: "Project load",
    workloadDescription: "Projects, reviews, and deadlines that explain the PM workload.",
    attentionTitle: "Delivery risks",
    attentionDescription: "Issues that can delay delivery or create client escalation.",
    attentionTableDescription: "Project-level risks that currently need PM or admin attention.",
    activityDescription: "Updates that changed delivery state, risk, or client accountability.",
  },
  [UserRole.SALES]: {
    overviewTabLabel: "Sales overview",
    workloadTabLabel: "Pipeline & workload",
    activityTabLabel: "Activity feed",
    summaryTitle: "Sales performance",
    summaryDescription: "Pipeline quality, close performance, and follow-up discipline.",
    summaryChartTitle: "Sales performance",
    summaryChartDescription: "Qualified pipeline progress across the latest sales window.",
    summarySignalLabel: "Current conversion signal",
    workloadSignalLabel: "Open commercial items",
    capacityChartTitle: "Pipeline load",
    capacityChartDescription: "How the current sales load is split between active deals, reviews, and blockers.",
    workloadTitle: "Owned pipeline",
    workloadDescription: "Leads, proposals, and contracts that explain current sales load.",
    attentionTitle: "Pipeline risks",
    attentionDescription: "Items that can reduce close rate or stall revenue.",
    attentionTableDescription: "Pipeline issues that currently need follow-up or sales manager attention.",
    activityDescription: "Only sales activity that changed revenue probability or client status.",
  },
  [UserRole.TEAM]: {
    overviewTabLabel: "Execution overview",
    workloadTabLabel: "Assigned work",
    activityTabLabel: "Activity feed",
    summaryTitle: "Execution performance",
    summaryDescription: "Task output, revision pressure, and delivery consistency.",
    summaryChartTitle: "Execution performance",
    summaryChartDescription: "Task delivery and revision performance over the latest work window.",
    summarySignalLabel: "Current output signal",
    workloadSignalLabel: "Open assigned items",
    capacityChartTitle: "Execution load",
    capacityChartDescription: "How the current execution load is split between active work, reviews, and blockers.",
    workloadTitle: "Assigned work",
    workloadDescription: "Tasks and deadlines that explain current execution load.",
    attentionTitle: "Delivery blockers",
    attentionDescription: "Items slowing output, approvals, or handoff.",
    attentionTableDescription: "Execution issues that currently need PM coordination or asset resolution.",
    activityDescription: "Only activity that moved work forward, blocked it, or changed accountability.",
  },
  [UserRole.ACCOUNTANT]: {
    overviewTabLabel: "Finance overview",
    workloadTabLabel: "Queue & workload",
    activityTabLabel: "Activity feed",
    summaryTitle: "Finance operations",
    summaryDescription: "Invoice handling, payment follow-up, and queue reliability.",
    summaryChartTitle: "Finance operations",
    summaryChartDescription: "Queue performance and unresolved issues over the latest finance window.",
    summarySignalLabel: "Current finance signal",
    workloadSignalLabel: "Open finance items",
    capacityChartTitle: "Finance queue mix",
    capacityChartDescription: "How the current finance load is split between active work, reviews, and blockers.",
    workloadTitle: "Finance queue",
    workloadDescription: "Invoices, collections, and payroll work currently owned by this employee.",
    attentionTitle: "Finance exceptions",
    attentionDescription: "Items that can impact cash flow, client trust, or due dates.",
    attentionTableDescription: "Finance issues that need reassignment, reconciliation, or deadline protection.",
    activityDescription: "Only activity that changed payment state, invoice ownership, or risk.",
  },
  [UserRole.CLIENT]: {
    overviewTabLabel: "Client overview",
    workloadTabLabel: "Open items",
    activityTabLabel: "Activity feed",
    summaryTitle: "Client activity",
    summaryDescription: "Current engagement and operational reading for this client user.",
    summaryChartTitle: "Client activity",
    summaryChartDescription: "Engagement and pending work across the latest operating window.",
    summarySignalLabel: "Current engagement signal",
    workloadSignalLabel: "Open client items",
    capacityChartTitle: "Client workload mix",
    capacityChartDescription: "How current client tasks are split between active work, reviews, and blockers.",
    workloadTitle: "Open client work",
    workloadDescription: "Items this client is reviewing, approving, or blocking.",
    attentionTitle: "Client-side blockers",
    attentionDescription: "Signals that can delay approvals or delivery.",
    attentionTableDescription: "Client-side issues that need follow-up or clarification.",
    activityDescription: "Only activity that changed approvals, feedback, or commitment.",
  },
  [UserRole.MARKETING]: {
    overviewTabLabel: "Campaign overview",
    workloadTabLabel: "Campaign workload",
    activityTabLabel: "Activity feed",
    summaryTitle: "Marketing performance",
    summaryDescription: "Campaign output, execution speed, and pipeline contribution.",
    summaryChartTitle: "Campaign performance",
    summaryChartDescription: "Campaign output and readiness across the latest operating window.",
    summarySignalLabel: "Current campaign signal",
    workloadSignalLabel: "Open campaign items",
    capacityChartTitle: "Campaign load",
    capacityChartDescription: "How the current campaign load is split between active work, reviews, and blockers.",
    workloadTitle: "Campaign load",
    workloadDescription: "Campaigns and deliverables currently assigned.",
    attentionTitle: "Campaign risks",
    attentionDescription: "Items that threaten launch timing or channel performance.",
    attentionTableDescription: "Campaign issues that need escalation, resourcing, or schedule changes.",
    activityDescription: "Only activity that changed launch readiness or marketing outcomes.",
  },
};

export function EmployeeOperationalProfile({
  employee,
}: {
  employee: EmployeeFixture;
}) {
  const content = employeeRoleContent[employee.role];
  const insights = getEmployeeDetailInsights(employee);

  return (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{content.overviewTabLabel}</TabsTrigger>
          <TabsTrigger value="workload">{content.workloadTabLabel}</TabsTrigger>
          <TabsTrigger value="activity">{content.activityTabLabel}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex flex-col gap-5">
            <section className="grid gap-4 xl:grid-cols-2">
              <OverviewChartCard
                title={content.summaryChartTitle}
                description={content.summaryChartDescription}
                periodLabel="Last 30 days"
                summary={
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-semibold tracking-tight">
                        {employee.performanceSignal}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {content.summarySignalLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-semibold tracking-tight">
                        {employee.openAssignments}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {content.workloadSignalLabel}
                      </span>
                    </div>
                  </div>
                }
              >
                <ChartContainer
                  config={performanceTrendConfig}
                  className="min-h-64 w-full"
                >
                  <LineChart accessibilityLayer data={insights.performanceTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Legend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="onTrack"
                      stroke="var(--color-onTrack)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="delayed"
                      stroke="var(--color-delayed)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </OverviewChartCard>

              <OverviewChartCard
                title={content.capacityChartTitle}
                description={content.capacityChartDescription}
                periodLabel="Current week"
                summary={
                  <div className="grid grid-cols-3 gap-3">
                    {insights.summary.slice(0, 3).map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="text-2xl font-semibold tracking-tight">
                          {item.value}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              >
                <ChartContainer
                  config={capacityMixConfig}
                  className="min-h-64 w-full"
                >
                  <BarChart accessibilityLayer data={insights.capacityMix}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="active" fill="var(--color-active)" radius={8} />
                    <Bar dataKey="review" fill="var(--color-review)" radius={8} />
                    <Bar dataKey="blocked" fill="var(--color-blocked)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </OverviewChartCard>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>{content.attentionTitle}</CardTitle>
                  <CardDescription>{content.attentionTableDescription}</CardDescription>
                  <CardAction>
                    <StatusBadge tone={employee.riskTone}>{employee.riskLabel}</StatusBadge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Risk type</TableHead>
                        <TableHead>Current blocker</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Action needed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights.riskProjects.map((item) => (
                        <TableRow key={`${item.project}-${item.due}`}>
                          <TableCell className="font-medium">{item.project}</TableCell>
                          <TableCell>{item.client}</TableCell>
                          <TableCell>
                            <StatusBadge tone={item.tone}>{item.riskType}</StatusBadge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.blocker}
                          </TableCell>
                          <TableCell>{item.due}</TableCell>
                          <TableCell>{item.action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle>{content.workloadTitle}</CardTitle>
              <CardDescription>{content.workloadDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.currentWork.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <StatusBadge tone={item.tone}>{item.state}</StatusBadge>
                      </TableCell>
                      <TableCell>{item.due}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Important activity</CardTitle>
              <CardDescription>{content.activityDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {employee.meaningfulActivities.map((activity, index) => (
                <div key={`${activity.title}-${activity.time}`} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{activity.title}</div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                    <StatusBadge tone={activity.tone}>{activity.impact}</StatusBadge>
                  </div>
                  {index < employee.meaningfulActivities.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
