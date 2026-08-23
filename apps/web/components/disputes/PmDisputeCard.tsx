"use client";

import Link from "next/link";
import { MessageSquare, Calendar, ArrowLeft, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PmDisputeSummary } from "@/features/disputes/pmDisputesApi";
import { DISPUTE_PRIORITY_AR } from "@hassad/shared";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputeCategoryIcon } from "./DisputeCategoryIcon";
import { CompactTimer } from "./DisputeResolutionTimer";
import { formatShortDate } from "@/lib/format";

interface PmDisputeCardProps {
  dispute: PmDisputeSummary;
}

export function PmDisputeCard({ dispute }: PmDisputeCardProps) {
  const hasMessages = dispute._count && dispute._count.messages > 0;
  const showTimer = ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(
    dispute.status,
  );

  return (
    <Link
      href={`/dashboard/pm/disputes/${dispute.id}`}
      className="group relative flex flex-col gap-0 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/30 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-primary">
            #{dispute.ticketNumber.toString().padStart(3, "0")}
          </span>
          <DisputeStatusBadge status={dispute.status} />
          <Badge
            variant={
              dispute.priority === "URGENT"
                ? "destructive"
                : dispute.priority === "HIGH"
                  ? "warning"
                  : "secondary"
            }
          >
            {DISPUTE_PRIORITY_AR[dispute.priority]}
          </Badge>
        </div>
        <DisputeCategoryIcon category={dispute.category} size="sm" />
      </div>

      {/* Title */}
      <h3 className="mt-3 text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {dispute.title}
      </h3>

      {/* Client & Project Info */}
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <User aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="truncate">
            {dispute.client.companyName ?? dispute.client.user?.name ?? "-"}
          </span>
        </span>
        <span>•</span>
        <span className="truncate">{dispute.project.name}</span>
      </div>

      {/* Timer for active disputes */}
      {showTimer && (
        <div className="mt-3">
          <CompactTimer
            deadlineAt={dispute.deadlineAt}
            status={dispute.status}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
            {formatShortDate(dispute.openedAt)}
          </span>
          {hasMessages && (
            <span className="flex items-center gap-1">
              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
              {dispute._count?.messages}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          عرض التفاصيل
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
