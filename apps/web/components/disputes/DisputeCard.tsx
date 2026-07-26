"use client";

import Link from "next/link";
import { MessageSquare, Calendar, ArrowLeft } from "lucide-react";

import type { DisputeSummary } from "@/features/portal/portalApi";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";

interface DisputeCardProps {
  dispute: DisputeSummary;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  const hasMessages = dispute._count && dispute._count.messages > 0;

  return (
    <Link
      href={`/portal/disputes/${dispute.id}`}
      className="group relative flex flex-col rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-secondary-500/30 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-secondary-500">
            #{dispute.ticketNumber.toString().padStart(3, "0")}
          </span>
          <DisputeStatusBadge status={dispute.status} />
        </div>
        <DisputeCategoryIcon category={dispute.category} size="sm" />
      </div>

      {/* Title */}
      <h3 className="mt-3 text-base font-semibold text-natural-100 line-clamp-2 group-hover:text-secondary-500 transition-colors">
        {dispute.title}
      </h3>

      {/* Project Info */}
      <div className="mt-2 flex items-center gap-2 text-sm text-portal-note-text">
        <span className="truncate">{dispute.project.name}</span>
      </div>

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
