"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import {
  ArrowLeftIcon,
  Building2Icon,
  ChartColumnIcon,
  FileTextIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { EntityTimeline } from "@/components/patterns/entity-timeline";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkflowStepper } from "@/components/patterns/workflow-stepper";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TaskDetailRecord } from "@/features/tasks/lib/task-detail";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

type TaskDetailWorkspaceProps = {
  task: TaskDetailRecord;
  backHref?: string;
  backLabel?: string;
  projectHref?: string | null;
  clientHref?: string | null;
  actions?: ReactNode;
};

export function TaskDetailWorkspace({
  task,
  backHref = "/admin/tasks",
  backLabel = "Tasks",
  projectHref = "/admin/projects",
  clientHref = "/admin/clients",
  actions,
}: TaskDetailWorkspaceProps) {
  const { locale, t } = useTranslations();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const selectedCampaign =
    task.marketing?.campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  return (
    <PageScaffold
      title={t("taskDetail")}
      description={t("taskDetailDescription")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button variant="outline" nativeButton={false} render={<Link href={backHref} />}>
            <ArrowLeftIcon data-icon="inline-start" />
            {backLabel === "Tasks" ? t("tasks") : backLabel}
          </Button>
        </div>
      }
    >
      <EntityDetailLayout
        sidebar={
          <>
            <Card>
              <CardHeader className="gap-4">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>{task.assigneeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-2xl">{task.title}</CardTitle>
                      <CardDescription>{translateRequestLabel(locale, task.departmentLabel)}</CardDescription>
                      <p className="text-sm text-muted-foreground">{task.projectName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={task.statusTone}>{translateRequestLabel(locale, task.statusLabel)}</StatusBadge>
                      <StatusBadge tone={task.priorityTone}>{translateRequestLabel(locale, task.priorityLabel)}</StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{task.description}</p>
                {task.projectId && projectHref ? (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`${projectHref}/${task.projectId}`} />}
                  >
                    <Building2Icon data-icon="inline-start" />
                    {t("openProject")}
                  </Button>
                ) : null}
                {task.clientId && clientHref ? (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`${clientHref}/${task.clientId}`} />}
                  >
                    <UserIcon data-icon="inline-start" />
                    {t("openClient")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("taskInfo")}</CardTitle>
                <CardDescription>{t("taskInfoDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("status")}</dt>
                    <dd><StatusBadge tone={task.statusTone}>{translateRequestLabel(locale, task.statusLabel)}</StatusBadge></dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("priority")}</dt>
                    <dd className="font-medium">{translateRequestLabel(locale, task.priorityLabel)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("department")}</dt>
                    <dd className="font-medium">{translateRequestLabel(locale, task.departmentLabel)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("assignee")}</dt>
                    <dd className="font-medium">{task.assigneeName ?? t("noAssignee")}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("project")}</dt>
                    <dd className="text-right font-medium">
                      <div className="flex flex-col">
                        <span>{task.projectName}</span>
                        <span className="text-xs text-muted-foreground">{translateRequestLabel(locale, task.projectStatusLabel)}</span>
                      </div>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Due</dt>
                    <dd className="font-medium">{translateRequestLabel(locale, task.dueDateValue)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Period</dt>
                    <dd className="font-medium">{translateRequestLabel(locale, task.periodLabel)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">{t("clientVisibility")}</dt>
                    <dd>
                      <StatusBadge tone={task.isClientVisible ? "active" : "neutral"}>
                        {task.isClientVisible ? t("visible") : t("internal")}
                      </StatusBadge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("taskSignal")}</CardTitle>
                <CardDescription>{t("taskSignalDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={task.signalTone}>{translateRequestLabel(locale, task.signalLabel)}</StatusBadge>
                  {task.isArchived ? <StatusBadge tone="neutral">{t("archived")}</StatusBadge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{translateRequestLabel(locale, task.signalSummary)}</p>
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {task.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              trend={metric.trend}
            />
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("workflow")}</CardTitle>
            <CardDescription>{t("taskWorkflowDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowStepper steps={task.workflow} />
          </CardContent>
        </Card>

        <Tabs defaultValue="comments">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="comments">{t("comments")}</TabsTrigger>
              <TabsTrigger value="files">{t("files")}</TabsTrigger>
              <TabsTrigger value="history">{t("history")}</TabsTrigger>
              <TabsTrigger value="client">{t("clientTab")}</TabsTrigger>
              {task.marketing ? <TabsTrigger value="marketing">{t("marketingTab")}</TabsTrigger> : null}
            </TabsList>
          </div>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>{t("internalDiscussionTitle")}</CardTitle>
                <CardDescription>
                  PM, assignee, and admin discussion around execution, blockers, and review decisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline
                  items={task.comments.map((comment) => ({
                    id: comment.id,
                    date: comment.postedAt,
                    title: comment.author,
                    badges: (
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={comment.tone}>{comment.role}</StatusBadge>
                        <StatusBadge tone={comment.audience === "Team" ? "active" : "neutral"}>{comment.audience}</StatusBadge>
                      </div>
                    ),
                    content: comment.message,
                    completed: true,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>{t("files")}</CardTitle>
                <CardDescription>
                  Task brief, working files, and review submissions tied to this task.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("file")}</TableHead>
                      <TableHead>{t("purpose")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("uploaded")}</TableHead>
                      <TableHead>{t("by")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell>{file.purpose}</TableCell>
                        <TableCell>{file.mime}</TableCell>
                        <TableCell>{file.uploadedAt}</TableCell>
                        <TableCell>{file.uploadedBy}</TableCell>
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
                <CardTitle>{t("statusHistory")}</CardTitle>
                <CardDescription>
                  Key workflow transitions and task events visible to admin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline
                  items={task.history.map((item) => ({
                    id: item.id,
                    date: item.date,
                    title: item.title,
                    badges: <StatusBadge tone={item.tone}>{item.actor}</StatusBadge>,
                    content: item.summary,
                    completed: item.completed,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.34fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>{t("clientContextTitle")}</CardTitle>
                  <CardDescription>
                    Compact client context relevant to this task without duplicating the full client detail page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar size="lg">
                      <AvatarFallback>
                        {task.clientName
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl">{task.clientName}</CardTitle>
                        <CardDescription>{task.clientStageLabel ?? "No linked client fixture"}</CardDescription>
                      </div>
                      {task.clientStageLabel ? (
                        <StatusBadge tone={task.clientStageTone}>{task.clientStageLabel}</StatusBadge>
                      ) : null}
                    </div>
                  </div>
                  {task.clientId && clientHref ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`${clientHref}/${task.clientId}`} />}
                    >
                      <UserIcon data-icon="inline-start" />
                      Open client detail
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("clientSignals")}</CardTitle>
                  <CardDescription>
                    Relationship and commercial context that can affect task execution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {task.clientSummary.map((item) => (
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
            </div>
          </TabsContent>

          {task.marketing ? (
            <TabsContent value="marketing">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.34fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("marketingStrategy")}</CardTitle>
                    <CardDescription>
                      Marketing-only extension for strategy approval and campaign readiness.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={task.marketing.statusTone}>
                        {task.marketing.statusLabel}
                      </StatusBadge>
                      <StatusBadge tone={task.marketing.campaignReadinessTone}>
                        Campaign readiness
                      </StatusBadge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-medium">{task.marketing.fileName}</span>
                          <span className="text-sm text-muted-foreground">
                            Updated {task.marketing.updatedAt}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileTextIcon data-icon="inline-start" />
                          Open PDF
                        </Button>
                      </div>
                    </div>
                    {task.marketing.revisionNote ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{t("revisionNote")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {task.marketing.revisionNote}
                          </p>
                        </CardContent>
                      </Card>
                    ) : null}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{t("campaigns")}</CardTitle>
                        <CardDescription>
                          Campaigns created from the approved strategy. Open any row for the latest snapshot.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("campaign")}</TableHead>
                              <TableHead>{t("platform")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                              <TableHead>{t("performance")}</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {task.marketing.campaigns.map((campaign) => (
                              <TableRow key={campaign.id}>
                                <TableCell>
                                  <div className="flex min-w-0 flex-col gap-1">
                                    <span className="font-medium">{campaign.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {campaign.launchedAt}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{campaign.platform}</TableCell>
                                <TableCell>
                                  <StatusBadge tone={campaign.statusTone}>
                                    {campaign.status}
                                  </StatusBadge>
                                </TableCell>
                                <TableCell>{campaign.performanceLabel}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCampaignId(campaign.id)}
                                  >
                                    <ChartColumnIcon data-icon="inline-start" />
                                    Snapshot
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("campaignReadiness")}</CardTitle>
                    <CardDescription>
                      Whether campaign creation can move forward from this task.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <MessageSquareIcon className="mt-0.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {task.marketing.campaignReadiness}
                      </p>
                    </div>
                    {task.marketing.sentAt ? (
                      <div className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{t("sentAt")}</span>
                        <span className="font-medium">{task.marketing.sentAt}</span>
                      </div>
                    ) : null}
                    {task.marketing.approvedAt ? (
                      <div className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{t("approvedAt")}</span>
                        <span className="font-medium">{task.marketing.approvedAt}</span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ) : null}
        </Tabs>
      </EntityDetailLayout>

      <Sheet
        open={!!selectedCampaign}
        onOpenChange={(open) => {
          if (!open) setSelectedCampaignId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl">
          {selectedCampaign ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCampaign.name}</SheetTitle>
                <SheetDescription>
                  {selectedCampaign.platform} snapshot with current performance and commercial outcome.
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 pt-0">
                <section className="grid gap-4 md:grid-cols-2">
                  {selectedCampaign.snapshot.map((item) => (
                    <Card key={item.label} size="sm">
                      <CardHeader>
                        <CardDescription>{item.label}</CardDescription>
                        <CardTitle className="text-2xl">{item.value}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{item.helper}</p>
                      </CardContent>
                    </Card>
                  ))}
                </section>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("campaignInfo")}</CardTitle>
                    <CardDescription>
                      Execution settings and current outcome for this campaign.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{t("status")}</TableCell>
                          <TableCell>
                            <StatusBadge tone={selectedCampaign.statusTone}>
                              {selectedCampaign.status}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t("owner")}</TableCell>
                          <TableCell>{selectedCampaign.owner}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t("budget")}</TableCell>
                          <TableCell>{selectedCampaign.budget}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t("spend")}</TableCell>
                          <TableCell>{selectedCampaign.spend}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t("wonPerformance")}</TableCell>
                          <TableCell>{selectedCampaign.wonValue}</TableCell>
                        </TableRow>
                        {selectedCampaign.rows.map((row) => (
                          <TableRow key={row.label}>
                            <TableCell className="font-medium">{row.label}</TableCell>
                            <TableCell>{row.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageScaffold>
  );
}
