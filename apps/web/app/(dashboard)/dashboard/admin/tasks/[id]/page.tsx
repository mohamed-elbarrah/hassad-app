"use client";

import { use } from "react";
import {
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminTaskByIdQuery } from "@/features/admin/adminTasksApi";
import { TASK_PRIORITY_AR, TASK_STATUS_AR } from "@hassad/shared";
import { cn } from "@/lib/utils";

export default function TaskOverviewTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task } = useGetAdminTaskByIdQuery(id);

  if (!task) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="معلومات المهمة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <FileText className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">العنوان</p>
              <p className="text-sm font-medium text-natural-100">{task.title}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">المشروع</p>
              <p className="text-sm font-medium text-natural-100">
                {task.project.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">المسند إليه</p>
              <p className="text-sm font-medium text-natural-100">
                {task.assignee?.name || "—"}
              </p>
              {task.assignee && (
                <p className="text-xs text-portal-note-text mt-0.5">
                  {task.assignee.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <User className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">المنشئ</p>
              <p className="text-sm font-medium text-natural-100">
                {task.creator.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <span className="mt-0.5">
              <AdminStatusBadge domain="task" status={task.status} />
            </span>
            <div>
              <p className="text-xs text-portal-note-text">الحالة</p>
              <p className="text-sm font-medium text-natural-100">
                {TASK_STATUS_AR[task.status as keyof typeof TASK_STATUS_AR] || task.status}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <AlertCircle className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">الأولوية</p>
              <p className="text-sm font-medium text-natural-100">
                {TASK_PRIORITY_AR[task.priority as keyof typeof TASK_PRIORITY_AR] || task.priority}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ الإنشاء</p>
              <p className="text-sm font-medium text-natural-100">
                {new Date(task.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Calendar className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-natural-100">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {task.description && (
        <SurfaceCard title="الوصف">
          <p className="text-sm text-natural-100 whitespace-pre-wrap leading-7">
            {task.description}
          </p>
        </SurfaceCard>
      )}

      <SurfaceCard title="التواريخ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <Clock className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-xs text-portal-note-text">تاريخ البدء</p>
            <p className="text-sm font-medium text-natural-100 mt-1">
              {task.startedAt
                ? new Date(task.startedAt).toLocaleDateString("ar-SA")
                : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <Clock className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-xs text-portal-note-text">تاريخ التسليم</p>
            <p className="text-sm font-medium text-natural-100 mt-1">
              {task.submittedAt
                ? new Date(task.submittedAt).toLocaleDateString("ar-SA")
                : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <CheckCircle2 className="h-5 w-5 text-secondary-500 mx-auto mb-2" />
            <p className="text-xs text-portal-note-text">تاريخ الاعتماد</p>
            <p className="text-sm font-medium text-natural-100 mt-1">
              {task.approvedAt
                ? new Date(task.approvedAt).toLocaleDateString("ar-SA")
                : "—"}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-portal-card-border text-center">
          <p className="text-2xl font-semibold text-natural-100">
            {task.revisionCount}
          </p>
          <p className="text-xs text-portal-note-text mt-1">عدد المراجعات</p>
        </div>
        <div className="p-4 rounded-xl border border-portal-card-border text-center">
          <p className="text-2xl font-semibold text-natural-100">
            {task.department.name}
          </p>
          <p className="text-xs text-portal-note-text mt-1">القسم</p>
        </div>
        <div className="p-4 rounded-xl border border-portal-card-border text-center">
          <p className="text-2xl font-semibold text-natural-100">
            {task.files.length}
          </p>
          <p className="text-xs text-portal-note-text mt-1">الملفات المرفقة</p>
        </div>
      </div>
    </div>
  );
}
