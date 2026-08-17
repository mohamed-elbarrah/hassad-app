"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRightIcon, FolderKanbanIcon, RefreshCcwIcon } from "lucide-react";

import { GroupedKanbanBoard, type KanbanLane } from "@/components/patterns/grouped-kanban-board";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";
import { StatusBadge, type StatusTone } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { useGetPmProjectsQuery } from "@/lib/api/pm-projects-api";
import { ProjectStatus, TaskPriority } from "@hassad/shared";

const statusLabel: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "Planning",
  [ProjectStatus.PENDING_ACTIVATION]: "Pending activation",
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.ON_HOLD]: "On hold",
  [ProjectStatus.AWAITING_REVIEW]: "Awaiting review",
  [ProjectStatus.NEEDS_REVISION]: "Needs revision",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.CANCELLED]: "Cancelled",
};

const statusTone: Record<ProjectStatus, StatusTone> = {
  [ProjectStatus.PLANNING]: "neutral",
  [ProjectStatus.PENDING_ACTIVATION]: "attention",
  [ProjectStatus.ACTIVE]: "active",
  [ProjectStatus.ON_HOLD]: "warning",
  [ProjectStatus.AWAITING_REVIEW]: "warning",
  [ProjectStatus.NEEDS_REVISION]: "destructive",
  [ProjectStatus.COMPLETED]: "success",
  [ProjectStatus.CANCELLED]: "destructive",
};

const laneGroups: Array<{
  id: string;
  title: string;
  tone: StatusTone;
  statuses: ProjectStatus[];
}> = [
  {
    id: "preparation",
    title: "Preparation",
    tone: "neutral",
    statuses: [ProjectStatus.PLANNING, ProjectStatus.PENDING_ACTIVATION],
  },
  {
    id: "delivery",
    title: "Delivery",
    tone: "active",
    statuses: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
  },
  {
    id: "review",
    title: "Review",
    tone: "warning",
    statuses: [ProjectStatus.AWAITING_REVIEW, ProjectStatus.NEEDS_REVISION],
  },
  {
    id: "closed",
    title: "Closed",
    tone: "success",
    statuses: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
  },
];

function priorityLabel(priority: TaskPriority) {
  switch (priority) {
    case TaskPriority.LOW:
      return "Low";
    case TaskPriority.NORMAL:
      return "Normal";
    case TaskPriority.HIGH:
      return "High";
    case TaskPriority.URGENT:
      return "Urgent";
  }
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function PmProjectsWorkspace() {
  const { data, isLoading, isError, refetch } = useGetPmProjectsQuery();
  const projects = data?.items ?? [];

  const lanes = useMemo<KanbanLane<(typeof projects)[number]>[]>(() => {
    return laneGroups.map((group) => ({
      id: group.id,
      title: group.title,
      tone: group.tone,
      sections: group.statuses.map((status) => ({
        id: status,
        title: statusLabel[status],
        tone: statusTone[status],
        items: projects.filter((project) => project.status === status),
        emptyLabel: `No projects in ${statusLabel[status].toLowerCase()}.`,
      })),
    }));
  }, [projects]);

  if (isLoading && projects.length === 0) {
    return <ScreenPlaceholder label="Loading PM projects" />;
  }

  if (isError && projects.length === 0) {
    return (
      <PageScaffold
        title="PM Projects"
        description="Kanban view for projects owned by the current project manager."
        actions={
          <Button type="button" variant="outline" onClick={() => refetch()}>
            <RefreshCcwIcon data-icon="inline-start" />
            Retry
          </Button>
        }
      >
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanbanIcon />
            </EmptyMedia>
            <EmptyTitle>Unable to load projects</EmptyTitle>
            <EmptyDescription>
              We could not fetch the PM project board right now.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Empty>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="PM Projects"
      description="Kanban view for projects owned by the current project manager."
      actions={
        <Button type="button" variant="outline" onClick={() => refetch()}>
          <RefreshCcwIcon data-icon="inline-start" />
          Refresh
        </Button>
      }
    >
      <Card className="border-dashed bg-muted/10 p-3">
        <GroupedKanbanBoard
          lanes={lanes}
          emptyState={
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanbanIcon />
                </EmptyMedia>
                <EmptyTitle>No projects found</EmptyTitle>
                <EmptyDescription>
                  There are no PM-owned projects to display.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
          renderCard={(project) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{project.clientName}</p>
                </div>
                <StatusBadge tone={statusTone[project.status]}>{statusLabel[project.status]}</StatusBadge>
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Manager: {project.projectManager?.name ?? "—"}</span>
                <span>
                  {formatDateLabel(project.startDate)} - {formatDateLabel(project.endDate)}
                </span>
                <span>
                  {priorityLabel(project.priority)} priority · {project.taskCount} tasks · {project.overdueTaskCount} overdue
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{project.completionPercentage}% complete</span>
                  <span className="text-muted-foreground">{project.activeTaskCount} active tasks</span>
                </div>
                <Progress value={project.completionPercentage} />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/pm/projects/${project.id}`} />}
              >
                <ArrowRightIcon data-icon="inline-start" />
                Detail
              </Button>
            </div>
          )}
        />
      </Card>
    </PageScaffold>
  );
}
