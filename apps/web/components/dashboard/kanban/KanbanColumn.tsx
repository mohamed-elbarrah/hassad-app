"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
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
    console.warn(`[KanbanColumn] Missing stage config for "${stage}"`);
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full rounded-xl flex flex-col transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      {/* ── Tinted Header Band ─────────────────────────────────────── */}
      <div
        className="flex w-full rounded-t-lg items-center gap-2 justify-between px-2 py-2.5"
        style={{ backgroundColor: stageConfig.bandBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white"
            style={{ backgroundColor: stageConfig.dotColor }}
          />
          <h3
            className="text-xs font-bold truncate"
            style={{ color: "#121936" }}
          >
            {stageConfig.label}
          </h3>
        </div>
        <span
          className="text-xs font-bold rounded-full shrink-0 tabular-nums inline-flex items-center justify-center"
          style={{
            backgroundColor: stageConfig.countBg,
            color: stageConfig.countText,
            padding: "2px 8px",
            minWidth: 24,
            height: 20,
          }}
        >
          {items.length}
        </span>
      </div>

      {/* ── Cards Area ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 rounded-b-lg min-h-20 flex-1 p-2"
        style={{
          backgroundColor: stageConfig.surfaceBg,
        }}
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
          <div className="flex items-center justify-center flex-1 min-h-16">
            <p
              className="text-xs text-center select-none"
              style={{ color: "#A8ABB2" }}
            >
              {stageConfig.emptyLabel || "لا يوجد"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
