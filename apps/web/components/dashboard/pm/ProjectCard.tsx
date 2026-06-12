"use client";

import Link from "next/link";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/format";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import {
  PROJECT_STATUS_BADGE_KEY,
  PROJECT_STATUS_LABELS,
  type ProjectWithMeta,
} from "@/lib/utils/project-status";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectWithMeta;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectCard({ project }: ProjectCardProps) {
  const progressValue = Math.round(
    project.progress ?? project.completionPercentage ?? 0,
  );

  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate);

  return (
    <Link href={`/dashboard/pm/projects/${project.id}`}>
      <SurfaceCard className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold line-clamp-2">
            {project.name}
          </h3>
          <StatusBadge
            status={PROJECT_STATUS_BADGE_KEY[project.status]}
            label={PROJECT_STATUS_LABELS[project.status]}
            className="shrink-0 text-xs"
          />
        </div>
        {project.client && (
          <p className="text-xs text-neutral-300 mb-3">
            {project.client.companyName}
          </p>
        )}
        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-300 mb-1">
              <span>التقدم</span>
              <span>{progressValue}%</span>
            </div>
            <ProgressBar value={progressValue} variant="default" size="sm" />
          </div>

          {/* Meta info */}
          <div className="flex flex-col gap-1.5 text-xs text-neutral-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>
                {startDate} — {endDate}
              </span>
            </div>
            {project.manager && (
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0" />
                <span>{project.manager.name}</span>
              </div>
            )}
            {project._count !== undefined && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 shrink-0" />
                <span>{project._count.tasks} مهمة</span>
              </div>
            )}
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}
