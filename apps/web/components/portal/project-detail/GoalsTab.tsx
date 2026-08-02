"use client";

import { CheckCircle2, Circle, Loader2, Target } from "lucide-react";
import type { PeriodGoal } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "./EmptyState";

const GOAL_CONFIG = {
  done: { label: "مكتمل", icon: CheckCircle2, variant: "default" },
  in_progress: { label: "قيد التنفيذ", icon: Loader2, variant: "secondary" },
  pending: { label: "معلق", icon: Circle, variant: "outline" },
} as const;

export function GoalsTab({ goals }: { goals: PeriodGoal[] }) {
  if (!goals?.length)
    return (
      <EmptyState
        icon={Target}
        title="لا توجد أهداف لهذه الفترة"
        description="سيتم عرض الأهداف فور قيام مدير المشروع بإضافتها."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target />
          أهداف هذه الفترة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {goals.map((goal, index) => {
          const config = GOAL_CONFIG[goal.status];
          const Icon = config.icon;
          return (
            <div key={index} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Icon
                  className={
                    goal.status === "in_progress"
                      ? "size-5 animate-spin"
                      : "size-5"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{goal.title}</p>
                  {goal.description ? (
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  ) : null}
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={goal.progress} />
                <span className="text-sm text-muted-foreground">
                  {goal.progress}%
                </span>
              </div>
              {index < goals.length - 1 ? <Separator /> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
