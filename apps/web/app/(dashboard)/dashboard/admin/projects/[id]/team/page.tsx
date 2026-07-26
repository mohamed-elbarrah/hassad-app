"use client";

import { use } from "react";
import { User, Calendar, Users } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";

export default function ProjectTeamTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;



  const pm = project.manager;

  return (
    <div className="space-y-5">
      <SurfaceCard title="مدير المشروع">
        {pm ? (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-portal-card-border">
            <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
              <User className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-natural-100">{pm.name}</p>
              <p className="text-xs text-portal-note-text">{pm.email}</p>
            </div>
            <div className="mr-auto">
              <AdminStatusBadge domain="user" status="PM" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-portal-note-text text-center py-4">
            لم يتم تعيين مدير مشروع بعد
          </p>
        )}
      </SurfaceCard>

      <SurfaceCard title="أعضاء الفريق">
        {project.members.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="لا يوجد أعضاء"
            description="لم يتم إضافة أعضاء للفريق بعد."
          />
        ) : (
          <div className="space-y-3">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-portal-divider flex items-center justify-center">
                    <User className="h-5 w-5 text-portal-note-text" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-portal-divider text-portal-note-text">
                    {member.role === "TEAM" ? "فريق" : member.role}
                  </span>
                  <span className="text-xs text-portal-note-text flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(member.joinedAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
