"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { Building2, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";

interface ProjectKanbanItem {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string | Date;
  endDate: string | Date;
  progress?: number;
  completionPercentage?: number;
  client?: { id: string; companyName: string };
}

interface ProjectKanbanCardProps {
  project: ProjectKanbanItem;
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

  function onOpen() {
    if (isDragging) return;
    router.push(`/dashboard/pm/projects/${project.id}`);
  }

  const startDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    numberingSystem: "latn",
  }).format(new Date(project.startDate));

  const endDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    numberingSystem: "latn",
  }).format(new Date(project.endDate));

  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      className={cn(
        "bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-sm transition-all duration-100",
        (isDragging || isOverlay) && "opacity-50 shadow-xl rotate-1 scale-105",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1 min-w-0">
          {project.name}
        </p>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      {project.client?.companyName && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{project.client.companyName}</span>
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>التقدم</span>
          <span>{progressValue}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 shrink-0" />
        <span>
          {startDate} - {endDate}
        </span>
      </div>
    </div>
  );
}
