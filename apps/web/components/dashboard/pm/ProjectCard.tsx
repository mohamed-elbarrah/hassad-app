"use client";

import Link from "next/link";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import type { Project } from "@hassad/shared";
import { ProjectStatus } from "@hassad/shared";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "DRAFT",
  [ProjectStatus.ACTIVE]: "ACTIVE",
  [ProjectStatus.ON_HOLD]: "STOPPED",
  [ProjectStatus.AWAITING_REVIEW]: "PENDING",
  [ProjectStatus.NEEDS_REVISION]: "REJECTED",
  [ProjectStatus.COMPLETED]: "COMPLETED",
  [ProjectStatus.CANCELLED]: "CANCELLED",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "تخطيط",
  [ProjectStatus.ACTIVE]: "نشط",
  [ProjectStatus.ON_HOLD]: "موقوف",
  [ProjectStatus.AWAITING_REVIEW]: "بانتظار المراجعة",
  [ProjectStatus.NEEDS_REVISION]: "مطلوب تعديلات",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغى",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectWithMeta extends Project {
  client?: { id: string; companyName: string };
  manager?: { id: string; name: string };
  _count?: { tasks: number };
}

interface ProjectCardProps {
  project: ProjectWithMeta;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectCard({ project }: ProjectCardProps) {
  const progressValue = Math.round(
    (project.progress ??
      (project as ProjectWithMeta & { completionPercentage?: number })
        .completionPercentage ??
      0),
  );

  const startDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    numberingSystem: "latn",
  }).format(new Date(project.startDate));
  const endDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    numberingSystem: "latn",
  }).format(new Date(project.endDate));

  return (
    <Link href={`/dashboard/pm/projects/${project.id}`}>
      <SurfaceCard className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold line-clamp-2">{project.name}</h3>
          <StatusBadge status={STATUS_MAP[project.status]} label={STATUS_LABELS[project.status]} className="shrink-0 text-xs" />
        </div>
        {project.client && (
          <p className="text-xs text-neutral-300 mb-3">{project.client.companyName}</p>
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
              <span>{startDate} — {endDate}</span>
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
