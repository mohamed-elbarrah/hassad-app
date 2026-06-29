"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
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

/**
 * Page header for the project detail page.
 *
 * Layout follows the standard portal detail-page pattern used by
 * `/portal/contracts/[id]`, `/portal/campaigns/[id]`, and
 * `/portal/proposals/[token]`:
 *
 *   1. Breadcrumb row — `<Link>` + ghost ActionButton labelled "المشاريع"
 *      separated by `/` from the current page title.
 *   2. Content row    — title + status badge on the left, primary action
 *      ("فتح تذكرة") on the right.
 *
 * The breadcrumb is owned here rather than in the page so the header stays
 * a single self-contained unit. The `compact` variant exists for callers
 * that already render their own breadcrumb (none today, kept for symmetry
 * with the design-system breadcrumb used elsewhere).
 */
export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [createDispute, { isLoading: isCreating }] = useCreateDisputeMutation();

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
    } catch (error) {
      const message =
        error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
      toast.error("خطأ", { description: message });
    }
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* ── Breadcrumb (standard portal detail-page pattern) ────────── */}
      <div className="flex items-center gap-2">
        <Link href="/portal/projects">
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            المشاريع
          </ActionButton>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {project.name}
        </span>
      </div>

      {/* ── Title + primary action row ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-natural-100">
            {project.name}
          </h1>
          <StatusBadge status={mapProjectStatusToUI(project.status)} />
        </div>

        <div className="flex items-center gap-3">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => setDisputeOpen(true)}
            className="h-10 rounded-xl border text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-2"
          >
            <Ticket className="h-4 w-4" />
            فتح تذكرة
          </ActionButton>
        </div>
      </div>

      {/* ── Client company line ────────────────────────────────────── */}
      {project.client?.companyName && (
        <p className="-mt-2 text-sm text-portal-note-text">
          {project.client.companyName}
        </p>
      )}

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
