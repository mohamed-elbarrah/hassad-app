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
        "group bg-white rounded-2xl border-[1.5px] border-portal-card-border p-4 cursor-grab active:cursor-grabbing transition-all duration-150",
        "hover:border-secondary-500/20",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
      )}
      style={
        isOverlay
          ? {
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
              borderColor: "#121936",
            }
          : undefined
      }
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2 flex-1 min-w-0"
          style={{ color: "#000000" }}
        >
          {project.name}
        </p>
        <GripVertical
          className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#A8ABB2" }}
        />
      </div>

      {project.client?.companyName && (
        <div className="flex items-center gap-1 mt-2">
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
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "#A8ABB2" }}>التقدم</span>
          <span style={{ color: "#121936", fontWeight: 600 }}>
            {progressValue}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "#F5F7FA" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressValue}%`,
              backgroundColor: "#121936",
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs">
        <Calendar
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "#A8ABB2" }}
        />
        <span style={{ color: "#A8ABB2" }}>
          {startDate} - {endDate}
        </span>
      </div>
    </div>
  );
}
