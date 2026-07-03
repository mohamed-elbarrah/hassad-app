"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";
import { formatDate } from "@/lib/format";
import type { ProjectWithMeta } from "@/lib/utils/project-status";
import { PROJECT_STATUS_COLOR } from "@/lib/utils/project-status";

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
  const statusColor = PROJECT_STATUS_COLOR[project.status as ProjectStatus];

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
        "group bg-white rounded-2xl border border-portal-card-border p-4 cursor-grab active:cursor-grabbing transition-all duration-150",
        "hover:border-secondary-500/20 hover:shadow-sm",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
        isOverlay && "shadow-lg border-natural-100",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1 min-w-0 text-natural-100">
          {project.name}
        </p>
        <GripVertical className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity text-portal-note-text" />
      </div>

      {project.client?.companyName && (
        <Link
          href={`/dashboard/sales/clients/${project.client.id}`}
          className="flex items-center gap-1 mt-2 group/client"
          onClick={(e) => e.stopPropagation()}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0 text-portal-note-text" />
          <span className="text-xs truncate text-portal-note-text group-hover/client:text-primary group-hover/client:underline">
            {project.client.companyName}
          </span>
        </Link>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-portal-note-text">التقدم</span>
          <span className="text-natural-100 font-semibold">
            {progressValue}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-badge-gray-bg">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressValue}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-portal-note-text">
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>
          {startDate} - {endDate}
        </span>
      </div>
    </div>
  );
}