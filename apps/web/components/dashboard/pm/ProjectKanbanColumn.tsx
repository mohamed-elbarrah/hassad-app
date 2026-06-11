"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";
import type { ProjectWithMeta } from "@/lib/utils/project-status";
import { ProjectKanbanCard } from "./ProjectKanbanCard";

interface ProjectKanbanColumnProps {
  status: ProjectStatus;
  color: string;
  projects: ProjectWithMeta[];
}

export function ProjectKanbanColumn({
  status,
  color,
  projects,
}: ProjectKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  // Create light tint color (5% opacity) for column background
  const tintColor = `${color}0D`; // 0D = ~5% opacity in hex

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 flex flex-col rounded-xl border transition-all duration-150",
        isOver && "ring-2 ring-offset-2",
        isOver && "ring-[var(--status-color)]"
      )}
      style={{
        "--status-color": color,
        backgroundColor: tintColor,
        borderColor: `${color}33`, // 20% opacity border
      } as React.CSSProperties}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b"
        style={{ borderColor: `${color}26` }} // 15% opacity
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
          {PROJECT_STATUS_LABELS[status]}
        </span>
        <span
          className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full border"
          style={{
            color: color,
            backgroundColor: `${color}1A`, // 10% opacity
            borderColor: `${color}33`, // 20% opacity
          }}
        >
          {projects.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col gap-2 p-3 min-h-32">
        {projects.map((project) => (
          <ProjectKanbanCard key={project.id} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-neutral-400 text-center">
              لا يوجد مشاريع
            </p>
          </div>
        )}
      </div>
    </div>
  );
}