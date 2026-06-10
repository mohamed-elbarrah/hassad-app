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
  dotColor: string;
  projects: ProjectKanbanItem[];
}

export function ProjectKanbanColumn({
  status,
  label,
  dotColor,
  projects,
}: ProjectKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-xl flex flex-col transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      <div className="flex items-center gap-2 justify-between px-1 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <h3
            className="text-xs font-semibold truncate"
            style={{ color: "#000000" }}
          >
            {label}
          </h3>
        </div>
        <span
          className="text-xs font-medium rounded-full shrink-0 tabular-nums"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            color: "#A8ABB2",
            padding: "2px 8px",
          }}
        >
          {projects.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 min-h-20 flex-1">
        {projects.map((project) => (
          <ProjectKanbanCard key={project.id} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-16">
            <p
              className="text-xs text-center select-none"
              style={{ color: "#A8ABB2" }}
            >
              لا يوجد مشاريع
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
