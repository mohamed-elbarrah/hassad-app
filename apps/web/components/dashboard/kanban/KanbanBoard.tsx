"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { KanbanConfig, KanbanBoardProps } from "./types";
import { KanbanGroup } from "./KanbanGroup";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanStandaloneColumn } from "./KanbanStandaloneColumn";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

// ─── Default loading skeleton ──────────────────────────────────────────────────

function DefaultLoadingSkeleton({ config }: { config: KanbanConfig }) {
  const hasGroups = config.groups.length > 0;

  if (hasGroups) {
    return (
      <ScrollArea className="w-full">
        <div className="flex min-w-max gap-4 p-1" dir="rtl">
          {config.groups.map((group) => (
            <Card
              key={group.id}
              className="flex min-w-[340px] flex-1 flex-col overflow-hidden"
            >
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-3 p-3">
                {group.stages.map((stage) => (
                  <div
                    key={stage}
                    className="h-36 rounded-2xl border bg-muted/30"
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex min-w-max gap-4 p-1" dir="rtl">
        {config.stageOrder.map((stage) => {
          return (
            <Card
              key={stage}
              className="flex min-w-[340px] flex-1 flex-col overflow-hidden"
            >
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl border bg-muted/30"
                  />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// ─── Board component ─────────────────────────────────────────────────────────

export function KanbanBoard<T extends { id: string }>({
  config,
  items,
  getItemStage,
  renderCard,
  onDragEnd,
  isLoading,
  isError,
  errorMessage,
  emptyMessage,
  canDragItem,
  canDropItem,
  onInvalidDrop,
  renderLoadingSkeleton,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Group items by stage ──────────────────────────────────────────────
  const itemsByStage = useMemo(() => {
    const map = new Map<string, T[]>();
    config.stageOrder.forEach((stage) => map.set(stage, []));
    items.forEach((item) => {
      const stage = getItemStage(item);
      const existing = map.get(stage);
      if (existing) {
        map.set(stage, [...existing, item]);
      }
    });
    return map;
  }, [items, getItemStage, config.stageOrder]);

  // ── Drag handlers ─────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const itemId = event.active.id as string;
      const item = items.find((i) => i.id === itemId) ?? null;
      setActiveItem(item);
    },
    [items],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);
      if (!over) return;

      const itemId = active.id as string;
      const item = items.find((candidate) => candidate.id === itemId);
      const newStage = over.id as string;
      const currentStage = active.data.current?.status as string;

      if (!item || newStage === currentStage) return;
      if (canDropItem && !canDropItem(item, newStage)) {
        onInvalidDrop?.(item, newStage);
        return;
      }

      await onDragEnd(itemId, currentStage, newStage);
    },
    [canDropItem, items, onDragEnd, onInvalidDrop],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      renderLoadingSkeleton?.() ?? <DefaultLoadingSkeleton config={config} />
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (isError) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>تعذر تحميل البيانات</EmptyTitle>
              <EmptyDescription>
                {errorMessage || "حدث خطأ أثناء تحميل البيانات"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد بيانات</EmptyTitle>
              <EmptyDescription>
                {emptyMessage || "لا توجد بيانات"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  // ── Determine layout type ─────────────────────────────────────────────
  const hasGroups = config.groups.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveItem(null)}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex min-w-max gap-4 pb-2 pt-1" dir="rtl">
          {hasGroups
            ? renderGroupedLayout(
                config,
                itemsByStage,
                renderCard,
                canDragItem,
                activeItem,
                canDropItem,
              )
            : renderFlatLayout(
                config,
                itemsByStage,
                renderCard,
                canDragItem,
                activeItem,
                canDropItem,
              )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeItem ? renderCard(activeItem, { isOverlay: true }) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Grouped layout renderer ─────────────────────────────────────────────────

function renderGroupedLayout<T extends { id: string }>(
  config: KanbanConfig,
  itemsByStage: Map<string, T[]>,
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode,
  canDragItem?: (item: T) => boolean,
  activeItem: T | null = null,
  canDropItem?: (item: T, destinationStage: string) => boolean,
) {
  return config.groups.map((group) => {
    const groupCount = group.stages.reduce(
      (sum, stage) => sum + (itemsByStage.get(stage)?.length ?? 0),
      0,
    );

    return (
      <KanbanGroup key={group.id} label={group.label} totalCount={groupCount}>
        {group.stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            config={config}
            items={itemsByStage.get(stage) ?? []}
            renderCard={renderCard}
            canDragItem={canDragItem}
            activeItem={activeItem}
            canDropItem={canDropItem}
          />
        ))}
      </KanbanGroup>
    );
  });
}

// ─── Flat layout renderer ────────────────────────────────────────────────────

function renderFlatLayout<T extends { id: string }>(
  config: KanbanConfig,
  itemsByStage: Map<string, T[]>,
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode,
  canDragItem?: (item: T) => boolean,
  activeItem: T | null = null,
  canDropItem?: (item: T, destinationStage: string) => boolean,
) {
  return config.stageOrder.map((stage) => (
    <KanbanStandaloneColumn
      key={stage}
      stage={stage}
      config={config}
      items={itemsByStage.get(stage) ?? []}
      renderCard={renderCard}
      canDragItem={canDragItem}
      activeItem={activeItem}
      canDropItem={canDropItem}
    />
  ));
}
