"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArchiveIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleIcon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
} from "lucide-react";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { LocalizedCurrency } from "@/components/patterns/localized-currency";
import { EntityTimeline } from "@/components/patterns/entity-timeline";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectDetailRecord } from "@/features/projects/lib/project-detail";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";
import {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getDisputePriorityTone,
  getDisputeStatusTone,
  getTaskPriorityTone,
  getTaskStatusTone,
} from "@/features/projects/lib/project-detail";

type ProjectDetailWorkspaceProps = {
  project: ProjectDetailRecord;
};

function getPeriodNodeClasses(params: {
  isCurrent: boolean;
  isClosed: boolean;
  isSelected: boolean;
}) {
  if (params.isCurrent) {
    return "bg-primary text-primary-foreground shadow-lg shadow-primary/20";
  }

  if (params.isClosed) {
    return params.isSelected
      ? "border-primary bg-background text-primary shadow-md shadow-primary/10"
      : "border-primary/50 bg-background text-primary";
  }

  return params.isSelected
    ? "border-border bg-muted text-foreground shadow-md"
    : "border-border bg-background text-muted-foreground";
}

function PeriodProgressRing({
  value,
}: {
  value: number;
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative size-[120px]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transition-all duration-500"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

function getDefaultPeriodId(project: ProjectDetailRecord) {
  return (
    project.periods.find((period) => period.markerLabel === "Current")?.id ??
    [...project.periods].reverse().find((period) => period.status === "Closed")?.id ??
    project.periods[0]?.id
  );
}

export function ProjectDetailWorkspace({ project }: ProjectDetailWorkspaceProps) {
  const { locale, t } = useTranslations();
  const [currentPm, setCurrentPm] = useState(project.projectManager);
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [draftPm, setDraftPm] = useState(project.projectManager);
  const [isArchived, setIsArchived] = useState(project.archived);
  const [selectedPeriodId, setSelectedPeriodId] = useState(() => getDefaultPeriodId(project));

  const currentPmEmail = useMemo(
    () =>
      project.pmOptions.find((option) => option.name === currentPm)?.email ??
      project.projectManagerEmail,
    [currentPm, project.pmOptions, project.projectManagerEmail],
  );
  const selectedPeriod =
    project.periods.find((period) => period.id === selectedPeriodId) ?? project.periods[0];
  const selectedPeriodTasks = selectedPeriod?.tasks ?? [];
  const selectedPeriodMeetings = selectedPeriod?.meetings ?? [];
  const selectedPeriodFiles = selectedPeriod?.files ?? [];
  const selectedPeriodInvoices = selectedPeriod?.invoices ?? [];
  const selectedPeriodHistory = selectedPeriod?.history ?? [];
  const selectedPeriodDisputes = selectedPeriod?.disputes ?? [];
  const selectedPeriodIndex = selectedPeriod
    ? project.periods.findIndex((period) => period.id === selectedPeriod.id)
    : -1;

  return (
    <>
      <PageScaffold
        title={t("projectDetail")}
        description={t("projectDetailDescription")}
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/projects" />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            {t("projectsBack")}
          </Button>
        }
      >
        <EntityDetailLayout
          sidebar={
            <>
              <Card>
                <CardHeader className="gap-4">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <CardTitle className="truncate text-2xl">{project.name}</CardTitle>
                      <CardDescription>{project.clientName}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={project.statusTone}>{translateRequestLabel(locale, project.status)}</StatusBadge>
                      <StatusBadge tone={project.healthTone}>{translateRequestLabel(locale, project.healthLabel)}</StatusBadge>
                      {isArchived ? (
                        <StatusBadge tone="neutral">{t("archived")}</StatusBadge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button onClick={() => setPmDialogOpen(true)}>
                    <PencilIcon data-icon="inline-start" />
                    {t("changePm")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsArchived((current) => !current)}
                  >
                    <ArchiveIcon data-icon="inline-start" />
                    {isArchived ? t("restoreProject") : t("archiveProject")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("projectContext")}</CardTitle>
                  <CardDescription>
                    Stable contract, ownership, and timeline details for admin decisions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Client</dt>
                      <dd className="text-right font-medium">
                        {project.clientId ? (
                          <Link
                            href={`/admin/clients/${project.clientId}`}
                            className="hover:underline"
                          >
                            {project.clientName}
                          </Link>
                        ) : (
                          project.clientName
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Project manager</dt>
                      <dd className="text-right font-medium">
                        <div className="flex flex-col">
                          <span>{currentPm}</span>
                          <span className="text-xs text-muted-foreground">
                            {currentPmEmail}
                          </span>
                        </div>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Model</dt>
                      <dd className="text-right font-medium">{project.modelLabel}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Priority</dt>
                      <dd className="text-right font-medium">{project.priorityLabel}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Timeline</dt>
                      <dd className="text-right font-medium">
                        <div className="flex flex-col">
                          <span>
                            {project.startDate} to {project.endDate}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {project.timelineLabel}
                          </span>
                        </div>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Departments</dt>
                      <dd className="text-right font-medium">{project.departmentsLabel}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("projectSummary")}</CardTitle>
                  <CardDescription>
                    Quick delivery and finance signals that stay visible across tabs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Current period</span>
                      <span className="text-xs text-muted-foreground">
                        Active delivery window
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-medium">{project.currentPeriodLabel}</span>
                      <StatusBadge tone={project.currentPeriodStatusTone}>
                        {project.currentPeriodStatusLabel}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Contract value</span>
                      <span className="text-xs text-muted-foreground">Total signed amount</span>
                    </div>
                    <span className="font-medium">{project.totalValue}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Remaining value</span>
                      <span className="text-xs text-muted-foreground">Still open in finance</span>
                    </div>
                    <span className="font-medium">{project.remainingValue}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Open disputes</span>
                      <span className="text-xs text-muted-foreground">Cases tied to delivery</span>
                    </div>
                    <span className="font-medium">{project.disputeRows.length}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          }
        >
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {project.metrics.map((metric) => (
              <MetricTile
                key={metric.label}
                label={metric.label}
                value={metric.value}
                description={metric.description}
                trend={
                  metric.tone && metric.trendLabel
                    ? { tone: metric.tone, label: metric.trendLabel }
                    : undefined
                }
              />
            ))}
          </section>

          <Tabs defaultValue="overview">
            <div className="overflow-x-auto pb-1">
              <TabsList className="min-w-max">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="periods">Periods</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className="flex flex-col gap-5">
                <Card>
                  <CardContent className="p-5">
                    {selectedPeriod ? (
                      <>
                        <div className="grid gap-6 p-6 md:grid-cols-[140px_minmax(0,1fr)_180px] md:items-center">
                          <div className="flex items-center justify-center">
                            <PeriodProgressRing value={selectedPeriod.completion} />
                          </div>

                          <div className="flex min-w-0 flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge tone="success">
                                {selectedPeriodIndex + 1 > 0
                                  ? `Period ${selectedPeriodIndex + 1} of ${project.periods.length}`
                                  : "Selected period"}
                              </StatusBadge>
                              <StatusBadge tone={selectedPeriod.statusTone}>
                                {selectedPeriod.status}
                              </StatusBadge>
                            </div>
                            <h2 className="text-xl font-bold">
                              {selectedPeriod.label}: {selectedPeriod.windowShort}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {selectedPeriod.window}
                            </p>
                          </div>

                          <div className="md:justify-self-end">
                            <Button variant="outline" size="sm">
                              <DownloadIcon data-icon="inline-start" />
                              Download period report
                            </Button>
                          </div>
                        </div>

                        <div className="mx-6 border-t" />

                        <div className="px-6 py-4">
                          <div className="relative overflow-x-auto px-2">
                            <div className="absolute left-10 right-10 top-[22px] h-0.5 bg-border" />
                            <div className="relative flex min-w-max items-start justify-between gap-4">
                              {project.periods.map((period) => {
                                const isCurrent = period.markerLabel === "Current";
                                const isClosed = period.status === "Closed";
                                const isSelected = period.id === selectedPeriod.id;

                                return (
                                  <button
                                    key={period.id}
                                    type="button"
                                    title={`${period.status} - ${period.label}: ${period.window}`}
                                    onClick={() => setSelectedPeriodId(period.id)}
                                    className="group relative z-10 flex min-w-[100px] flex-col items-center gap-2 rounded-lg pb-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  >
                                    <div
                                      className={`flex size-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${getPeriodNodeClasses({
                                        isCurrent,
                                        isClosed,
                                        isSelected,
                                      })}`}
                                    >
                                      {isCurrent ? (
                                        <PlayIcon className="size-4" />
                                      ) : isClosed ? (
                                        <CircleCheckIcon className="size-5" />
                                      ) : (
                                        <CircleIcon className="size-4" />
                                      )}
                                    </div>
                                    <div className="text-center">
                                      <p
                                        className={`text-xs font-semibold transition-colors ${
                                          isCurrent || isClosed
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {period.status}
                                      </p>
                                      <p className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">
                                        {period.windowShort}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                {selectedPeriod ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedPeriod.label}</CardTitle>
                      <CardDescription>
                        Period-level delivery, finance, files, and history for the selected window.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricTile
                          label="Completion"
                          value={`${selectedPeriod.completion}%`}
                          description={selectedPeriod.focus}
                          trend={{ tone: selectedPeriod.statusTone, label: selectedPeriod.status }}
                        />
                        <MetricTile
                          label="Tasks"
                          value={String(selectedPeriodTasks.length)}
                          description="Tasks scoped to this period"
                        />
                        <MetricTile
                          label="Meetings"
                          value={String(selectedPeriodMeetings.length)}
                          description="Planned checkpoints in this period"
                        />
                        <MetricTile
                          label="Invoices"
                          value={String(selectedPeriodInvoices.length)}
                          description={selectedPeriod.billing}
                        />
                      </section>

                      <Tabs defaultValue="overview">
                        <div className="overflow-x-auto pb-1">
                          <TabsList className="min-w-max">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="meetings">Meetings</TabsTrigger>
                            <TabsTrigger value="files">Files</TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                            {selectedPeriodDisputes.length > 0 ? (
                              <TabsTrigger value="disputes">Disputes</TabsTrigger>
                            ) : null}
                          </TabsList>
                        </div>

                        <TabsContent value="overview">
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.34fr)]">
                            <Card>
                              <CardHeader>
                                <CardTitle>Period summary</CardTitle>
                                <CardDescription>
                                  Delivery state, completion, and the main business signal in this window.
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge tone={selectedPeriod.statusTone}>
                                    {selectedPeriod.status}
                                  </StatusBadge>
                                  <span className="text-sm text-muted-foreground">
                                    {selectedPeriod.window}
                                  </span>
                                </div>
                                <Progress value={selectedPeriod.completion}>
                                  <ProgressLabel>
                                    {selectedPeriod.completion}% complete
                                  </ProgressLabel>
                                  <ProgressValue />
                                </Progress>
                                <p className="text-sm text-muted-foreground">
                                  {selectedPeriod.focus}
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Quick signals</CardTitle>
                                <CardDescription>
                                  Snapshot of the operational load in this period.
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                  <span className="text-sm text-muted-foreground">Tasks</span>
                                  <span className="font-medium">{selectedPeriodTasks.length}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                  <span className="text-sm text-muted-foreground">Meetings</span>
                                  <span className="font-medium">{selectedPeriodMeetings.length}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                  <span className="text-sm text-muted-foreground">Files</span>
                                  <span className="font-medium">{selectedPeriodFiles.length}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                  <span className="text-sm text-muted-foreground">Invoices</span>
                                  <span className="font-medium">{selectedPeriodInvoices.length}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="tasks">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Due</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPeriodTasks.map((task) => (
                                <TableRow key={task.id}>
                                  <TableCell className="font-medium">{task.title}</TableCell>
                                  <TableCell>{formatTaskDepartment(task.department)}</TableCell>
                                  <TableCell>{task.assigneeName ?? "Unassigned"}</TableCell>
                                  <TableCell>
                                    <StatusBadge tone={getTaskStatusTone(task.status)}>
                                      {formatTaskStatus(task.status)}
                                    </StatusBadge>
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge tone={getTaskPriorityTone(task.priority)}>
                                      {formatTaskPriority(task.priority)}
                                    </StatusBadge>
                                  </TableCell>
                                  <TableCell>{task.dueDateLabel}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="meetings">
                          <div className="flex flex-col gap-3">
                            {selectedPeriodMeetings.map((meeting) => (
                              <div key={meeting.id} className="rounded-lg border p-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">{meeting.title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {meeting.date} · {meeting.owner}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {meeting.note}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="files">
                          <div className="flex flex-col gap-3">
                            {selectedPeriodFiles.map((file) => (
                              <div key={file.id} className="rounded-lg border p-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">{file.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {file.type}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    Uploaded {file.uploadedAt} by {file.uploadedBy}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="invoices">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due</TableHead>
                                <TableHead>Owner</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPeriodInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                  <TableCell className="font-medium">{invoice.item}</TableCell>
                                  <TableCell>
                                    <StatusBadge tone={invoice.statusTone}>
                                      {invoice.status}
                                    </StatusBadge>
                                  </TableCell>
                                  <TableCell>{invoice.amount}</TableCell>
                                  <TableCell>{invoice.due}</TableCell>
                                  <TableCell>{invoice.owner}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="history">
                          <EntityTimeline
                            items={selectedPeriodHistory.map((row) => ({
                              id: row.id,
                              date: row.date,
                              title: row.title,
                              badges: <StatusBadge tone={row.tone}>{row.tone}</StatusBadge>,
                              content: row.summary,
                              meta: row.meta,
                              completed: row.completed,
                            }))}
                          />
                        </TabsContent>

                        {selectedPeriodDisputes.length > 0 ? (
                          <TabsContent value="disputes">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Ticket</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Priority</TableHead>
                                  <TableHead>Last activity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedPeriodDisputes.map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                      {row.ticketNumber}
                                    </TableCell>
                                    <TableCell>{formatDisputeCategory(row.category)}</TableCell>
                                    <TableCell>
                                      <StatusBadge tone={getDisputeStatusTone(row.status)}>
                                        {formatDisputeStatus(row.status)}
                                      </StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge tone={getDisputePriorityTone(row.priority)}>
                                        {formatDisputePriority(row.priority)}
                                      </StatusBadge>
                                    </TableCell>
                                    <TableCell>{row.lastActivityLabel}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TabsContent>
                        ) : null}
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="periods">
              <Card>
                <CardHeader>
                  <CardTitle>Periods</CardTitle>
                  <CardDescription>
                    Delivery windows, completion progress, and the billing tied to each period.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Window</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Billing</TableHead>
                        <TableHead>Focus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.periods.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium">{period.label}</TableCell>
                          <TableCell>
                            <StatusBadge tone={period.statusTone}>{period.status}</StatusBadge>
                          </TableCell>
                          <TableCell>{period.window}</TableCell>
                          <TableCell>
                            <div className="flex min-w-40 flex-col gap-2">
                              <Progress value={period.completion}>
                                <ProgressLabel>{period.completion}%</ProgressLabel>
                                <ProgressValue />
                              </Progress>
                            </div>
                          </TableCell>
                          <TableCell>{period.billing}</TableCell>
                          <TableCell>{period.focus}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Task load</CardTitle>
                  <CardDescription>
                    Tasks and review loops that explain the current project workload.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Signal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.taskRows.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">{task.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {task.clientName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatTaskDepartment(task.department)}</TableCell>
                          <TableCell>{task.assigneeName ?? "Unassigned"}</TableCell>
                          <TableCell>
                            <StatusBadge tone={getTaskStatusTone(task.status)}>
                              {formatTaskStatus(task.status)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={getTaskPriorityTone(task.priority)}>
                              {formatTaskPriority(task.priority)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{task.dueDateLabel}</TableCell>
                          <TableCell>{task.periodLabel}</TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="font-medium">{task.signalLabel}</span>
                              <span className="text-sm text-muted-foreground">
                                {task.signalSummary}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance">
              <Card>
                <CardHeader>
                  <CardTitle>Finance checkpoints</CardTitle>
                  <CardDescription>
                    Revenue collected, remaining exposure, and the next finance actions on this project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.financeRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.item}</TableCell>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>
                            <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
                          </TableCell>
                          <TableCell>{row.amount}</TableCell>
                          <TableCell>{row.due}</TableCell>
                          <TableCell>{row.owner}</TableCell>
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
                    Escalations, approval queues, and client issues tied to this project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.disputeRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dispute tickets are currently linked to this project.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Opened</TableHead>
                          <TableHead>Last activity</TableHead>
                          <TableHead>Signal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.disputeRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="font-medium">{row.ticketNumber}</span>
                                <span className="text-sm text-muted-foreground">
                                  {row.title}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDisputeCategory(row.category)}</TableCell>
                            <TableCell>
                              <StatusBadge tone={getDisputeStatusTone(row.status)}>
                                {formatDisputeStatus(row.status)}
                              </StatusBadge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge tone={getDisputePriorityTone(row.priority)}>
                                {formatDisputePriority(row.priority)}
                              </StatusBadge>
                            </TableCell>
                            <TableCell>{row.openedAtLabel}</TableCell>
                            <TableCell>{row.lastActivityLabel}</TableCell>
                            <TableCell>
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="font-medium">{row.signalLabel}</span>
                                <span className="text-sm text-muted-foreground">
                                  {row.signalSummary}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned team</CardTitle>
                  <CardDescription>
                    PM ownership and department leads currently carrying the project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Workload</TableHead>
                        <TableHead>Focus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.teamRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.role}</TableCell>
                          <TableCell>{row.department}</TableCell>
                          <TableCell>
                            <StatusBadge tone={row.tone}>{row.workload}</StatusBadge>
                          </TableCell>
                          <TableCell>{row.focus}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Project history</CardTitle>
                  <CardDescription>
                    The project timeline that explains delivery, finance, and admin changes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EntityTimeline
                    items={project.historyRows.map((row) => ({
                      id: row.id,
                      date: row.date,
                      title: row.title,
                      badges: <StatusBadge tone={row.tone}>{row.tone}</StatusBadge>,
                      content: row.summary,
                      meta: row.meta,
                      completed: row.completed,
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </EntityDetailLayout>
      </PageScaffold>

      <Dialog open={pmDialogOpen} onOpenChange={setPmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change project manager</DialogTitle>
            <DialogDescription>
              Reassign PM ownership without changing the rest of the delivery structure.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-pm">Project manager</FieldLabel>
              <FieldContent>
                <Select<string>
                  value={draftPm}
                  onValueChange={(value) => {
                    if (value) {
                      setDraftPm(value);
                    }
                  }}
                >
                  <SelectTrigger id="project-pm">
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {project.pmOptions.map((option) => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCurrentPm(draftPm);
                setPmDialogOpen(false);
              }}
            >
              Save PM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
