"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import type { Client } from "@hassad/shared";
import { BusinessType } from "@hassad/shared";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical } from "lucide-react";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
};

interface KanbanCardProps {
  client: Client;
  isOverlay?: boolean;
}

export function KanbanCard({ client, isOverlay = false }: KanbanCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: client.id,
    data: { stage: client.stage },
  });

  const daysInStage = Math.floor(
    (Date.now() - new Date(client.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    router.push(`/dashboard/sales/clients/${client.id}`);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-background rounded-md border p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors duration-100",
        (isDragging || isOverlay) && "opacity-50 shadow-lg",
      )}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{client.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {BUSINESS_TYPE_LABELS[client.businessType as BusinessType] ??
              client.businessType}
          </p>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span dir="ltr">
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
          }).format(new Date(client.createdAt))}
        </span>
        {daysInStage > 0 && (
          <span className="mr-auto text-amber-600 font-medium">
            {daysInStage} أيام
          </span>
        )}
      </div>
    </div>
  );
}
