"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { KanbanConfig } from "./types";
import { KanbanCard } from "./KanbanCard";

interface KanbanStandaloneColumnProps<T extends { id: string }> {
  stage: string;
  config: KanbanConfig;
  items: T[];
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode;
  canDragItem?: (item: T) => boolean;
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
}: KanbanStandaloneColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageConfig = config.stages[stage];

  if (!stageConfig) {
    console.warn(
      `[KanbanStandaloneColumn] Missing stage config for "${stage}"`,
    );
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[340px] flex flex-col rounded-2xl border-[1.5px] overflow-hidden bg-white transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
      style={{ borderColor: "#E1E4EA" }}
      dir="rtl"
    >
      {/* ── Header (group-style) ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1.5px solid #ECEEF2" }}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white"
          style={{ backgroundColor: stageConfig.dotColor }}
        />
        <span
          className="font-bold text-sm flex-1 truncate"
          style={{ color: "#000000" }}
        >
          {stageConfig.label}
        </span>
        <span
          className="inline-flex items-center justify-center rounded-full text-xs font-semibold tabular-nums shrink-0"
          style={{
            backgroundColor: "rgba(18, 25, 54, 0.05)",
            color: "#121936",
            minWidth: 28,
            height: 24,
            padding: "0 10px",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* ── Cards Area (tinted) ────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 p-3 overflow-y-auto flex-1 min-h-0"
        style={{ backgroundColor: stageConfig.surfaceBg }}
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
