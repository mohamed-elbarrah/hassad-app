"use client";

import { useDroppable } from "@dnd-kit/core";
import { PipelineStage } from "@hassad/shared";
import type { Client } from "@hassad/shared";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  stage: PipelineStage;
  label: string;
  colorClass: string;
  clients: Client[];
}

export function KanbanColumn({
  stage,
  label,
  colorClass,
  clients,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-64 shrink-0 rounded-lg border-2 flex flex-col transition-colors duration-150",
        colorClass,
        isOver && "ring-2 ring-primary ring-offset-1",
      )}
    >
      <div className="px-3 py-2 border-b border-inherit">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <span className="text-xs font-medium bg-background/60 px-2 py-0.5 rounded-full text-muted-foreground">
            {clients.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2 min-h-32 flex-1">
        {clients.map((client) => (
          <KanbanCard key={client.id} client={client} />
        ))}
        {clients.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-6 select-none">
            لا يوجد عملاء
          </p>
        )}
      </div>
    </div>
  );
}
