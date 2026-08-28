"use client";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: AdminEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {actionLabel && (
        <EmptyContent>
          {actionHref ? (
            <Button variant="outline" size="sm" className="min-h-11" asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button variant="outline" size="sm" className="min-h-11" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </EmptyContent>
      )}
    </Empty>
  );
}
