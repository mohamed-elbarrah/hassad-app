"use client";

import { cn } from "@/lib/utils";
import type { DisputeStatus } from "@hassad/shared";
import { DISPUTE_STATUS_AR } from "@hassad/shared";

const STATUS_STYLES: Record<
  DisputeStatus,
  { bg: string; text: string; border: string }
> = {
  PENDING_APPROVAL: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  REJECTED: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
  },
  APPROVED: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  IN_PROGRESS: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-200",
  },
  PENDING_CLIENT: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    border: "border-cyan-200",
  },
  ESCALATED: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  RESOLVED: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
  },
};

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  className?: string;
}

export function DisputeStatusBadge({
  status,
  className,
}: DisputeStatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        styles.bg,
        styles.text,
        styles.border,
        className,
      )}
      dir="rtl"
    >
      {DISPUTE_STATUS_AR[status]}
    </span>
  );
}
