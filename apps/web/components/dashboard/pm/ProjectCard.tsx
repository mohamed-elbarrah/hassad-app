"use client";

import Link from "next/link";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@hassad/shared";
import { ProjectStatus } from "@hassad/shared";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [ProjectStatus.PLANNING]: { label: "تخطيط", variant: "secondary" },
  [ProjectStatus.ACTIVE]: { label: "نشط", variant: "default" },
  [ProjectStatus.ON_HOLD]: { label: "موقوف", variant: "outline" },
  [ProjectStatus.COMPLETED]: { label: "مكتمل", variant: "secondary" },
  [ProjectStatus.CANCELLED]: { label: "ملغى", variant: "destructive" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectWithMeta extends Project {
  client?: { id: string; name: string };
  manager?: { id: string; name: string };
  _count?: { tasks: number };
}

interface ProjectCardProps {
  project: ProjectWithMeta;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status];

  const startDate = new Date(project.startDate).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(project.endDate).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/dashboard/pm/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {project.name}
            </CardTitle>
            <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
              {statusConfig.label}
            </Badge>
          </div>
          {project.client && (
            <CardDescription className="text-xs">
              {project.client.name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>التقدم</span>
              <span>{Math.round(project.progress ?? 0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.round(project.progress ?? 0)}%` }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </Link>
  );
}
