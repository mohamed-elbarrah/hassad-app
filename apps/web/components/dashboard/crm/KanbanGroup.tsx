"use client";

import { Pill } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";

interface KanbanGroupProps {
  id: string;
  label: string;
  accentClass: string;
  textClass: string;
  totalCount: number;
  children: React.ReactNode;
}

export function KanbanGroup({
  label,
  accentClass,
  textClass,
  totalCount,
  children,
}: KanbanGroupProps) {
  return (
    <div
      className={cn(
        "flex-1 min-w-[280px] flex flex-col rounded-2xl border-2 overflow-hidden",
        accentClass,
      )}
      dir="rtl"
    >
      {/* ── Group Header ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 border-b border-inherit",
          accentClass,
        )}
      >
        <span className={cn("font-bold text-sm flex-1 truncate", textClass)}>
          {label}
        </span>
        <Pill
          tone="neutral"
          className="text-xs h-5 px-2 min-w-[1.5rem] justify-center tabular-nums"
        >
          {totalCount}
        </Pill>
      </div>

      {/* ── Stages Stack (vertical) ─────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
