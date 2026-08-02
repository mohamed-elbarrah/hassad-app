"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KanbanConfig } from "./types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps<T extends { id: string }> {
  stage: string;
  config: KanbanConfig;
  items: T[];
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode;
  canDragItem?: (item: T) => boolean;
}

/**
 * A single stage column with a tinted header band and a tinted cards area.
 *
 * Used inside a KanbanGroup (grouped layout) or as a standalone column
 * (flat layout via KanbanStandaloneColumn).
 */
export function KanbanColumn<T extends { id: string }>({
  stage,
  config,
  items,
  renderCard,
  canDragItem,
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageConfig = config.stages[stage];

  if (!stageConfig) {
    globalThis.console.warn(`[KanbanColumn] Missing stage config for "${stage}"`);
    return null;
  }

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-full flex flex-col overflow-hidden transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-3",
          stageConfig.bandClass,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-3 shrink-0 rounded-full ring-2 ring-background",
              stageConfig.dotClass,
            )}
          />
          <h3 className="truncate text-xs font-semibold text-foreground">
            {stageConfig.label}
          </h3>
        </div>
        <Badge
          variant="secondary"
          className={cn("shrink-0 tabular-nums", stageConfig.countClass)}
        >
          {items.length}
        </Badge>
      </div>

      <CardContent
        className={cn(
          "flex min-h-20 flex-1 flex-col gap-2 p-2",
          stageConfig.surfaceClass,
        )}
      >
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            id={item.id}
            data={{ status: stage }}
            canDrag={canDragItem?.(item) ?? true}
          >
            {renderCard(item, { isOverlay: false })}
          </KanbanCard>
        ))}

        {items.length === 0 && (
          <div className="flex min-h-16 flex-1 items-center justify-center">
            <p className="select-none text-center text-xs text-muted-foreground">
              {stageConfig.emptyLabel || "لا يوجد"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
