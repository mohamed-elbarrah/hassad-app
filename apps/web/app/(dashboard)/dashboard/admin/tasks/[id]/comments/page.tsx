"use client";

import { use } from "react";
import { MessageSquareText, Paperclip } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTaskByIdQuery } from "@/features/admin/adminTasksApi";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskCommentsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task } = useGetAdminTaskByIdQuery(id);

  if (!task) return null;

  if (!task.comments.length && !task.files.length) {
    return (
      <AdminEmptyState
        icon={MessageSquareText}
        title="لا يوجد تعليقات"
        description="لم يتم إضافة أي تعليقات أو ملفات لهذه المهمة."
      />
    );
  }

  return (
    <div className="space-y-5">
      {task.comments.length > 0 && (
        <SurfaceCard title="التعليقات">
          <div className="space-y-4">
            {task.comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 text-sm font-medium shrink-0">
                  {comment.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-natural-100">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-portal-note-text">
                      {new Date(comment.createdAt).toLocaleString("ar-SA")}
                    </span>
                  </div>
                  <p className="text-sm text-portal-text mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {task.files.length > 0 && (
        <SurfaceCard title="الملفات المرفقة">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {task.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-gray-bg shrink-0">
                  <Paperclip className="h-5 w-5 text-portal-icon" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-natural-100 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-portal-note-text">
                    {formatFileSize(file.fileSize)} ·{" "}
                    {file.fileType.toUpperCase()} ·{" "}
                    {new Date(file.uploadedAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
