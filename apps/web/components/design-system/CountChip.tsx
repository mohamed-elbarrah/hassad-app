"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CountChipProps {
  hasFilter: boolean;
  total: number;
  visible: number;
  /** Icon shown when no filter is active (e.g. <Inbox />). */
  icon?: ReactNode;
  /** Label that comes AFTER the total when no filter is active. */
  unfilteredLabel: string;
}

/**
 * Shared count chip used in every portal queue toolbar.
 *
 * Two states:
 *   • No filter  → "{icon} {total} {unfilteredLabel}" (gold-tinted)
 *   • Filtered   → "{visible} من {total}" (gray)
 *
 * Owns the styling so individual toolbars don't repeat the
 * height, padding, ring, and color tokens.
 */
export function CountChip({
  hasFilter,
  total,
  visible,
  icon,
  unfilteredLabel,
}: CountChipProps) {
  if (hasFilter) {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg px-2.5",
          "bg-badge-gray-bg text-secondary-500",
          "text-[12px] font-semibold tabular-nums whitespace-nowrap",
        )}
      >
        <span>{visible}</span>
        <span className="text-portal-note-text font-normal">من</span>
        <span>{total}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5",
        "bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-200",
        "text-[12px] font-semibold whitespace-nowrap",
      )}
    >
      {icon && (
        <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="tabular-nums">{total}</span>
      <span className="font-normal">{unfilteredLabel}</span>
    </span>
  );
}