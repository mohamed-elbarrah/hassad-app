"use client";

import { use } from "react";
import { useGetAdminUserByIdQuery } from "@/features/admin/adminUsersApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Monitor, Smartphone } from "lucide-react";

export default function EmployeeSessionsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: user } = useGetAdminUserByIdQuery(id);

  if (!user) return null;

  const sessionCount = user.activeSessionsCount ?? 0;

  return (
    <SurfaceCard title="الجلسات النشطة">
      {sessionCount === 0 ? (
        <AdminEmptyState
          icon={Monitor}
          title="لا توجد جلسات نشطة"
          description="لا توجد جلسات نشطة لهذا الموظف حالياً."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-portal-note-text">
            عدد الجلسات النشطة: {sessionCount}
          </p>
        </div>
      )}
    </SurfaceCard>
  );
}
