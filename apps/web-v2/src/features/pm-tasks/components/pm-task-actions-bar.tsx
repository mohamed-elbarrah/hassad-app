"use client";

import { useState } from "react";
import { FileUpIcon } from "lucide-react";
import { FilePurpose, TaskStatus } from "@hassad/shared";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskDetailRecord } from "@/features/tasks/lib/task-detail";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useUpdatePmTaskStatusMutation, useUploadPmTaskFileMutation } from "@/lib/api/pm-tasks-api";

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To do",
  [TaskStatus.IN_PROGRESS]: "In progress",
  [TaskStatus.IN_REVIEW]: "In review",
  [TaskStatus.DONE]: "Done",
  [TaskStatus.REVISION]: "Revision",
};

export function PmTaskActionsBar({ task }: { task: TaskDetailRecord }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(FilePurpose.REFERENCE);

  const [updateStatus, updateStatusState] = useUpdatePmTaskStatusMutation();
  const [uploadFile, uploadFileState] = useUploadPmTaskFileMutation();

  const submitStatus = async () => {
    try {
      await updateStatus({ taskId: task.id, status }).unwrap();
      showCrmActionToast({ type: "success", title: "Task status updated", description: `Status moved to ${statusLabels[status]}.` });
      setStatusOpen(false);
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitFile = async () => {
    try {
      if (!selectedFile) return;
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("purpose", filePurpose);
      await uploadFile({ taskId: task.id, body }).unwrap();
      showCrmActionToast({ type: "success", title: "File uploaded", description: "The task file was attached." });
      setSelectedFile(null);
      setFileOpen(false);
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setStatusOpen(true)}>Status</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setFileOpen(true)}><FileUpIcon data-icon="inline-start" /> File</Button>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update task status</DialogTitle>
            <DialogDescription>Move the task through the workflow.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pm-task-status">Status</FieldLabel>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger id="pm-task-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(TaskStatus).map((value) => <SelectItem key={value} value={value}>{statusLabels[value]}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusOpen(false)} disabled={updateStatusState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitStatus} disabled={updateStatusState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload task file</DialogTitle>
            <DialogDescription>Attach a working file or delivery artifact.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pm-task-file">File</FieldLabel>
              <Input id="pm-task-file" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            </Field>
            <Field>
              <FieldLabel>Purpose</FieldLabel>
              <Select value={filePurpose} onValueChange={(value) => setFilePurpose(value as FilePurpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={FilePurpose.REFERENCE}>Reference</SelectItem>
                    <SelectItem value={FilePurpose.INTERNAL_DRAFT}>Internal draft</SelectItem>
                    <SelectItem value={FilePurpose.DELIVERABLE}>Deliverable</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFileOpen(false)} disabled={uploadFileState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitFile} disabled={uploadFileState.isLoading || !selectedFile}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
