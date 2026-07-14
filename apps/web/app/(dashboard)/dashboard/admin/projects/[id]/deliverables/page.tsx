"use client";

import { use } from "react";
import { FileText, Video, Calendar, User } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";

export default function DeliverablesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  return (
    <div className="space-y-5">
      <SurfaceCard title="الملفات">
        {project.files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100">
                  <FileText className="h-5 w-5 text-secondary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-natural-100 truncate">
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-portal-note-text flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {file.uploadedBy}
                    </span>
                    <span className="text-xs text-portal-note-text">
                      {new Date(file.uploadedAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-portal-note-text py-8 text-center">
            لا توجد ملفات مرفوعة
          </p>
        )}
      </SurfaceCard>

      <SurfaceCard title="الاجتماعات">
        {project.meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100">
                  <Video className="h-5 w-5 text-info-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-natural-100">
                    {meeting.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-portal-note-text flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(meeting.scheduledAt).toLocaleDateString(
                        "ar-SA",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  {meeting.notes && (
                    <p className="text-xs text-portal-note-text mt-2 line-clamp-2">
                      {meeting.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-portal-note-text py-8 text-center">
            لا توجد اجتماعات مجدولة
          </p>
        )}
      </SurfaceCard>
    </div>
  );
}
