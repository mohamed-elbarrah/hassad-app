"use client";

import { CheckCircle2, Circle, Loader2, Target } from "lucide-react";
import type { PeriodGoal } from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { GOAL_STATUS_CONFIG, type GoalStatus } from "./helpers";

const STATUS_ICON: Record<GoalStatus, React.ReactNode> = {
  done: <CheckCircle2 className="size-5 text-emerald-500" />,
  in_progress: <Loader2 className="size-5 animate-spin text-secondary-500" />,
  pending: <Circle className="size-5 text-neutral-300" />,
};

function GoalRow({ goal }: { goal: PeriodGoal }) {
  const config = GOAL_STATUS_CONFIG[goal.status];

  return (
    <div className="flex items-center gap-4 border-b border-portal-divider py-4 last:border-0">
      <div className="shrink-0">{STATUS_ICON[goal.status]}</div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-natural-100",
            goal.status === "done" && "text-neutral-400 line-through",
          )}
        >
          {goal.title}
        </p>
        {goal.description && (
          <p className="truncate text-xs text-portal-note-text">
            {goal.description}
          </p>
        )}
      </div>
      <div className="hidden w-40 items-center gap-3 sm:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              config.barColor,
            )}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <span className="w-8 text-xs font-medium text-portal-note-text">
          {goal.progress}%
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
          config.badge,
        )}
      >
        {config.label}
      </span>
    </div>
  );
}

interface GoalsTabProps {
  goals: PeriodGoal[];
}

/** Goals tab — PM-defined goals for the selected period. */
export function GoalsTab({ goals }: GoalsTabProps) {
  if (!goals || goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="لا توجد أهداف لهذه الفترة"
        description="سيتم عرض الأهداف فور قيام مدير المشروع بإضافتها."
      />
    );
  }

  return (
    <SurfaceCard title="أهداف هذه الفترة" icon={Target}>
      <div className="space-y-1" dir="rtl">
        {goals.map((goal, idx) => (
          <GoalRow key={idx} goal={goal} />
        ))}
      </div>
    </SurfaceCard>
  );
}
