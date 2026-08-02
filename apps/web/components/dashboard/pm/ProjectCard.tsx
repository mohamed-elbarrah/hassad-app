"use client";

import Link from "next/link";
import { Calendar, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { formatDate } from "@/lib/format";
import type { ProjectWithMeta } from "@/lib/utils/project-status";

export function ProjectCard({ project }: { project: ProjectWithMeta }) {
  const progress = Math.round(
    project.progress ?? project.completionPercentage ?? 0,
  );
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 text-base">
            <Link
              href={`/dashboard/pm/projects/${project.id}`}
              className="hover:underline"
            >
              {project.name}
            </Link>
          </CardTitle>
          <PmStatusBadge domain="project" status={project.status} />
        </div>
        {project.client && (
          <p className="text-sm text-muted-foreground">
            {project.client.companyName}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>التقدم</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar />
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </span>
          {project.manager && (
            <span className="flex items-center gap-2">
              <Users />
              {project.manager.name}
            </span>
          )}
          {project._count !== undefined && (
            <span className="flex items-center gap-2">
              <TrendingUp />
              {project._count.tasks} مهمة
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
