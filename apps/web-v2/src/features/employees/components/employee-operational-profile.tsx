import {
  AlertCircleIcon,
} from "lucide-react";
import { UserRole } from "@hassad/shared";

import { MetricTile } from "@/components/patterns/metric-tile";
import { StatusBadge } from "@/components/patterns/status-badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";

const employeeRoleContent: Record<
  UserRole,
  {
    summaryTitle: string;
    summaryDescription: string;
    workloadTitle: string;
    workloadDescription: string;
    attentionTitle: string;
    attentionDescription: string;
    activityDescription: string;
  }
> = {
  [UserRole.ADMIN]: {
    summaryTitle: "Admin performance",
    summaryDescription: "Current outcomes and operational reading for this admin seat.",
    workloadTitle: "Active admin work",
    workloadDescription: "Items this admin is currently driving or holding.",
    attentionTitle: "What needs intervention",
    attentionDescription: "Signals that require action from leadership.",
    activityDescription: "Only activity that changed ownership, approvals, or business state.",
  },
  [UserRole.PM]: {
    summaryTitle: "Delivery performance",
    summaryDescription: "Project health, milestone control, and where delivery may slip.",
    workloadTitle: "Project load",
    workloadDescription: "Projects, reviews, and deadlines that explain the PM workload.",
    attentionTitle: "Delivery risks",
    attentionDescription: "Issues that can delay delivery or create client escalation.",
    activityDescription: "Updates that changed delivery state, risk, or client accountability.",
  },
  [UserRole.SALES]: {
    summaryTitle: "Sales performance",
    summaryDescription: "Pipeline quality, close performance, and follow-up discipline.",
    workloadTitle: "Owned pipeline",
    workloadDescription: "Leads, proposals, and contracts that explain current sales load.",
    attentionTitle: "Pipeline risks",
    attentionDescription: "Items that can reduce close rate or stall revenue.",
    activityDescription: "Only sales activity that changed revenue probability or client status.",
  },
  [UserRole.TEAM]: {
    summaryTitle: "Execution performance",
    summaryDescription: "Task output, revision pressure, and delivery consistency.",
    workloadTitle: "Assigned work",
    workloadDescription: "Tasks and deadlines that explain current execution load.",
    attentionTitle: "Delivery blockers",
    attentionDescription: "Items slowing output, approvals, or handoff.",
    activityDescription: "Only activity that moved work forward, blocked it, or changed accountability.",
  },
  [UserRole.ACCOUNTANT]: {
    summaryTitle: "Finance operations",
    summaryDescription: "Invoice handling, payment follow-up, and queue reliability.",
    workloadTitle: "Finance queue",
    workloadDescription: "Invoices, collections, and payroll work currently owned by this employee.",
    attentionTitle: "Finance exceptions",
    attentionDescription: "Items that can impact cash flow, client trust, or due dates.",
    activityDescription: "Only activity that changed payment state, invoice ownership, or risk.",
  },
  [UserRole.CLIENT]: {
    summaryTitle: "Client activity",
    summaryDescription: "Current engagement and operational reading for this client user.",
    workloadTitle: "Open client work",
    workloadDescription: "Items this client is reviewing, approving, or blocking.",
    attentionTitle: "Client-side blockers",
    attentionDescription: "Signals that can delay approvals or delivery.",
    activityDescription: "Only activity that changed approvals, feedback, or commitment.",
  },
  [UserRole.MARKETING]: {
    summaryTitle: "Marketing performance",
    summaryDescription: "Campaign output, execution speed, and pipeline contribution.",
    workloadTitle: "Campaign load",
    workloadDescription: "Campaigns and deliverables currently assigned.",
    attentionTitle: "Campaign risks",
    attentionDescription: "Items that threaten launch timing or channel performance.",
    activityDescription: "Only activity that changed launch readiness or marketing outcomes.",
  },
};

export function EmployeeOperationalProfile({
  employee,
}: {
  employee: EmployeeFixture;
}) {
  const content = employeeRoleContent[employee.role];

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {employee.roleProfile.metrics.map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.36fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{content.summaryTitle}</CardTitle>
            <CardDescription>{content.summaryDescription}</CardDescription>
            <CardAction>
              <StatusBadge tone={employee.riskTone}>
                {employee.performanceSignal}
              </StatusBadge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Manager summary</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {employee.roleProfile.summary}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">Business signal</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {employee.headlineSignal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{content.attentionTitle}</CardTitle>
            <CardDescription>{content.attentionDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Alert
              variant={employee.riskTone === "destructive" ? "destructive" : "default"}
            >
              <AlertCircleIcon />
              <AlertTitle>{employee.riskLabel}</AlertTitle>
              <AlertDescription>{employee.headlineSignal}</AlertDescription>
            </Alert>
            {employee.roleProfile.focusItems.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{item.label}</span>
                  <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
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
      </section>

      <section className="grid gap-4">
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
      </section>
    </div>
  );
}
