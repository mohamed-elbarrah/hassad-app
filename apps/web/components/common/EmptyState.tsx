"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const ActionButton = actionHref ? (
    <Button asChild>
      <Link href={actionHref}>{actionLabel}</Link>
    </Button>
  ) : actionLabel && onAction ? (
    <Button onClick={onAction}>{actionLabel}</Button>
  ) : null;

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      dir="rtl"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {description}
        </p>
      )}
      {ActionButton}
    </div>
  );
}
