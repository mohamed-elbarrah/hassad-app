"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

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
 * Provides the outer container with drag behaviour, hover effects, and
 * visual feedback during drag.  The actual card content is passed as
 * `children` so each variant can render whatever it needs.
 *
 * When `canDrag` is false the card renders a lock icon instead of the
 * grip handle — the consumer is responsible for placing the icon.
 */
export function KanbanCard({
  id,
  data,
  isOverlay = false,
  canDrag = true,
  children,
  onClick,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
    disabled: !canDrag,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group bg-white rounded-2xl border-[1.5px] border-portal-card-border p-4 transition-all duration-150",
        canDrag && "cursor-grab active:cursor-grabbing hover:border-secondary-500/20",
        !canDrag && "cursor-default opacity-80",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
        isOverlay && "shadow-lg",
      )}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
