"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, UserRound, X } from "lucide-react";
import type { PortalProjectWorkspaceTask } from "@/features/portal/portalApi";
import {
  useApprovePortalTaskMutation,
  useRequestPortalTaskRevisionMutation,
} from "@/features/portal/portalApi";
import { TaskReviewStage, TASK_STATUS_AR } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { EmptyState } from "./EmptyState";
import { formatDateTz } from "@/lib/format";
import {
  portalErrorMessage,
  taskDepartmentLabel,
  taskReviewStageLabel,
} from "@/lib/i18n";
import { toast } from "sonner";

export function TasksTab({
  tasks,
  focusTaskId,
}: {
  tasks: PortalProjectWorkspaceTask[];
  focusTaskId?: string | null;
}) {
  useEffect(() => {
    if (!focusTaskId) return;
    document
      .getElementById(`portal-task-${focusTaskId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusTaskId, tasks]);

  const [approveTask, { isLoading: approving }] =
    useApprovePortalTaskMutation();
  const [requestRevision, { isLoading: revising }] =
    useRequestPortalTaskRevisionMutation();
  const [revisionTaskId, setRevisionTaskId] = useState<string | null>(null);
  const [revisionDescription, setRevisionDescription] = useState("");

  if (!tasks.length) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="لا توجد مهام مرئية للعميل"
        description="ستظهر مهام المشروع هنا بعد إتاحتها للمراجعة."
      />
    );
  }

  const approve = async (taskId: string) => {
    try {
      await approveTask(taskId).unwrap();
      toast.success("تم اعتماد المهمة");
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  };

  const submitRevision = async (taskId: string) => {
    if (!revisionDescription.trim()) return;
    try {
      await requestRevision({
        taskId,
        requestDescription: revisionDescription.trim(),
      }).unwrap();
      toast.success("تم إرسال طلب التعديل");
      setRevisionTaskId(null);
      setRevisionDescription("");
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => {
        const canReview = task.reviewStage === TaskReviewStage.CLIENT_REVIEW;
        return (
          <Card key={task.id} id={`portal-task-${task.id}`}>
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge variant={canReview ? "secondary" : "outline"}>
                  {taskReviewStageLabel(task.reviewStage)}
                </Badge>
              </div>
              {task.description ? (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span>
                    {task.assignee?.name ?? "غير محدد"}
                    {task.assignee?.jobTitle
                      ? ` — ${task.assignee.jobTitle}`
                      : ""}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  القسم: {taskDepartmentLabel(task.department)}
                </div>
                <div className="text-muted-foreground">
                  التسليم: {formatDateTz(task.dueDate)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress
                  value={task.progress}
                  aria-label={`نسبة إنجاز ${task.title}`}
                />
                <span className="text-sm text-muted-foreground">
                  {task.progress}%
                </span>
              </div>

              {task.revisionRequests.length ? (
                <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning/5 p-3">
                  <p className="text-sm font-medium">سجل طلبات التعديل</p>
                  {task.revisionRequests.map((request) => (
                    <div key={request.id} className="text-sm">
                      <p>{request.requestDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTz(request.createdAt)} —{" "}
                        {request.status === "RESOLVED"
                          ? "تمت المعالجة"
                          : "مفتوح"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {task.files.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">ملفات التسليم</p>
                  {task.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!file.url}
                      className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="size-4" />
                        {file.fileName}
                      </span>
                      {file.url ? (
                        <Download className="size-4" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          غير متاح
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              ) : null}

              {canReview ? (
                revisionTaskId === task.id ? (
                  <div className="flex flex-col gap-3">
                    <Label htmlFor={`task-revision-${task.id}`}>
                      تفاصيل التعديل المطلوب
                    </Label>
                    <Textarea
                      id={`task-revision-${task.id}`}
                      value={revisionDescription}
                      onChange={(event) =>
                        setRevisionDescription(event.target.value)
                      }
                      placeholder="اكتب التعديلات المطلوبة..."
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setRevisionTaskId(null)}
                        disabled={revising}
                      >
                        <X /> إلغاء
                      </Button>
                      <Button
                        onClick={() => submitRevision(task.id)}
                        disabled={revising || !revisionDescription.trim()}
                      >
                        إرسال طلب التعديل
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRevisionTaskId(task.id)}
                    >
                      طلب تعديل
                    </Button>
                    <Button
                      onClick={() => approve(task.id)}
                      disabled={approving}
                    >
                      <CheckCircle2 /> اعتماد المهمة
                    </Button>
                  </div>
                )
              ) : null}

              {task.reviewStage === TaskReviewStage.CLIENT_APPROVED ? (
                <p className="text-sm text-success">
                  {TASK_STATUS_AR.DONE} — تم اعتماد نتيجة المهمة.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
