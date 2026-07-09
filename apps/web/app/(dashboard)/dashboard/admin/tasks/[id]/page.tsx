"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ListChecks, Upload, Send, FileText, Clock } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminTaskQuery } from "@/features/admin/adminApi";
import { useAddTaskCommentMutation, useUploadTaskFileMutation } from "@/features/tasks/tasksApi";
import { TASK_STATUS_AR } from "@hassad/shared";
import { toast } from "sonner";

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: task, isLoading, refetch } = useGetAdminTaskQuery(id);
  const [addComment, { isLoading: isSendingComment }] = useAddTaskCommentMutation();
  const [uploadFile] = useUploadTaskFileMutation();
  const [commentText, setCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                        task.priority === "HIGH" || task.priority === "URGENT"
                          ? "danger"
                          : task.priority === "MEDIUM" || task.priority === "NORMAL"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {task.priority}
                    </Pill>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      تاريخ الإنشاء
                    </span>
                    <p className="text-base font-medium">
                      {task.createdAt?.slice(0, 10) ?? "—"}
                    </p>
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
                      عدد مرات الإرجاع للمراجعة
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-warning-600">
                        {task.revisionCount ?? 0}
                      </span>
                      {task.revisionCount > 0 && (
                        <Pill tone="warning">تم إرجاعها {task.revisionCount} مرة</Pill>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الوقت المنقضي</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="size-4 text-portal-icon" />
                      <p className="text-base font-medium">
                        {(() => {
                          const created = new Date(task.createdAt).getTime();
                          const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
                          if (days > 0) return `${days} يوم`;
                          const hours = Math.floor((Date.now() - created) / (1000 * 60 * 60));
                          if (hours > 0) return `${hours} ساعة`;
                          return "أقل من ساعة";
                        })()}
                      </p>
                    </div>
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
              <div className="space-y-4">
                <div className="flex gap-2">
                  <FormInputControl
                    placeholder="اكتب تعليقاً..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                  />
                  <ActionButton
                    variant="primary"
                    size="md"
                    disabled={!commentText.trim() || isSendingComment}
                    onClick={async () => {
                      if (!commentText.trim()) return;
                      try {
                        await addComment({
                          taskId: id,
                          content: commentText,
                        }).unwrap();
                        setCommentText("");
                        refetch();
                      } catch {
                        toast.error("فشل إرسال التعليق");
                      }
                    }}
                  >
                    <Send className="size-4" />
                  </ActionButton>
                </div>
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
              </div>
            </TabsContent>
            <TabsContent value="files">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadFile({ taskId: id, file }).unwrap();
                        toast.success("تم رفع الملف");
                        refetch();
                      } catch {
                        toast.error("فشل رفع الملف");
                      }
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <ActionButton
                    variant="outline"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    رفع ملف
                  </ActionButton>
                </div>
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
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-portal-icon" />
                          {f.fileName}
                        </div>
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>
    </div>
  );
}
