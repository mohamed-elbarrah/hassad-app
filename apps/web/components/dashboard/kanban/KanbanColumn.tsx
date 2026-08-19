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
  activeItem: T | null;
  canDropItem?: (item: T, destinationStage: string) => boolean;
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
  activeItem,
  canDropItem,
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const isDropAllowed =
    !activeItem || !canDropItem || canDropItem(activeItem, stage);
  const stageConfig = config.stages[stage];

  if (!stageConfig) {
    globalThis.console.warn(
      `[KanbanColumn] Missing stage config for "${stage}"`,
    );
    return null;
  }

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-full flex flex-col overflow-hidden transition-all duration-150",
        activeItem && !isDropAllowed && "opacity-50",
        activeItem && isDropAllowed && "ring-1 ring-primary/20",
        isOver && isDropAllowed && "ring-2 ring-primary/60 ring-offset-1",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between gap-2 px-2.5 py-2",
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
          "flex min-h-14 max-h-[calc(100vh-18rem)] flex-col gap-2 overflow-y-auto p-1.5",
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
          <div className="flex min-h-10 items-center justify-center rounded-md border border-dashed border-border/70">
            <p className="select-none text-center text-[11px] text-muted-foreground">
              {activeItem
                ? isDropAllowed
                  ? "إفلات هنا"
                  : "غير متاح"
                : stageConfig.emptyLabel || "لا يوجد"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
