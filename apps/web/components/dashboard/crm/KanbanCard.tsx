"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import type { LeadListItem } from "@/features/leads/leadsApi";
import { cn } from "@/lib/utils";
import { Building2, Clock, GripVertical, Phone } from "lucide-react";

interface KanbanCardProps {
  client: LeadListItem;
  isOverlay?: boolean;
}

/** Parse a short description from the notes JSON (if any) */
function parseDescription(notes?: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    return parsed.description?.trim() || null;
  } catch {
    // notes is plain text, not JSON
    return notes.trim() || null;
  }
}

/** Format relative "last activity" time in Arabic */
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

export function KanbanCard({ client: lead, isOverlay = false }: KanbanCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.pipelineStage },
  });

  const description = parseDescription(lead.notes);

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    router.push(`/dashboard/sales/leads/${lead.id}`);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-sm transition-all duration-100",
        (isDragging || isOverlay) && "opacity-50 shadow-xl rotate-1 scale-105",
      )}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      {/* ── Header: Name + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {lead.contactName}
          </p>
          {lead.companyName && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {lead.companyName}
              </p>
            </div>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      {/* ── Short Description ──────────────────────────────────────── */}
      {description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed border-t pt-2">
          {description}
        </p>
      )}

      {/* ── Footer: Phone + Last Activity ─────────────────────────── */}
      <div className="flex items-center justify-between mt-2 pt-1 gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <Phone className="w-3 h-3 shrink-0" />
          <span dir="ltr" className="truncate">
            {lead.phoneWhatsapp}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(lead.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
