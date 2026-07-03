"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Calendar, GripVertical } from "lucide-react";
import { ProjectStatus } from "@hassad/shared";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_COLOR } from "@/lib/utils/project-status";
import type { ProjectWithMeta } from "@/lib/utils/project-status";

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
  const router = useRouter();

  const progressValue = Math.round(
    project.progress ?? project.completionPercentage ?? 0,
  );
  const statusColor =
    PROJECT_STATUS_COLOR[project.status as ProjectStatus];

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/dashboard/pm/projects/${project.id}`);
  }

  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate);

  return (
    <div onClick={handleClick}>
      {/* ── Header: Name + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1 min-w-0">
          {project.name}
        </p>
        <GripVertical
          className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#A8ABB2" }}
        />
      </div>

      {/* ── Client ────────────────────────────────────────────────── */}
      {project.client?.companyName && (
        <Link
          href={`/dashboard/sales/clients/${project.client.id}`}
          className="flex items-center gap-1 mt-2 group/client"
          onClick={(e) => e.stopPropagation()}
        >
          <Building2
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "#A8ABB2" }}
          />
          <span
            className="text-xs truncate"
            style={{ color: "#A8ABB2" }}
          >
            {project.client.companyName}
          </span>
        </Link>
      )}

      {/* ── Progress Bar ─────────────────────────────────────────── */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "#A8ABB2" }}>التقدم</span>
          <span className="font-semibold" style={{ color: "#000000" }}>
            {progressValue}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressValue}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>

      {/* ── Date Range ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: "#A8ABB2" }}>
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>
          {startDate} - {endDate}
        </span>
      </div>
    </div>
  );
}
