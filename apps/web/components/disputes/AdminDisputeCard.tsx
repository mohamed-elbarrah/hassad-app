"use client";

import Link from "next/link";
import {
  MessageSquare,
  Calendar,
  ArrowLeft,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminDisputeSummary } from "@/features/disputes/adminDisputesApi";
import { DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";

interface AdminDisputeCardProps {
  dispute: AdminDisputeSummary;
}

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
};

// Statuses that require admin attention
const NEEDS_ATTENTION: Set<string> = new Set(["PENDING_APPROVAL", "ESCALATED"]);

export function AdminDisputeCard({ dispute }: AdminDisputeCardProps) {
  const hasMessages = dispute._count && dispute._count.messages > 0;
  const needsAttention = NEEDS_ATTENTION.has(dispute.status);

  return (
    <Link
      href={`/dashboard/admin/disputes/${dispute.id}`}
      className="group relative flex flex-col rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-secondary-500/30 hover:shadow-sm"
    >
      {/* Attention indicator */}
      {needsAttention && (
        <div className="absolute -top-2 -right-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
            <AlertTriangle className="h-3 w-3" />
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-secondary-500">
            #{dispute.ticketNumber.toString().padStart(3, "0")}
          </span>
          <DisputeStatusBadge status={dispute.status} />
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
              PRIORITY_COLORS[dispute.priority],
            )}
          >
            {DISPUTE_PRIORITY_AR[dispute.priority]}
          </span>
        </div>
        <DisputeCategoryIcon category={dispute.category} size="sm" />
      </div>

      {/* Title */}
      <h3 className="mt-3 text-base font-semibold text-natural-100 line-clamp-2 group-hover:text-secondary-500 transition-colors">
        {dispute.title}
      </h3>

      {/* Client & PM Info */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-sm text-portal-note-text">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">العميل: {dispute.client.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-portal-note-text">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">المدير: {dispute.pm.name}</span>
        </div>
      </div>

      {/* Escalation indicator */}
      {dispute.status === "ESCALATED" && dispute.escalatedAt && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span>
            تم التصعيد:{" "}
            {new Date(dispute.escalatedAt).toLocaleDateString("ar-SA")}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-portal-divider pt-3">
        <div className="flex items-center gap-3 text-xs text-portal-note-text">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(dispute.openedAt).toLocaleDateString("ar-SA")}
          </span>
          {hasMessages && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {dispute._count?.messages}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-xs font-medium text-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity">
          عرض التفاصيل
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
