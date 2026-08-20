"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  id: string;
  /** Data passed to the draggable (e.g. { status }) */
  data?: Record<string, unknown>;
  isOverlay?: boolean;
  canDrag?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Base draggable card wrapper.
 *
 * Provides the outer container with drag state and a dedicated drag handle.
 * Keeping drag attributes off the content wrapper prevents nested links and
 * buttons from becoming part of the draggable interactive element.
 *
 * When `canDrag` is false the card content is read-only.
 */
export function KanbanCard({
  id,
  data,
  isOverlay = false,
  canDrag = true,
  children,
  onClick,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({
      id,
      data,
      disabled: !canDrag,
    });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "group border-border p-2.5 transition-all duration-150",
        canDrag && "hover:border-primary/20 hover:shadow-sm",
        !canDrag && "cursor-default opacity-90",
        isDragging && !isOverlay && "opacity-100",
        isOverlay && "relative z-50 rotate-1 scale-[1.02] shadow-lg",
      )}
      onClick={onClick}
    >
      <div className="flex h-7 justify-end">
        {!isOverlay ? (
          <Button
            ref={canDrag ? setActivatorNodeRef : undefined}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-7",
              canDrag
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-default opacity-50",
            )}
            aria-label="سحب البطاقة"
            disabled={!canDrag}
            {...(canDrag ? attributes : {})}
            {...(canDrag ? listeners : {})}
          >
            <GripVertical />
          </Button>
        ) : (
          <GripVertical aria-hidden="true" className="text-muted-foreground" />
        )}
      </div>
      {children}
    </Card>
  );
}
