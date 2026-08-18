"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { PortalProjectDetail } from "@/features/portal/portalApi";
import type { CreateDisputeInput } from "@hassad/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewDisputeDialog } from "@/components/disputes";
import { portalErrorMessage } from "@/lib/i18n";
import { useCreateDisputeMutation } from "@/features/portal/portalApi";

interface ProjectHeaderProps {
  project: PortalProjectDetail;
}

/**
 * Uses the shared portal page-header pattern: a compact breadcrumb,
 * consistent title/description hierarchy, project metadata, and a single
 * contextual action.
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
      toast.error("خطأ", { description: portalErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/projects">
            <ArrowRight data-icon="inline-start" />
            المشاريع
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="max-w-xs truncate text-muted-foreground">
          {project.name}
        </span>
      </div>

      <PageHeader
        title={project.name}
        description={
          project.description ||
          "ملخص واضح للتنفيذ التجاري والتشغيلي لهذا المشروع."
        }
        icon={FolderKanban}
        actions={
          <>
            <Badge variant="outline">بوابة العميل</Badge>
            <Badge variant="secondary">
              التقدم {project.completionPercentage}%
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisputeOpen(true)}
            >
              <Ticket data-icon="inline-start" />
              فتح تذكرة
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">العميل: {project.client.companyName}</Badge>
        <Badge variant="outline">
          مدير المشروع: {project.manager?.name || "غير محدد"}
        </Badge>
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
