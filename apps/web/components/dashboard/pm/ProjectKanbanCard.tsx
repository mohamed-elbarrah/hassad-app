"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { Building2, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { ProjectWithMeta } from "@/lib/utils/project-status";
import { PROJECT_STATUS_TONES } from "@/lib/utils/project-status";
import { Badge } from "@/components/ui/badge";

interface ProjectKanbanCardProps {
  project: ProjectWithMeta;
  isOverlay?: boolean;
}

export function ProjectKanbanCard({
  project,
  isOverlay = false,
}: ProjectKanbanCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    data: { status: project.status },
  });

  const progressValue = Math.round(
    project.progress ?? project.completionPercentage ?? 0,
  );
  const statusTone = PROJECT_STATUS_TONES[project.status];

  function onOpen() {
    if (isDragging) return;
    router.push(`/dashboard/pm/projects/${project.id}`);
  }

  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate);

  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      className={cn(
        "group cursor-grab rounded-lg border bg-card p-4 transition-all duration-150 active:cursor-grabbing hover:border-secondary-500/20 hover:shadow-sm",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
        isOverlay && "border-border shadow-lg",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 min-w-0 text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {project.name}
        </p>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-40 text-muted-foreground" />
      </div>

      {project.client?.companyName && (
        <span className="mt-2 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs text-muted-foreground">
            {project.client.companyName}
          </span>
        </span>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">التقدم</span>
          <Badge variant="secondary" className="font-semibold tabular-nums">
            {progressValue}%
          </Badge>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", statusTone.fillClass)}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>
          {startDate} - {endDate}
        </span>
      </div>
    </div>
  );
}
