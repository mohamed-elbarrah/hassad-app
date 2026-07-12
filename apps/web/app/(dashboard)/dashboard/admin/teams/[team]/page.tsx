"use client";

import { use, useMemo } from "react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTeamWorkloadQuery } from "@/features/admin/adminUsersApi";
import { Group } from "lucide-react";

export default function TeamOverviewTab({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = use(params);
  const teamName = decodeURIComponent(team);
  const { data: workload, isLoading } = useGetAdminTeamWorkloadQuery();

  const teamData = useMemo(() => {
    if (!workload) return null;
    const members = workload.items;
    return {
      members,
      total: members.length,
      overloaded: members.filter((m) => m.workloadStatus === "OVERLOADED").length,
      available: members.filter((m) => m.workloadStatus === "AVAILABLE").length,
      totalTasks: members.reduce((s, m) => s + m.activeTasksCount, 0),
    };
  }, [workload]);

  if (!teamData || isLoading) {
    return (
      <SurfaceCard title="نظرة عامة">
        <AdminEmptyState icon={Group} title="جاري التحميل..." />
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-5">
      <SurfaceCard title={`الفريق: ${teamName}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">{teamData.total}</p>
            <p className="text-xs text-portal-note-text mt-1">إجمالي الأعضاء</p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-success-600">{teamData.available}</p>
            <p className="text-xs text-portal-note-text mt-1">متاحون</p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-danger-600">{teamData.overloaded}</p>
            <p className="text-xs text-portal-note-text mt-1">محمّلون</p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">{teamData.totalTasks}</p>
            <p className="text-xs text-portal-note-text mt-1">مهام نشطة</p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="أعضاء الفريق">
        <div className="space-y-2">
          {teamData.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-natural-100">
                  {member.userName}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-portal-note-text">
                  {member.activeTasksCount} مهام
                </span>
                <span className="text-xs text-portal-note-text">
                  {member.avgCompletionSpeedDays != null
                    ? `${member.avgCompletionSpeedDays.toFixed(1)} يوم`
                    : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
