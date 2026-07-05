"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ListChecks } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminTaskQuery } from "@/features/admin/adminApi";
import { TASK_STATUS_AR } from "@hassad/shared";

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: task, isLoading } = useGetAdminTaskQuery(id);

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!task)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        المهمة غير موجودة
      </div>
    );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={task.title}
        description={`${task.project?.name ?? "—"} · ${TASK_STATUS_AR[task.status] ?? task.status}`}
        icon={ListChecks}
        actions={
          <ActionButton
            variant="outline"
            size="md"
            onClick={() => router.back()}
          >
            <ArrowRight className="size-4 ml-1" />
            العودة
          </ActionButton>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
            <TabsTrigger value="comments">التعليقات</TabsTrigger>
            <TabsTrigger value="files">الملفات</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      المشروع
                    </span>
                    <p className="text-base font-medium">
                      {task.project?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      المسند إلى
                    </span>
                    <p className="text-base font-medium">
                      {task.assignee?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الحالة
                    </span>
                    <div className="mt-1">
                      <StatusBadge
                        status={task.status}
                        label={TASK_STATUS_AR[task.status] ?? task.status}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الأولوية
                    </span>
                    <Pill
                      tone={
                        task.priority === "HIGH"
                          ? "danger"
                          : task.priority === "MEDIUM"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {task.priority}
                    </Pill>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      تاريخ التسليم
                    </span>
                    <p className="text-base font-medium">
                      {task.dueDate?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">القسم</span>
                    <p className="text-base font-medium">
                      {task.department?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      عدد المراجعات
                    </span>
                    <p className="text-base font-medium">
                      {task.revisionCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الوصف</span>
                    <p className="text-base font-medium">
                      {task.description ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <DataTable
                columns={[
                  { id: "from", label: "من" },
                  { id: "to", label: "إلى" },
                  { id: "by", label: "بواسطة" },
                  { id: "at", label: "التاريخ", align: "left" },
                ]}
                data={task.statusHistory ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: ListChecks,
                  message: "لا يوجد سجل",
                  hint: "لم يتم تسجيل أي تغييرات في الحالة بعد",
                }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge
                        status={h.fromStatus}
                        label={TASK_STATUS_AR[h.fromStatus] ?? h.fromStatus}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge
                        status={h.toStatus}
                        label={TASK_STATUS_AR[h.toStatus] ?? h.toStatus}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {h.changedBy ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {h.changedAt?.slice(0, 16) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="comments">
              <div className="space-y-3">
                {(task.comments ?? []).map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-portal-divider p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {c.user?.name ?? "—"}
                      </span>
                      <span className="text-xs text-portal-note-text">
                        {c.createdAt?.slice(0, 16) ?? ""}
                      </span>
                    </div>
                    <p className="text-sm text-portal-icon">{c.content}</p>
                  </div>
                ))}
                {(!task.comments || task.comments.length === 0) && (
                  <p className="text-center text-portal-note-text py-8">
                    لا توجد تعليقات
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="files">
              <DataTable
                columns={[
                  { id: "name", label: "الملف" },
                  { id: "type", label: "النوع" },
                  { id: "size", label: "الحجم" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={task.files ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: ListChecks,
                  message: "لا توجد ملفات",
                  hint: "لم يتم رفع ملفات لهذه المهمة بعد",
                }}
                renderRow={(f: any) => (
                  <tr key={f.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {f.fileName}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {f.fileType ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {f.fileSize
                        ? `${(f.fileSize / 1024).toFixed(0)} KB`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {f.uploadedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>
    </div>
  );
}
