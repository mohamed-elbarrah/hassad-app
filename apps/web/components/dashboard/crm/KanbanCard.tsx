"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RequestItem } from "@/features/requests/requestsApi";
import { cn } from "@/lib/utils";
import { Building2, Clock, GripVertical, Phone, FileText, PenLine, History } from "lucide-react";
import { RequestStatus } from "@hassad/shared";

interface KanbanCardProps {
  client: RequestItem;
  isOverlay?: boolean;
  accentColor?: string;
  /** Called when user clicks "Create Proposal" (PROPOSAL_IN_PROGRESS stage) */
  onCreateProposal?: (request: RequestItem) => void;
  /** Called when user clicks "Edit Proposal" (PROPOSAL_SENT stage) */
  onEditProposal?: (request: RequestItem) => void;
  /** Called when user clicks "Create Contract" (CONTRACT_PREPARATION stage) */
  onCreateContract?: (request: RequestItem) => void;
  /** Called when user clicks "Edit Contract" (CONTRACT_SENT stage) */
  onEditContract?: (request: RequestItem) => void;
}

/** Parse a short description from the notes JSON (if any) */
function parseDescription(notes?: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    return parsed.description?.trim() || null;
  } catch {
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
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

export function KanbanCard({
  client: request,
  isOverlay = false,
  accentColor = "#E1E4EA",
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
}: KanbanCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: request.id,
    data: { status: request.status },
  });

  const description = parseDescription(request.notes);

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    router.push(`/dashboard/sales/requests/${request.id}`);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group bg-white rounded-2xl border-[1.5px] border-portal-card-border p-4 cursor-grab active:cursor-grabbing transition-all duration-150",
        "hover:border-secondary-500/20",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
      )}
      style={
        isOverlay
          ? {
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
              borderLeft: ``,
              borderColor: "#121936",
            }
          : {
              borderLeft: ``,
            }
      }
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      {/* ── Header: Name + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "#000000" }}
          >
            {request.client?.contactName || request.contactName}
          </p>
          {(request.client?.companyName || request.companyName) && (
            <div className="flex items-center gap-1 mt-1">
              <Building2
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#A8ABB2" }}
              />
              <p className="text-xs truncate" style={{ color: "#A8ABB2" }}>
                {request.client?.companyName || request.companyName}
              </p>
            </div>
          )}

          {/* Returning client indicator */}
          {request.client?.totalProjects != null && request.client.totalProjects > 0 && (
            <Link
              href={`/dashboard/sales/clients/${request.clientId}`}
              className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <History className="w-3 h-3" />
              {request.client.totalProjects} مشاريع سابقة
            </Link>
          )}
        </div>
        <GripVertical
          className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#A8ABB2" }}
        />
      </div>

      {/* ── Short Description ──────────────────────────────────────── */}
      {description && (
        <p
          className="text-xs mt-3 line-clamp-2 leading-relaxed"
          style={{
            color: "rgba(0, 0, 0, 0.5)",
            borderTop: "1.5px solid #ECEEF2",
            paddingTop: 10,
          }}
        >
          {description}
        </p>
      )}

      {/* ── Footer: Phone + Last Activity ─────────────────────────── */}
      <div className="flex items-center justify-between mt-3 pt-2 gap-2">
        <div className="flex items-center gap-1 text-xs min-w-0">
          <Phone
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "#A8ABB2" }}
          />
          <span dir="ltr" className="truncate" style={{ color: "#A8ABB2" }}>
            {request.client?.phoneWhatsapp || request.phoneWhatsapp}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs shrink-0">
          <Clock className="w-3.5 h-3.5" style={{ color: "#A8ABB2" }} />
          <span style={{ color: "#A8ABB2" }}>
            {formatRelativeTime(request.updatedAt)}
          </span>
        </div>
      </div>

      {/* ── Pipeline Action Buttons ───────────────────────────────── */}
      {request.status === RequestStatus.PROPOSAL_IN_PROGRESS && onCreateProposal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateProposal(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#EFF6FF",
            color: "#1D4ED8",
            border: "1px solid #BFDBFE",
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          إنشاء عرض فني
        </button>
      )}

      {request.status === RequestStatus.PROPOSAL_SENT && onEditProposal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditProposal(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#FFFBEB",
            color: "#92400E",
            border: "1px solid #FDE68A",
          }}
        >
          <PenLine className="w-3.5 h-3.5" />
          تعديل العرض
        </button>
      )}

      {request.status === RequestStatus.CONTRACT_PREPARATION && onCreateContract && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateContract(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#F5F3FF",
            color: "#6D28D9",
            border: "1px solid #DDD6FE",
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          إنشاء عقد
        </button>
      )}

      {request.status === RequestStatus.CONTRACT_SENT && onEditContract && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditContract(request);
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: "#ECFEFF",
            color: "#155E75",
            border: "1px solid #CFFAFE",
          }}
        >
          <PenLine className="w-3.5 h-3.5" />
          تعديل العقد
        </button>
      )}
    </div>
  );
}
