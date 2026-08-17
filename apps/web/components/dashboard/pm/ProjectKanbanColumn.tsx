"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/utils/project-status";
import type { ProjectWithMeta } from "@/lib/utils/project-status";
import { ProjectKanbanCard } from "./ProjectKanbanCard";

interface ProjectKanbanColumnProps {
  status: ProjectStatus;
  projects: ProjectWithMeta[];
}

export function ProjectKanbanColumn({
  status,
  projects,
}: ProjectKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const tone = PROJECT_STATUS_TONES[status];

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2",
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 px-3 py-3", tone.bandClass)}>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background",
              tone.dotClass,
            )}
          />
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-foreground">
            {PROJECT_STATUS_LABELS[status]}
          </span>
        </div>
        <Badge
          variant="secondary"
          className={cn("shrink-0 tabular-nums", tone.countClass)}
        >
          {projects.length}
        </Badge>
      </div>

      <Separator />

      <CardContent className={cn("flex min-h-32 flex-1 flex-col gap-2 p-3", tone.surfaceClass)}>
        {projects.map((project) => (
          <ProjectKanbanCard key={project.id} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-center text-xs text-muted-foreground">
              لا يوجد مشاريع
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
