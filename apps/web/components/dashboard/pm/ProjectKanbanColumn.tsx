"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";
import { ProjectKanbanCard } from "./ProjectKanbanCard";

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

interface ProjectKanbanColumnProps {
  status: ProjectStatus;
  label: string;
  colorClass: string;
  dotClass: string;
  projects: ProjectKanbanItem[];
}

export function ProjectKanbanColumn({
  status,
  label,
  colorClass,
  dotClass,
  projects,
}: ProjectKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-xl border-2 flex flex-col transition-all duration-150",
        colorClass,
        isOver && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
      )}
    >
      <div className="px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", dotClass)} />
            <h3 className="text-xs font-semibold text-foreground truncate">
              {label}
            </h3>
          </div>
          <span className="text-xs font-medium bg-background/70 px-2 py-0.5 rounded-full text-muted-foreground shrink-0 tabular-nums">
            {projects.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2 min-h-28 flex-1">
        {projects.map((project) => (
          <ProjectKanbanCard key={project.id} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-20">
            <p className="text-xs text-muted-foreground/60 text-center select-none">
              لا يوجد مشاريع
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
