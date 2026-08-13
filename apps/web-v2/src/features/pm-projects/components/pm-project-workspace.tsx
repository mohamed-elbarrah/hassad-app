"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarPlusIcon, FileUpIcon, MessageSquareMoreIcon, PencilLineIcon } from "lucide-react";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { EntityTimeline } from "@/components/patterns/entity-timeline";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectDetailRecord } from "@/features/projects/lib/project-detail";

type PmProjectWorkspaceProps = {
  project: ProjectDetailRecord;
};

function summarizeProject(project: ProjectDetailRecord) {
  const activeTasks = project.taskRows.filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS" || task.status === "IN_REVIEW" || task.status === "REVISION").length;
  const overdueTasks = project.taskRows.filter((task) => task.dueOffsetDays < 0 && task.status !== "DONE").length;
  return { activeTasks, overdueTasks };
}

export function PmProjectWorkspace({ project }: PmProjectWorkspaceProps) {
  const [tab, setTab] = useState("overview");
  const stats = useMemo(() => summarizeProject(project), [project]);
  const hasPeriods = project.periods.length > 0;

  return (
    <PageScaffold
      title={project.name}
      description={`PM workspace for ${project.clientName}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm">
            <PencilLineIcon data-icon="inline-start" />
            Assign task
          </Button>
          <Button type="button" variant="outline" size="sm">
            <CalendarPlusIcon data-icon="inline-start" />
            Schedule meeting
          </Button>
          <Button type="button" variant="outline" size="sm">
            <FileUpIcon data-icon="inline-start" />
            Upload file
          </Button>
          <Button type="button" variant="outline" size="sm">
            <MessageSquareMoreIcon data-icon="inline-start" />
            Add note
          </Button>
        </div>
      }
    >
      <EntityDetailLayout
        sidebar={
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{project.clientName}</CardTitle>
                <CardDescription>{project.projectManager}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <StatusBadge tone={project.statusTone}>{project.status}</StatusBadge>
                <StatusBadge tone={project.healthTone}>{project.healthLabel}</StatusBadge>
                <div className="text-sm text-muted-foreground">{project.modelLabel}</div>
                <div className="text-sm text-muted-foreground">{project.timelineLabel}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <MetricTile label="Tasks" value={String(project.taskRows.length)} description="All project tasks." />
                <MetricTile label="Active" value={String(stats.activeTasks)} description="Open delivery work." />
                <MetricTile label="Overdue" value={String(stats.overdueTasks)} description="Work past due date." />
                <MetricTile label="Files" value={String(project.fileRows.length)} description="Project attachments." />
              </CardContent>
            </Card>
          </div>
        }
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            {hasPeriods ? <TabsTrigger value="periods">Periods</TabsTrigger> : null}
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {project.metrics.map((metric) => (
                <MetricTile key={metric.label} {...metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Assign and track delivery work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.taskRows.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.department} · {task.periodLabel} · {task.dueDateLabel}</div>
                    </div>
                    <StatusBadge tone={task.signalTone}>{task.signalLabel}</StatusBadge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.meetingRows.map((meeting) => (
                  <div key={meeting.id} className="rounded-md border p-3">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-xs text-muted-foreground">{meeting.date} · {meeting.owner}</div>
                    <div className="text-sm">{meeting.note}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.fileRows.map((file) => (
                  <div key={file.id} className="rounded-md border p-3">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.type} · {file.uploadedAt} · {file.uploadedBy}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {hasPeriods ? (
            <TabsContent value="periods">
              <Card>
                <CardHeader>
                  <CardTitle>Periods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.periods.map((period) => (
                    <div key={period.id} className="rounded-md border p-3">
                      <div className="font-medium">{period.label}</div>
                      <div className="text-xs text-muted-foreground">{period.windowShort}</div>
                      <div className="text-sm">{period.focus}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          <TabsContent value="activity">
            <EntityTimeline items={project.historyRows} />
          </TabsContent>
        </Tabs>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
