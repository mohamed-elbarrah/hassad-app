"use client";

import { useRouter } from "next/navigation";
import { Users, UserCheck, Clock, AlertTriangle, Star } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { useGetAdminTeamWorkloadQuery } from "@/features/admin/adminApi";

const WORKLOAD_LABELS: Record<string, string> = {
  AVAILABLE: "متاح",
  BUSY: "مشغول",
  OVERLOADED: "مثقل",
};

export default function TeamPerformancePage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetAdminTeamWorkloadQuery();

  const members = data?.members ?? [];
  const total = data?.total ?? data?.totalMembers ?? members.length;
  const available = data?.available ?? members.filter((m: any) => m.workloadStatus === "AVAILABLE").length;
  const busy = data?.busy ?? members.filter((m: any) => m.workloadStatus === "BUSY").length;
  const overloaded = data?.overloaded ?? members.filter((m: any) => m.workloadStatus === "OVERLOADED").length;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="أداء الفريق وعبء العمل"
        description="مراقبة أداء الموظفين وتوزيع المهام"
        icon={Users}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الفريق" value={total} icon={Users} />
        <StatCard title="متاح" value={available} icon={UserCheck} variant="success" />
        <StatCard title="مشغول" value={busy} icon={Clock} variant="warning" />
        <StatCard title="مثقل" value={overloaded} icon={AlertTriangle} variant="danger" />
      </div>

      <SurfaceCard>
        <DataTable
          columns={[
            { id: "name", label: "اسم الموظف" },
            { id: "tasks", label: "المهام النشطة" },
            { id: "status", label: "الحالة" },
            { id: "speed", label: "سرعة الإنجاز (أيام)" },
            { id: "quality", label: "جودة العمل" },
          ]}
          data={members}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Users,
            message: "لا يوجد أعضاء في الفريق",
            hint: "لم يتم العثور على بيانات الفريق",
          }}
          onRowActivate={(row: any) => router.push(`/dashboard/admin/users/${row.userId ?? row.id}`)}
          renderCells={(m: any) => [
            <td key="name" className="px-5 py-4 text-sm font-medium text-natural-100">{m.name ?? m.userName}</td>,
            <td key="tasks" className="px-5 py-4 text-sm">{m.activeTasksCount ?? m.activeTasks ?? 0}</td>,
            <td key="status" className="px-5 py-4">
              <StatusBadge
                status={m.workloadStatus ?? m.status ?? "AVAILABLE"}
                label={WORKLOAD_LABELS[m.workloadStatus ?? m.status] ?? m.workloadStatus}
              />
            </td>,
            <td key="speed" className="px-5 py-4 text-sm">
              {m.completionSpeedDays != null ? m.completionSpeedDays : m.avgCompletionDays ?? "—"}
            </td>,
            <td key="quality" className="px-5 py-4">
              <div className="flex items-center gap-1">
                <Star className="size-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">
                  {m.qualityScore != null ? m.qualityScore.toFixed(1) : m.quality ?? "—"}
                </span>
              </div>
            </td>,
          ]}
        />
      </SurfaceCard>
    </div>
  );
}
