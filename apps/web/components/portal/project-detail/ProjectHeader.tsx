"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Ticket } from "lucide-react";
import type { PortalProjectDetail } from "@/features/portal/portalApi";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { ActionButton } from "@/components/design-system/ActionButton";

interface ProjectHeaderProps {
  project: PortalProjectDetail;
}

/** Page header: back button + project name + client company + status badge. */
export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();

  const initials = (project.client?.companyName ?? project.name)
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir="rtl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/portal/projects")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-portal-card-border bg-natural-0 text-portal-icon transition-colors hover:bg-badge-gray-bg"
          aria-label="رجوع"
        >
          <ChevronRight className="size-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-natural-100">
              {project.name}
            </h1>
            <StatusBadge status={mapProjectStatusToUI(project.status)} />
          </div>
          <p className="text-sm text-portal-note-text">
            {project.client?.companyName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ActionButton
          variant="outline"
          size="sm"
          onClick={() => router.push(`/portal/disputes?projectId=${project.id}`)}
          className="h-10 rounded-xl border-portal-divider text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-2"
        >
          <Ticket className="h-4 w-4" />
          فتح تذكرة
        </ActionButton>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-natural-100 text-xl font-bold text-white">
          {initials}
        </div>
      </div>
    </div>
  );
}