"use client";

import { useRouter } from "next/navigation";
import { Users, UserCheck, Clock, AlertTriangle, Star, ThumbsUp, MessageSquare, AlertCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { GaugeChart } from "@/components/design-system/GaugeChart";
import { WORKLOAD_STATUS_AR } from "@hassad/shared";
import { useGetAdminTeamWorkloadQuery, useGetAdminReportSatisfactionQuery, useGetAdminTasksQuery } from "@/features/admin/adminApi";

export default function TeamPerformancePage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetAdminTeamWorkloadQuery();
  const { data: satisfactionData, isLoading: satLoading } = useGetAdminReportSatisfactionQuery({});
  const { data: tasksData, isLoading: tasksLoading } = useGetAdminTasksQuery({ overdueOnly: "true" });

  const items = data?.items ?? [];
  const summary = data?.summary ?? {};
  const total = items.length;
  const available = summary.available ?? items.filter((m: any) => m.workloadStatus === "AVAILABLE").length;
  const busy = summary.busy ?? items.filter((m: any) => m.workloadStatus === "BUSY").length;
  const overloaded = summary.overloaded ?? items.filter((m: any) => m.workloadStatus === "OVERLOADED").length;

  const avgScore = satisfactionData?.avgScore ?? 0;
  const ratingsByScore = satisfactionData?.ratingsByScore ?? [];
  const totalRatings = ratingsByScore.reduce((s: number, r: any) => s + r.count, 0);
  const lowRatingsCount = satisfactionData?.recentLowRatings?.length ?? 0;
  const avgScorePercent = Math.round(avgScore * 20);

  const overdueTasks = tasksData?.items ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="أداء الفريق وعبء العمل"
        description="مراقبة أداء الموظفين وتوزيع المهام"
        icon={Users}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الأعضاء" value={total} icon={Users} />
        <StatCard title="متاح" value={available} icon={UserCheck} variant="success" />
        <StatCard title="مشغول" value={busy} icon={Clock} variant="warning" />
        <StatCard title="مثقل" value={overloaded} icon={AlertTriangle} variant="danger" />
      </div>

      <SurfaceCard>
        <DataTable
          columns={[
            { id: "name", label: "اسم الموظف" },
            { id: "tasks", label: "عدد المهام النشطة" },
            { id: "status", label: "الحالة" },
            { id: "speed", label: "سرعة الإنجاز" },
            { id: "quality", label: "جودة العمل" },
          ]}
          data={items}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Users,
            message: "لا يوجد أعضاء في الفريق",
            hint: "لم يتم العثور على بيانات الفريق",
          }}
          onRowActivate={(row: any) => router.push(`/dashboard/admin/users/${row.userId}`)}
          renderCells={(m: any) => [
            <td key="name" className="px-5 py-4 text-sm font-medium text-natural-100">{m.userName}</td>,
            <td key="tasks" className="px-5 py-4 text-sm">{m.activeTasksCount ?? 0}</td>,
            <td key="status" className="px-5 py-4">
              <StatusBadge
                status={m.workloadStatus}
                label={WORKLOAD_STATUS_AR[m.workloadStatus as keyof typeof WORKLOAD_STATUS_AR] ?? m.workloadStatus}
              />
            </td>,
            <td key="speed" className="px-5 py-4 text-sm">
              {m.avgCompletionSpeedDays != null ? `${m.avgCompletionSpeedDays} أيام` : "—"}
            </td>,
            <td key="quality" className="px-5 py-4">
              <div className="flex items-center gap-1">
                <Star className="size-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">
                  {m.avgQualityScore != null ? `${m.avgQualityScore.toFixed(1)} / 5` : "—"}
                </span>
              </div>
            </td>,
          ]}
        />
      </SurfaceCard>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-natural-100">رضا العملاء</h2>
        {satLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[30px]" />
            ))}
          </div>
        ) : satisfactionData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="متوسط التقييم" value={avgScore.toFixed(1)} icon={Star} />
              <StatCard title="إجمالي التقييمات" value={totalRatings} icon={MessageSquare} />
              <StatCard title="تقييمات منخفضة" value={lowRatingsCount} icon={AlertCircle} variant={lowRatingsCount > 0 ? "danger" : "success"} />
            </div>
            <SurfaceCard>
              <div className="flex justify-center py-4">
                <GaugeChart value={avgScorePercent} max={100} />
              </div>
            </SurfaceCard>
          </>
        ) : (
          <EmptyState
            icon={ThumbsUp}
            title="لا توجد بيانات تقييم"
            hint="لم يتم العثور على تقييمات العملاء بعد"
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-natural-100">تنبيهات التأخر</h2>
        {tasksLoading ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : overdueTasks.length > 0 ? (
          <SurfaceCard>
            <DataTable
              columns={[
                { id: "task", label: "المهمة" },
                { id: "assignee", label: "المسؤول" },
                { id: "dueDate", label: "تاريخ التسليم" },
                { id: "delay", label: "أيام التأخر" },
              ]}
              data={overdueTasks}
              isLoading={false}
              isError={false}
              emptyState={{ icon: AlertTriangle, message: "", hint: "" }}
              renderCells={(t: any) => {
                const delayDays = t.dueDate
                  ? Math.ceil((Date.now() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const isUrgent = delayDays > 7;
                return [
                  <td key="task" className="px-5 py-4 text-sm font-medium text-natural-100">{t.title}</td>,
                  <td key="assignee" className="px-5 py-4 text-sm">{t.assigneeName}</td>,
                  <td key="dueDate" className="px-5 py-4 text-sm">{t.dueDate ? new Date(t.dueDate).toLocaleDateString("ar-SA") : "—"}</td>,
                  <td key="delay" className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isUrgent
                        ? "bg-danger-100 text-danger-600"
                        : "bg-alert-100 text-alert-600"
                    }`}>
                      {delayDays} يوم
                    </span>
                  </td>,
                ];
              }}
            />
          </SurfaceCard>
        ) : (
          <EmptyState
            icon={Clock}
            title="لا توجد مهام متأخرة"
            hint="جميع المهام في الموعد المحدد"
            tone="success"
          />
        )}
      </div>
    </div>
  );
}
