"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SalesEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SalesEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: SalesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-8" />
      </div>
      <p className="mb-1 text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );
}
