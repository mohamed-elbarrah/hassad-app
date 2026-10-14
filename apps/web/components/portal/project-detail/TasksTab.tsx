"use client";

import { Fragment, useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, ListTodo, X } from "lucide-react";
import type { PortalProjectWorkspaceTask } from "@/features/portal/portalApi";
import {
  useApprovePortalTaskMutation,
  useRequestPortalTaskRevisionMutation,
} from "@/features/portal/portalApi";
import { TASK_STATUS_AR } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./EmptyState";
import { formatDateTz } from "@/lib/format";
import { portalErrorMessage, UNKNOWN_STATUS_LABEL } from "@/lib/i18n";
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
        icon={ListTodo}
        title="لا توجد مهام للمشروع"
        description="ستظهر هنا المهام المضافة إلى خطة العمل مع حالتها وموعد تسليمها."
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
    <Table>
      <TableCaption>
        قائمة مهام المشروع وحالتها والموظف المسؤول وموعد التسليم.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>المهمة</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>الموظف المسؤول</TableHead>
          <TableHead>موعد التسليم</TableHead>
          <TableHead>ملفات التسليم</TableHead>
          <TableHead>الإجراء</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const canReview = task.canReview;
          return (
            <Fragment key={task.id}>
              <TableRow id={`portal-task-${task.id}`}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={canReview ? "secondary" : "outline"}>
                    {TASK_STATUS_AR[task.status] ?? UNKNOWN_STATUS_LABEL}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.assignee?.name ?? "غير محدد"}
                  {task.assignee?.jobTitle ? ` — ${task.assignee.jobTitle}` : ""}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTz(task.dueDate)}
                </TableCell>
                <TableCell>
                  {task.files.length ? (
                    <div className="flex flex-col gap-1">
                      {task.files.map((file) => (
                        file.url ? (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                          >
                            <FileText data-icon="inline-start" />
                            <span className="max-w-40 truncate">{file.fileName}</span>
                            <Download data-icon="inline-end" />
                          </a>
                        ) : (
                          <span key={file.id} className="text-muted-foreground">
                            {file.fileName} — غير متاح
                          </span>
                        )
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {canReview ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevisionTaskId(task.id);
                          setRevisionDescription("");
                        }}
                      >
                        طلب تعديل
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approve(task.id)}
                        disabled={approving}
                      >
                        <CheckCircle2 data-icon="inline-start" />
                        اعتماد
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
              {revisionTaskId === task.id ? (
                <TableRow key={`${task.id}-revision`}>
                  <TableCell colSpan={6}>
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
                          <X data-icon="inline-start" /> إلغاء
                        </Button>
                        <Button
                          onClick={() => submitRevision(task.id)}
                          disabled={revising || !revisionDescription.trim()}
                        >
                          إرسال طلب التعديل
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
