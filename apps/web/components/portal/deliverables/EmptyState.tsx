"use client";

import { PartyPopper, SearchX } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** True when the empty result is caused by an active filter. */
  hasActiveFilter: boolean;
  /** True when the user has any projects at all (controls which CTA we show). */
  hasAnyProject?: boolean;
}

/**
 * Two flavors of empty:
 *   1. "No projects awaiting review" — celebration, deep-link to /portal/projects
 *   2. "No matches for your search"   — softer, with "clear filters" affordance
 */
export function EmptyState({
  hasActiveFilter,
  hasAnyProject,
}: EmptyStateProps) {
  if (hasActiveFilter) {
    return (
      <EmptyShell icon={SearchX} title="لا توجد نتائج مطابقة" tone="muted">
        <p className="text-sm leading-6 text-portal-note-text">
          جرّب كلمات بحث مختلفة أو امسح عوامل التصفية.
        </p>
      </EmptyShell>
    );
  }

  return (
    <EmptyShell
      icon={PartyPopper}
      title="كل مشاريعك تمت مراجعتها!"
      tone="success"
    >
      <p className="text-sm leading-6 text-portal-note-text max-w-md">
        لا يوجد حالياً أي مشروع بانتظار قرارك. سنُعلمك فور تسليم مشروع جديد
        للمراجعة.
      </p>
      {hasAnyProject && (
        <ActionButton href="/portal/projects" variant="primary" size="lg">
          عرض كل مشاريعي
        </ActionButton>
      )}
    </EmptyShell>
  );
}

function EmptyShell({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof PartyPopper;
  title: string;
  tone: "success" | "muted";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center gap-3",
        "rounded-3xl border-[1.5px] border-dashed border-portal-card-border",
        "bg-portal-bg px-6 py-12 text-center",
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
      {children}
    </div>
  );
}
