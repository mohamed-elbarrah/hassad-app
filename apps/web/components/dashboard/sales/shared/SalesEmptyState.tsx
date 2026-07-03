"use client";

import type { LucideIcon } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";

interface SalesEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state for sales list pages.
 * Mirrors the portal `PortalEmptyState` pattern.
 */
export function SalesEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: SalesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-badge-gray-bg flex items-center justify-center">
        <Icon className="w-8 h-8 text-secondary-500" />
      </div>
      <p className="text-base font-medium text-natural-100 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-portal-note-text mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <ActionButton variant="primary" onClick={onAction}>
          {actionLabel}
        </ActionButton>
      )}
    </div>
  );
}
