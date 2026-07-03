"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { KanbanConfig, KanbanBoardProps } from "./types";
import { KanbanGroup } from "./KanbanGroup";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanStandaloneColumn } from "./KanbanStandaloneColumn";

// ─── Default loading skeleton ──────────────────────────────────────────────────

function DefaultLoadingSkeleton({ config }: { config: KanbanConfig }) {
  const hasGroups = config.groups.length > 0;

  if (hasGroups) {
    return (
      <div className="flex gap-6" dir="rtl">
        {config.groups.map((group) => (
          <div
            key={group.id}
            className="flex-1 min-w-[340px] rounded-2xl border-[1.5px] border-portal-card-border p-3 space-y-3 bg-white"
          >
            <div className="h-8 bg-white animate-pulse rounded-xl border border-portal-card-border" />
            <div className="space-y-2">
              {group.stages.map((stage) => (
                <div
                  key={stage}
                  className="h-36 bg-white animate-pulse rounded-2xl border border-portal-card-border"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6" dir="rtl">
      {config.stageOrder.map((stage) => {
        const stageConfig = config.stages[stage];
        return (
          <div
            key={stage}
            className="flex-1 min-w-[340px] rounded-2xl border-[1.5px] border-portal-card-border overflow-hidden bg-white"
          >
            <div
              className="h-10 animate-pulse"
              style={{ backgroundColor: stageConfig?.bandBg }}
            />
            <div
              className="p-3 space-y-2"
              style={{ backgroundColor: stageConfig?.surfaceBg }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white animate-pulse rounded-2xl border border-portal-card-border"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
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
  renderLoadingSkeleton,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
      const newStage = over.id as string;
      const currentStage = active.data.current?.status as string;

      if (newStage === currentStage) return;

      await onDragEnd(itemId, currentStage, newStage);
    },
    [onDragEnd],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return renderLoadingSkeleton?.() ?? <DefaultLoadingSkeleton config={config} />;
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-danger-500 font-medium">
          {errorMessage || "حدث خطأ أثناء تحميل البيانات"}
        </p>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-[1.5px] border-dashed border-portal-card-border px-6 py-4 text-center bg-white">
        <p className="text-sm font-medium text-portal-note-text">
          {emptyMessage || "لا توجد بيانات"}
        </p>
      </div>
    );
  }

  // ── Determine layout type ─────────────────────────────────────────────
  const hasGroups = config.groups.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-2 h-full" dir="rtl">
        {hasGroups
          ? renderGroupedLayout(config, itemsByStage, renderCard, canDragItem)
          : renderFlatLayout(config, itemsByStage, renderCard, canDragItem)}
      </div>

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
) {
  return config.stageOrder.map((stage) => (
    <KanbanStandaloneColumn
      key={stage}
      stage={stage}
      config={config}
      items={itemsByStage.get(stage) ?? []}
      renderCard={renderCard}
      canDragItem={canDragItem}
    />
  ));
}
