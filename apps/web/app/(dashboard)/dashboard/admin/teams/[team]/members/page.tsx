"use client";

import { use, useMemo } from "react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTeamWorkloadQuery } from "@/features/admin/adminUsersApi";
import { Users } from "lucide-react";

export default function TeamMembersTab({
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
      <SurfaceCard title="الأعضاء">
        <AdminEmptyState
          icon={Users}
          title="لا يوجد أعضاء"
          description={`لا يوجد أعضاء في فريق ${teamName}.`}
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="الأعضاء">
      <div className="space-y-2">
        {members.map((member) => (
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
              <AdminStatusBadge domain="team" status={member.workloadStatus} />
              <span className="text-xs text-portal-note-text">
                {member.activeTasksCount} مهام
              </span>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
