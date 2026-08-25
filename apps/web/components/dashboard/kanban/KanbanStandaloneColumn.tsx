"use client";

import { useDroppable } from "@dnd-kit/core";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { KanbanConfig, KanbanStagePagination } from "./types";
import { KanbanCard } from "./KanbanCard";

interface KanbanStandaloneColumnProps<T extends { id: string }> {
  stage: string;
  config: KanbanConfig;
  items: T[];
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode;
  canDragItem?: (item: T) => boolean;
  activeItem: T | null;
  canDropItem?: (item: T, destinationStage: string) => boolean;
  stagePagination?: KanbanStagePagination;
}

/**
 * Standalone column for the flat layout (no groups).
 *
 * Visually matches the group container (rounded-2xl border, white bg)
 * but with a stage-specific header (dot + label + count) and a tinted
 * cards area.  The entire container is the droppable target.
 */
export function KanbanStandaloneColumn<T extends { id: string }>({
  stage,
  config,
  items,
  renderCard,
  canDragItem,
  activeItem,
  canDropItem,
  stagePagination,
}: KanbanStandaloneColumnProps<T>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !stagePagination?.hasMore || stagePagination.isLoading) return;
    if (content.scrollHeight <= content.clientHeight) stagePagination.onLoadMore();
  }, [items.length, stagePagination]);
  const isDropAllowed =
    !activeItem || !canDropItem || canDropItem(activeItem, stage);
  const stageConfig = config.stages[stage];

  if (!stageConfig) {
    globalThis.console.warn(
      `[KanbanStandaloneColumn] Missing stage config for "${stage}"`,
    );
    return null;
  }

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex min-w-[340px] flex-1 flex-col overflow-hidden transition-all duration-150",
        activeItem && !isDropAllowed && "opacity-50",
        activeItem && isDropAllowed && "ring-1 ring-primary/20",
        isOver && isDropAllowed && "ring-2 ring-primary/60 ring-offset-1",
      )}
      dir="rtl"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-3 shrink-0 rounded-full ring-2 ring-background",
              stageConfig.dotClass,
            )}
          />
          <CardTitle className="min-w-0 truncate text-sm font-semibold">
            {stageConfig.label}
          </CardTitle>
        </div>
        <Badge
          variant="secondary"
          className={cn("shrink-0 tabular-nums", stageConfig.countClass)}
        >
          {items.length}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent
        ref={contentRef}
        aria-busy={stagePagination?.isLoading || undefined}
        onScroll={(event) => {
          if (!stagePagination?.hasMore || stagePagination.isLoading) return;
          const target = event.currentTarget;
          if (target.scrollHeight - target.scrollTop - target.clientHeight < 80) {
            stagePagination.onLoadMore();
          }
        }}
        className={cn(
          "flex max-h-[calc(100vh-18rem)] flex-col gap-2 overflow-y-auto p-2.5",
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
          <div className="flex flex-1 items-center justify-center min-h-16">
            <p className="text-center text-[11px] text-muted-foreground select-none">
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
