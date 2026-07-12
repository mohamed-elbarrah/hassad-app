"use client";

import { use } from "react";
import { Clock, User, Info } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";

export default function TimelineTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project } = useGetAdminProjectByIdQuery(id);

  if (!project) return null;

  return (
    <SurfaceCard title="التسلسل الزمني">
      {project.history.length > 0 ? (
        <div className="relative">
          <div className="absolute right-4 top-0 bottom-0 w-px bg-portal-divider" />
          <div className="space-y-4">
            {[...project.history]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((entry) => (
                <div key={entry.id} className="relative pr-10">
                  <div className="absolute right-2.5 top-1.5 h-3 w-3 rounded-full bg-secondary-500 ring-2 ring-white" />
                  <div className="p-4 rounded-xl border border-portal-card-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-secondary-500" />
                        <span className="text-sm font-medium text-natural-100">
                          {entry.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-portal-note-text">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-portal-note-text">
                      <User className="h-3 w-3" />
                      {entry.userName}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-portal-note-text py-8 text-center">
          لا توجد أحداث في التسلسل الزمني
        </p>
      )}
    </SurfaceCard>
  );
}
