"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Group, Users } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTeamWorkloadQuery } from "@/features/admin/adminUsersApi";

export default function AdminTeamsPage() {
  const { data: workload, isLoading } = useGetAdminTeamWorkloadQuery();

  const teams = useMemo(() => {
    if (!workload) return [];

    const members = workload.items;
    const totalActiveTasks = members.reduce(
      (s, m) => s + m.activeTasksCount,
      0,
    );
    const overloaded = members.filter(
      (m) => m.workloadStatus === "OVERLOADED",
    ).length;
    const available = members.filter(
      (m) => m.workloadStatus === "AVAILABLE",
    ).length;

    return [
      {
        name: "جميع الأعضاء",
        memberCount: members.length,
        activeTasks: totalActiveTasks,
        overloaded,
        available,
      },
    ];
  }, [workload]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الفرق"
        description="إدارة فرق العمل ومتابعة عبء العمل"
        icon={Group}
      />

      <SurfaceCard title="قائمة الفرق">
        {teams.length === 0 && !isLoading ? (
          <AdminEmptyState
            icon={Group}
            title="لا توجد فرق"
            description="لم يتم إضافة أي فرق بعد."
          />
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <Link
                key={team.name}
                href={`/dashboard/admin/teams/${encodeURIComponent(team.name)}`}
                className="flex items-center justify-between p-4 rounded-xl border border-portal-card-border hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-badge-gray-bg">
                    <Users className="h-5 w-5 text-secondary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {team.name}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {team.memberCount} عضو · {team.activeTasks} مهمة نشطة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="text-xs text-portal-note-text">
                      {team.available}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-danger-500" />
                    <span className="text-xs text-portal-note-text">
                      {team.overloaded}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
