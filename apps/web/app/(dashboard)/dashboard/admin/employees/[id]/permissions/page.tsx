"use client";

import { use } from "react";
import { useGetAdminUserByIdQuery } from "@/features/admin/adminUsersApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Shield } from "lucide-react";
import { USER_ROLE_AR } from "@hassad/shared";

export default function EmployeePermissionsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: user } = useGetAdminUserByIdQuery(id);

  if (!user) return null;

  return (
    <SurfaceCard title="الصلاحيات">
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-portal-card-border">
          <p className="text-xs text-portal-note-text">الدور الأساسي</p>
          <p className="text-sm font-medium text-natural-100 mt-1">
            {USER_ROLE_AR[user.role] || user.role}
          </p>
        </div>
        <p className="text-sm text-portal-note-text">
          يمكن إدارة الصلاحيات الدقيقة من صفحة الأدوار.
        </p>
      </div>
    </SurfaceCard>
  );
}
