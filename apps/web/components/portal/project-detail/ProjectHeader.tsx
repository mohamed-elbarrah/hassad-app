"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { PortalProjectDetail } from "@/features/portal/portalApi";
import type { CreateDisputeInput } from "@hassad/shared";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { ActionButton } from "@/components/design-system/ActionButton";
import { NewDisputeDialog } from "@/components/disputes";
import { useCreateDisputeMutation } from "@/features/portal/portalApi";

interface ProjectHeaderProps {
  project: PortalProjectDetail;
}

/** Page header: back button + project name + client company + status badge. */
export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [createDispute, { isLoading: isCreating }] = useCreateDisputeMutation();

  const initials = (project.client?.companyName ?? project.name)
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleCreateDispute = async (
    data: CreateDisputeInput,
    files?: File[],
  ) => {
    try {
      await createDispute({ ...data, files }).unwrap();
      toast.success("تم إرسال التذكرة", {
        description: "تم استلام تذكرتك. سيتم مراجعتها من قبل الإدارة.",
      });
      setDisputeOpen(false);
    } catch (error: any) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
      toast.error("خطأ", { description: message });
    }
  };

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
          onClick={() => setDisputeOpen(true)}
          className="h-10 rounded-xl border-portal-divider text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-2"
        >
          <Ticket className="h-4 w-4" />
          فتح تذكرة
        </ActionButton>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-natural-100 text-xl font-bold text-white">
          {initials}
        </div>
      </div>

      <NewDisputeDialog
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        onSubmit={handleCreateDispute}
        isLoading={isCreating}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
}
