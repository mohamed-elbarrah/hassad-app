"use client";

import { use } from "react";
import { useGetAdminUserActivityQuery } from "@/features/admin/adminUsersApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Activity } from "lucide-react";

export default function EmployeeActivityTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: activities,
    isLoading,
    isError,
  } = useGetAdminUserActivityQuery(id);

  if (isLoading) {
    return (
      <SurfaceCard title="سجل النشاط">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  if (isError || !activities || activities.length === 0) {
    return (
      <SurfaceCard title="سجل النشاط">
        <AdminEmptyState
          icon={Activity}
          title="لا توجد نشاطات"
          description="لا توجد نشاطات مسجلة لهذا الموظف."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="سجل النشاط">
      <div className="space-y-2">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border"
          >
            <Activity className="h-4 w-4 text-secondary-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-natural-100 truncate">{a.action}</p>
              <p className="text-xs text-portal-note-text">{a.entityLabel}</p>
            </div>
            <span className="text-xs text-portal-note-text shrink-0">
              {new Date(a.createdAt).toLocaleDateString("ar-SA")}
            </span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
