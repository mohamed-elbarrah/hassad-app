"use client";

import { AlertOctagon, type LucideIcon } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  /** Optional action (e.g. "View all my projects"). */
  action?: React.ReactNode;
  tone?: "muted" | "success";
  className?: string;
}

/**
 * Shared empty state used across portal queue pages. Owns the
 * dashed border, icon circle, and spacing so callers only
 * provide icon + title + hint.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  tone = "muted",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-3",
        "rounded-3xl border-[1.5px] border-dashed border-portal-card-border",
        "bg-portal-bg px-6 py-10 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          tone === "success" ? "bg-badge-green-bg" : "bg-badge-gray-bg",
        )}
      >
        <Icon
          className={cn(
            "h-8 w-8",
            tone === "success" ? "text-success-600" : "text-secondary-500",
          )}
        />
      </div>
      <p className="text-lg font-semibold text-natural-100">{title}</p>
      {hint && (
        <p className="max-w-md text-sm leading-6 text-portal-note-text">
          {hint}
        </p>
      )}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Shared error state used by every portal queue page when the
 * fetch fails. Provides retry affordance.
 */
export function ErrorState({
  title = "تعذّر تحميل البيانات",
  message = "قد تكون المشكلة في الاتصال. حاول مجدداً.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center gap-3",
        "rounded-3xl border-[1.5px] border-danger-200 bg-danger-100",
        "px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100">
        <AlertOctagon className="h-7 w-7 text-danger-600" />
      </div>
      <p className="text-base font-semibold text-natural-100">{title}</p>
      <p className="text-sm text-portal-note-text max-w-md">{message}</p>
      {onRetry && (
        <ActionButton variant="primary" size="md" onClick={onRetry}>
          إعادة المحاولة
        </ActionButton>
      )}
    </div>
  );
}