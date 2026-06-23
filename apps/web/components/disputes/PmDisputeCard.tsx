"use client";

import Link from "next/link";
import { MessageSquare, Calendar, ArrowLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PmDisputeSummary } from "@/features/disputes/pmDisputesApi";
import { DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";
import { CompactTimer } from "./DisputeResolutionTimer";

interface PmDisputeCardProps {
  dispute: PmDisputeSummary;
}

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

export function PmDisputeCard({ dispute }: PmDisputeCardProps) {
  const hasMessages = dispute._count && dispute._count.messages > 0;
  const showTimer = ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(dispute.status);

  return (
    <Link
      href={`/dashboard/pm/disputes/${dispute.id}`}
      className="group relative flex flex-col rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-secondary-500/30 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-secondary-500">
            #{dispute.ticketNumber.toString().padStart(3, "0")}
          </span>
          <DisputeStatusBadge status={dispute.status} />
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              PRIORITY_COLORS[dispute.priority]
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

      {/* Client & Project Info */}
      <div className="mt-2 flex items-center gap-3 text-sm text-portal-note-text">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{dispute.client.name}</span>
        </span>
        <span>•</span>
        <span className="truncate">{dispute.project.name}</span>
      </div>

      {/* Timer for active disputes */}
      {showTimer && (
        <div className="mt-3">
          <CompactTimer deadlineAt={dispute.deadlineAt} status={dispute.status} />
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