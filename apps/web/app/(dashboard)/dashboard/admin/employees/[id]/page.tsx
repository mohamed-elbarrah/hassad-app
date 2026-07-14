"use client";

import { use } from "react";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminUserByIdQuery } from "@/features/admin/adminUsersApi";
import { USER_ROLE_AR } from "@hassad/shared";

export default function EmployeeProfileTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: user } = useGetAdminUserByIdQuery(id);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات الموظف">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الاسم</p>
              <p className="text-sm font-medium text-natural-100">
                {user.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Mail className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-natural-100">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Shield className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الدور</p>
              <div className="mt-1">
                <AdminStatusBadge domain="user" status={user.role} />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ التسجيل</p>
              <p className="text-sm font-medium text-natural-100">
                {new Date(user.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {user.performance && (
        <SurfaceCard title="الأداء">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-portal-card-border text-center">
              <p className="text-2xl font-semibold text-natural-100">
                {user.performance.tasksCompleted}
              </p>
              <p className="text-xs text-portal-note-text mt-1">
                المهام المنجزة
              </p>
            </div>
            <div className="p-4 rounded-xl border border-portal-card-border text-center">
              <p className="text-2xl font-semibold text-natural-100">
                {user.performance.avgCompletionSpeedDays.toFixed(1)}
              </p>
              <p className="text-xs text-portal-note-text mt-1">
                متوسط أيام الإنجاز
              </p>
            </div>
            <div className="p-4 rounded-xl border border-portal-card-border text-center">
              <p className="text-2xl font-semibold text-natural-100">
                {user.performance.avgQualityScore.toFixed(1)}
              </p>
              <p className="text-xs text-portal-note-text mt-1">جودة العمل</p>
            </div>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
