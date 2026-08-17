"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { PortalProjectDetail } from "@/features/portal/portalApi";
import type { CreateDisputeInput } from "@hassad/shared";
import { ProjectSummaryCard, type ProjectDetailEntity } from "@/components/project-detail/ProjectDetailPattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const projectEntity: ProjectDetailEntity = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    clientId: project.client.id,
    startDate: project.startDate,
    endDate: project.endDate,
    completionPercentage: project.completionPercentage,
    updatedAt: project.updatedAt,
    isArchived: false,
    client: {
      id: project.client.id,
      companyName: project.client.companyName,
    },
    manager: project.manager
      ? {
          id: project.manager.id,
          name: project.manager.name,
          email: undefined,
        }
      : null,
    contract: null,
  };

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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/projects">
            <ArrowRight data-icon="inline-start" />
            المشاريع
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="max-w-xs truncate text-sm font-medium">
          {project.name}
        </span>
      </div>

      <ProjectSummaryCard
        project={projectEntity}
        badges={[
          <Badge key="portal" variant="outline">
            بوابة العميل
          </Badge>,
          <Badge key="progress" variant="secondary">
            التقدم {project.completionPercentage}%
          </Badge>,
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDisputeOpen(true)}
          >
            <Ticket data-icon="inline-start" />
            فتح تذكرة
          </Button>
        }
      />

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
