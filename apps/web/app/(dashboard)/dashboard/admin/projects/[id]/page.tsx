"use client";

import { use } from "react";
import {
  FolderKanban,
  User,
  Building2,
  FileText,
  Calendar,
  Percent,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

export default function ProjectSummaryTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  const startDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString("ar-SA")
    : "—";
  const endDate = project.endDate
    ? new Date(project.endDate).toLocaleDateString("ar-SA")
    : "—";
  const createdAt = new Date(project.createdAt).toLocaleDateString("ar-SA");

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات المشروع">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FolderKanban className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">اسم المشروع</p>
              <p className="text-sm font-medium text-natural-100">
                {project.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Building2 className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">العميل</p>
              <p className="text-sm font-medium text-natural-100">
                {project.client.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">مدير المشروع</p>
              <p className="text-sm font-medium text-natural-100">
                {project.manager?.name || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ الإنشاء</p>
              <p className="text-sm font-medium text-natural-100">
                {createdAt}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الوصف</p>
              <p className="text-sm font-medium text-natural-100">
                {project.description || "لا يوجد وصف"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <AdminStatusBadge domain="project" status={project.status} />
            <div>
              <p className="text-xs text-portal-note-text">الحالة</p>
              <p className="text-sm font-medium text-natural-100">
                <AdminStatusBadge domain="project" status={project.status} />
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="التقدم والإنجاز">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <Percent className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-natural-100">
              {project.completionPercentage}%
            </p>
            <p className="text-xs text-portal-note-text mt-1">نسبة الإنجاز</p>
            <div className="mt-2 h-2 w-full rounded-full bg-portal-divider overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  project.completionPercentage >= 80
                    ? "bg-success-500"
                    : project.completionPercentage >= 40
                      ? "bg-secondary-500"
                      : "bg-warning-500",
                )}
                style={{ width: `${project.completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <Clock className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-natural-100">
              {startDate} — {endDate}
            </p>
            <p className="text-xs text-portal-note-text mt-1">
              تاريخ البداية — النهاية
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <DollarSign className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-natural-100">
              {project.totalValue.toLocaleString("ar-SA")}
            </p>
            <p className="text-xs text-portal-note-text mt-1">
              القيمة الإجمالية (ر.س)
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SurfaceCard title="المهام المتأخرة">
          {project.tasks.filter(
            (t) =>
              t.status !== "DONE" &&
              t.dueDate &&
              new Date(t.dueDate) < new Date(),
          ).length > 0 ? (
            <div className="space-y-2">
              {project.tasks
                .filter(
                  (t) =>
                    t.status !== "DONE" &&
                    t.dueDate &&
                    new Date(t.dueDate) < new Date(),
                )
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger-500" />
                      <span className="text-sm text-natural-100">
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs text-danger-500">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                        : ""}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-portal-note-text py-4 text-center">
              لا توجد مهام متأخرة
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard title="النشاط الأخير">
          {project.history.length > 0 ? (
            <div className="space-y-2">
              {project.history.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                >
                  <div>
                    <p className="text-sm text-natural-100">{entry.action}</p>
                    <p className="text-xs text-portal-note-text">
                      {entry.userName}
                    </p>
                  </div>
                  <span className="text-xs text-portal-note-text">
                    {new Date(entry.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-portal-note-text py-4 text-center">
              لا يوجد نشاط مسجل
            </p>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
