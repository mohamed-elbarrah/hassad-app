"use client";

import { use, useMemo } from "react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTeamWorkloadQuery } from "@/features/admin/adminUsersApi";
import { BarChart3 } from "lucide-react";

export default function TeamWorkloadTab({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = use(params);
  const teamName = decodeURIComponent(team);
  const { data: workload } = useGetAdminTeamWorkloadQuery();

  const members = useMemo(() => {
    if (!workload) return [];
    return workload.items;
  }, [workload]);

  if (members.length === 0) {
    return (
      <SurfaceCard title="عبء العمل">
        <AdminEmptyState
          icon={BarChart3}
          title="لا توجد بيانات"
          description="لا توجد بيانات عبء عمل لهذا الفريق."
        />
      </SurfaceCard>
    );
  }

  const maxTasks = Math.max(...members.map((m) => m.activeTasksCount), 1);

  return (
    <SurfaceCard title="عبء العمل">
      <div className="space-y-4">
        {members.map((member) => {
          const pct = (member.activeTasksCount / maxTasks) * 100;
          const barColor =
            member.workloadStatus === "OVERLOADED"
              ? "bg-danger-500"
              : member.workloadStatus === "BUSY"
                ? "bg-alert-500"
                : "bg-success-500";

          return (
            <div key={member.userId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-natural-100">
                  {member.userName}
                </span>
                <span className="text-xs text-portal-note-text">
                  {member.activeTasksCount} مهام
                  {member.avgCompletionSpeedDays != null
                    ? ` · ${member.avgCompletionSpeedDays.toFixed(1)} يوم`
                    : ""}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
