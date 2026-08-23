"use client";

import Link from "next/link";
import { Building2, Calendar, GripVertical } from "lucide-react";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_TONES } from "@/lib/utils/project-status";
import type { ProjectWithMeta } from "@/lib/utils/project-status";
import { cn } from "@/lib/utils";

interface ProjectKanbanCardContentProps {
  project: ProjectWithMeta;
}

/**
 * Card content for the project status kanban.
 *
 * Renders project name, client, progress bar, and date range.
 */
export function ProjectKanbanCardContent({
  project,
}: ProjectKanbanCardContentProps) {
  const progressValue = Math.round(
    project.progress ?? project.completionPercentage ?? 0,
  );
  const statusTone = PROJECT_STATUS_TONES[project.status];

  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate);

  return (
    <Link
      href={`/dashboard/pm/projects/${project.id}`}
      className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* ── Header: Name + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 min-w-0 text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {project.name}
        </p>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-40 text-muted-foreground" />
      </div>

      {/* ── Client ────────────────────────────────────────────────── */}
      {project.client?.companyName && (
        <span className="mt-2 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs text-muted-foreground">
            {project.client.companyName}
          </span>
        </span>
      )}

      {/* ── Progress Bar ─────────────────────────────────────────── */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">التقدم</span>
          <span className="font-semibold text-foreground">{progressValue}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", statusTone.fillClass)}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      {/* ── Date Range ────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>
          {startDate} - {endDate}
        </span>
      </div>
    </Link>
  );
}
