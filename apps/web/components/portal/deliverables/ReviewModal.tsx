"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ProjectReviewDetail,
  ReviewProject,
} from "@/features/portal/portalApi";
import {
  useApproveProjectMutation,
  useRequestProjectRevisionMutation,
} from "@/features/portal/portalApi";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export function ReviewModal({
  selectedProjectId,
  selectedProject,
  fallbackProject,
  onActionComplete,
  onOpenChange,
}: {
  selectedProjectId: string | null;
  selectedProject: ProjectReviewDetail | undefined;
  fallbackProject: ReviewProject | undefined;
  onActionComplete: (id: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [comment, setComment] = useState("");
  const [composer, setComposer] = useState(false);
  const [approve, { isLoading: approving }] = useApproveProjectMutation();
  const [revision, { isLoading: revising }] =
    useRequestProjectRevisionMutation();
  const open = Boolean(selectedProjectId);
  const close = () => {
    setComment("");
    setComposer(false);
    onOpenChange(false);
  };
  const approveProject = async () => {
    if (!selectedProjectId) return;
    try {
      await approve(selectedProjectId).unwrap();
      toast.success("تمت الموافقة على المشروع بنجاح");
      onActionComplete(selectedProjectId);
      close();
    } catch {
      toast.error("حدث خطأ أثناء الموافقة على المشروع");
    }
  };
  const requestRevision = async () => {
    if (!selectedProjectId || !comment.trim()) return;
    try {
      await revision({
        id: selectedProjectId,
        comment: comment.trim(),
      }).unwrap();
      toast.success("تم إرسال طلب التعديل بنجاح");
      onActionComplete(selectedProjectId);
      close();
    } catch {
      toast.error("حدث خطأ أثناء إرسال طلب التعديل");
    }
  };
  const project = selectedProject ?? fallbackProject;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project?.name ?? "مراجعة المشروع"}</DialogTitle>
          <DialogDescription>
            {project?.description ??
              "راجع الملفات ثم وافق على المشروع أو اطلب تعديلات."}
          </DialogDescription>
        </DialogHeader>
        {!project ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <DomainStatusPill domain="project" status={project.status} />
              <span className="text-sm text-muted-foreground">
                {project.manager?.name ?? "بدون مدير"}
              </span>
            </div>
            <Separator />
            <div>
              <p className="mb-3 flex items-center gap-2 font-medium">
                <Paperclip />
                المرفقات (
                {selectedProject?.files?.length ??
                  ("deliverableCount" in project ? project.deliverableCount : 0) ??
                  0}
                )
              </p>
              {selectedProject?.files?.length ? (
                <div className="flex flex-col gap-2">
                  {selectedProject.files.map((file) => (
                    <Button
                      key={file.id}
                      asChild
                      variant="outline"
                      className="justify-between"
                    >
                      <a
                        href={file.url ?? buildPortalFileUrl(file.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText />
                          {file.fileName}
                        </span>
                        <Download />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا توجد ملفات مرفقة.
                </p>
              )}
            </div>
            {composer ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle />
                  صف التعديلات المطلوبة بدقة.
                </div>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="اكتب التعديلات المطلوبة..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setComposer(false)}
                    disabled={revising}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={requestRevision}
                    disabled={revising || !comment.trim()}
                  >
                    {revising ? "جارٍ الإرسال..." : "إرسال طلب التعديل"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setComposer(true)}>
                  <AlertTriangle />
                  طلب تعديلات
                </Button>
                <Button onClick={approveProject} disabled={approving}>
                  <CheckCircle2 />
                  {approving ? "جارٍ الموافقة..." : "موافقة"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
