"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanGroupProps {
  id: string;
  label: string;
  /** Tailwind border/background color classes for the group accent */
  accentClass: string;
  /** Tailwind text color class for the label */
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
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── Group Header ─────────────────────────────────────────────── */}
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border",
            "hover:opacity-80 transition-opacity select-none text-right",
            accentClass,
          )}
        >
          {open ? (
            <ChevronDown className={cn("w-4 h-4 shrink-0", textClass)} />
          ) : (
            <ChevronRight className={cn("w-4 h-4 shrink-0", textClass)} />
          )}
          <span className={cn("font-semibold text-sm flex-1", textClass)}>
            {label}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium min-w-[1.5rem] justify-center",
              accentClass,
              "border-0",
            )}
          >
            {totalCount}
          </Badge>
        </button>
      </CollapsibleTrigger>

      {/* ── Columns Row ───────────────────────────────────────────────── */}
      <CollapsibleContent>
        {/* overflow-x-auto enables per-group horizontal scroll; min-w-max prevents column squashing */}
        <div className="overflow-x-auto pb-2 pt-3">
          <div className="flex gap-3 min-w-max">
            {children}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
