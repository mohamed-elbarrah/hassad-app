"use client";

import { EmptyState } from "@/components/design-system/EmptyState";
import { ActionButton } from "@/components/design-system/ActionButton";
import type { LucideIcon } from "lucide-react";

interface PmEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function PmEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: PmEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      hint={description}
      action={
        actionLabel ? (
          actionHref ? (
            <ActionButton href={actionHref} variant="outline" size="sm">
              {actionLabel}
            </ActionButton>
          ) : onAction ? (
            <ActionButton onClick={onAction} variant="outline" size="sm">
              {actionLabel}
            </ActionButton>
          ) : undefined
        ) : undefined
      }
    />
  );
}
