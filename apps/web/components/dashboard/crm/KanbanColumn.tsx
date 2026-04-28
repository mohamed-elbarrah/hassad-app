"use client";

import { useDroppable } from "@dnd-kit/core";
import { PipelineStage } from "@hassad/shared";
import type { LeadListItem } from "@/features/leads/leadsApi";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  stage: PipelineStage;
  label: string;
  /** Header bg + border color classes (e.g. "bg-blue-50 border-blue-200") */
  colorClass: string;
  /** Dot/badge color class (e.g. "bg-blue-400") */
  dotClass: string;
  clients: LeadListItem[];
}

export function KanbanColumn({
  stage,
  label,
  colorClass,
  dotClass,
  clients,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-xl border-2 flex flex-col transition-all duration-150",
        colorClass,
        isOver && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
      )}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", dotClass)} />
            <h3 className="text-xs font-semibold text-foreground truncate">
              {label}
            </h3>
          </div>
          <span className="text-xs font-medium bg-background/70 px-2 py-0.5 rounded-full text-muted-foreground shrink-0 tabular-nums">
            {clients.length}
          </span>
        </div>
      </div>

      {/* Cards area */}
      <div className="flex flex-col gap-2 p-2 min-h-28 flex-1">
        {clients.map((client) => (
          <KanbanCard key={client.id} client={client} />
        ))}
        {clients.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-20">
            <p className="text-xs text-muted-foreground/60 text-center select-none">
              لا يوجد عملاء
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
