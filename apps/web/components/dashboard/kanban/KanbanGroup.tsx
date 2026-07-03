"use client";

import { cn } from "@/lib/utils";

interface KanbanGroupProps {
  label: string;
  totalCount: number;
  children: React.ReactNode;
}

/**
 * Group wrapper used in the grouped layout (e.g. sales pipeline).
 *
 * Renders a rounded-2xl container with a header showing the group label
 * and total item count, and a scrollable body for the stage columns.
 */
export function KanbanGroup({
  label,
  totalCount,
  children,
}: KanbanGroupProps) {
  return (
    <div
      className={cn(
        "flex-1 min-w-[340px] flex flex-col rounded-2xl border-[1.5px] overflow-hidden bg-white",
      )}
      style={{ borderColor: "#E1E4EA" }}
      dir="rtl"
    >
      {/* ── Group Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1.5px solid #ECEEF2" }}
      >
        <span
          className="font-bold text-sm flex-1 truncate"
          style={{ color: "#000000" }}
        >
          {label}
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
          {totalCount}
        </span>
      </div>

      {/* ── Stages Stack (vertical) ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
