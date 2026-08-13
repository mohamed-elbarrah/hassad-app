"use client";

import { useMemo, useState } from "react";
import { CalendarPlusIcon, DownloadIcon, FileUpIcon, MessageSquareMoreIcon, PencilLineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectDetailRecord } from "@/features/projects/lib/project-detail";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import {
  useCreatePmMeetingMutation,
  useCreatePmTaskMutation,
  useGetPmAssignableUsersQuery,
  useGetPmProjectFilesQuery,
  useUpdatePmMeetingMutation,
  useUploadPmProjectFileMutation,
} from "@/lib/api/pm-project-actions-api";
import { FilePurpose, TaskDepartment, TaskPriority } from "@hassad/shared";

type Props = { project: ProjectDetailRecord };

const departments = [TaskDepartment.DESIGN, TaskDepartment.CONTENT, TaskDepartment.DEVELOPMENT, TaskDepartment.MARKETING, TaskDepartment.PRODUCTION];
const departmentLabel: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "Design",
  [TaskDepartment.CONTENT]: "Content",
  [TaskDepartment.DEVELOPMENT]: "Development",
  [TaskDepartment.MARKETING]: "Marketing",
  [TaskDepartment.PRODUCTION]: "Production",
};
const priorityLabel: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.NORMAL]: "Normal",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.URGENT]: "Urgent",
};
const filePurposeLabel: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "Deliverable",
  [FilePurpose.REFERENCE]: "Reference",
  [FilePurpose.INTERNAL_DRAFT]: "Internal draft",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function PmProjectActionsBar({ project }: Props) {
  const hasPeriods = project.periods.length > 0;
  const currentPeriodId = useMemo(
    () => project.periods.find((period) => period.markerLabel === "Current")?.id ?? project.periods[0]?.id ?? "",
    [project.periods],
  );

  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskDept, setTaskDept] = useState<TaskDepartment>(TaskDepartment.DESIGN);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.NORMAL);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPeriodId, setTaskPeriodId] = useState(currentPeriodId);
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskVisibleToClient, setTaskVisibleToClient] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingScheduledAt, setMeetingScheduledAt] = useState("");
  const [meetingDurationMin, setMeetingDurationMin] = useState(60);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPeriodId, setMeetingPeriodId] = useState(currentPeriodId);
  const [selectedMeetingId, setSelectedMeetingId] = useState(project.meetingRows[0]?.id ?? "");
  const [meetingNote, setMeetingNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePeriodId, setFilePeriodId] = useState(currentPeriodId);
  const [filePurpose, setFilePurpose] = useState(FilePurpose.DELIVERABLE);

  const [createTask, createTaskState] = useCreatePmTaskMutation();
  const [createMeeting, createMeetingState] = useCreatePmMeetingMutation();
  const [updateMeeting, updateMeetingState] = useUpdatePmMeetingMutation();
  const [uploadFile, uploadFileState] = useUploadPmProjectFileMutation();
  const { data: assignableUsers } = useGetPmAssignableUsersQuery({ projectId: project.id, dept: taskDept, limit: 50 }, { skip: !taskOpen });
  const { data: projectFiles } = useGetPmProjectFilesQuery({ projectId: project.id }, { skip: !fileOpen });

  const selectedAssigneeLabel = assignableUsers?.items.find((user) => user.id === taskAssigneeId)?.name ?? "Not selected";
  const selectedPeriodLabel = (periodId: string) => {
    if (!periodId) return "Project scope";
    return project.periods.find((period) => period.id === periodId)?.label ?? "Selected period";
  };
  const selectedMeetingLabel = project.meetingRows.find((meeting) => meeting.id === selectedMeetingId)?.title ?? "Not selected";
  const selectedDepartmentLabel = departmentLabel[taskDept];
  const selectedPriorityLabel = priorityLabel[taskPriority];
  const selectedFilePurposeLabel = filePurposeLabel[filePurpose];

  const clearTask = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority(TaskPriority.NORMAL);
    setTaskDueDate("");
    setTaskPeriodId(currentPeriodId);
    setTaskAssigneeId("");
    setTaskVisibleToClient(false);
  };

  const clearMeeting = () => {
    setMeetingTitle("");
    setMeetingScheduledAt("");
    setMeetingDurationMin(60);
    setMeetingLocation("");
    setMeetingLink("");
    setMeetingPeriodId(currentPeriodId);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePeriodId(currentPeriodId);
    setFilePurpose(FilePurpose.DELIVERABLE);
  };

  const submitTask = async () => {
    try {
      const body = new FormData();
      body.append("dept", taskDept);
      body.append("title", taskTitle);
      body.append("priority", taskPriority);
      body.append("dueDate", taskDueDate);
      body.append("description", taskDescription);
      if (taskPeriodId) body.append("periodId", taskPeriodId);
      if (taskAssigneeId) body.append("assignedTo", taskAssigneeId);
      body.append("isVisibleToClient", String(taskVisibleToClient));
      await createTask({ projectId: project.id, body }).unwrap();
      showCrmActionToast({ type: "success", title: "Task created", description: "The task was added to the project." });
      setTaskOpen(false);
      clearTask();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitMeeting = async () => {
    try {
      const body = new FormData();
      body.append("title", meetingTitle);
      body.append("scheduledAt", meetingScheduledAt);
      body.append("durationMin", String(meetingDurationMin));
      if (meetingLocation) body.append("location", meetingLocation);
      if (meetingLink) body.append("meetingLink", meetingLink);
      if (meetingPeriodId) body.append("periodId", meetingPeriodId);
      await createMeeting({ projectId: project.id, body }).unwrap();
      showCrmActionToast({ type: "success", title: "Meeting scheduled", description: "The meeting was added to the project." });
      setMeetingOpen(false);
      clearMeeting();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitMeetingNote = async () => {
    try {
      if (!selectedMeetingId) return;
      await updateMeeting({ projectId: project.id, meetingId: selectedMeetingId, body: { notes: meetingNote } }).unwrap();
      showCrmActionToast({ type: "success", title: "Note saved", description: "The meeting note was attached." });
      setNoteOpen(false);
      setMeetingNote("");
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitFile = async () => {
    try {
      if (!selectedFile) return;
      const body = new FormData();
      body.append("file", selectedFile);
      if (filePeriodId) body.append("periodId", filePeriodId);
      body.append("purpose", filePurpose);
      await uploadFile({ projectId: project.id, body }).unwrap();
      showCrmActionToast({ type: "success", title: "File uploaded", description: "The file is now attached to the project." });
      setFileOpen(false);
      clearFile();
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
        <PencilLineIcon data-icon="inline-start" /> Task
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setMeetingOpen(true)}>
        <CalendarPlusIcon data-icon="inline-start" /> Meeting
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setFileOpen(true)}>
        <FileUpIcon data-icon="inline-start" /> File
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setNoteOpen(true)}>
        <MessageSquareMoreIcon data-icon="inline-start" /> Note
      </Button>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create and assign task</DialogTitle>
            <DialogDescription>Assign a new task to a team user in this project.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel>Title</FieldLabel><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} disabled={createTaskState.isLoading} /></Field>
              <Field><FieldLabel>Department</FieldLabel><Select value={taskDept} onValueChange={(value) => value && setTaskDept(value as TaskDepartment)}><SelectTrigger disabled={createTaskState.isLoading}><SelectValue>{departmentLabel[taskDept]}</SelectValue></SelectTrigger><SelectContent>{departments.map((dept) => <SelectItem key={dept} value={dept}>{departmentLabel[dept]}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Priority</FieldLabel><Select value={taskPriority} onValueChange={(value) => value && setTaskPriority(value as TaskPriority)}><SelectTrigger disabled={createTaskState.isLoading}><SelectValue>{selectedPriorityLabel}</SelectValue></SelectTrigger><SelectContent>{Object.values(TaskPriority).map((priority) => <SelectItem key={priority} value={priority}>{priorityLabel[priority]}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Due date</FieldLabel><Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} disabled={createTaskState.isLoading} /></Field>
              <Field><FieldLabel>Assignee</FieldLabel><Select value={taskAssigneeId} onValueChange={(value) => value && setTaskAssigneeId(value)}><SelectTrigger disabled={createTaskState.isLoading}><SelectValue>{selectedAssigneeLabel}</SelectValue></SelectTrigger><SelectContent>{(assignableUsers?.items ?? []).map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select><FieldDescription>Selected: {selectedAssigneeLabel}</FieldDescription></Field>
              <Field><FieldLabel>Period</FieldLabel><Select value={taskPeriodId} onValueChange={(value) => setTaskPeriodId(value ?? "") }><SelectTrigger disabled={createTaskState.isLoading}><SelectValue>{selectedPeriodLabel(taskPeriodId)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">Project scope</SelectItem>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select><FieldDescription>Selected: {selectedPeriodLabel(taskPeriodId)}</FieldDescription></Field>
            </div>
            <Field><FieldLabel>Description</FieldLabel><Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} disabled={createTaskState.isLoading} /></Field>
            <Field><FieldLabel>Visible to client</FieldLabel><Select value={taskVisibleToClient ? "yes" : "no"} onValueChange={(value) => setTaskVisibleToClient(value === "yes")}><SelectTrigger disabled={createTaskState.isLoading}><SelectValue placeholder="Visibility" /></SelectTrigger><SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent></Select></Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTaskOpen(false)} disabled={createTaskState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitTask} disabled={!taskTitle || !taskDueDate || !taskAssigneeId || createTaskState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule meeting</DialogTitle>
            <DialogDescription>Schedule a meeting for this project or one of its periods.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel>Title</FieldLabel><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} disabled={createMeetingState.isLoading} /></Field>
              <Field><FieldLabel>Date & time</FieldLabel><Input type="datetime-local" value={meetingScheduledAt} onChange={(e) => setMeetingScheduledAt(e.target.value)} disabled={createMeetingState.isLoading} /></Field>
              <Field><FieldLabel>Duration (min)</FieldLabel><Input type="number" value={meetingDurationMin} onChange={(e) => setMeetingDurationMin(Number(e.target.value))} disabled={createMeetingState.isLoading} /></Field>
              {hasPeriods ? <Field><FieldLabel>Period</FieldLabel><Select value={meetingPeriodId} onValueChange={(value) => setMeetingPeriodId(value ?? "")}><SelectTrigger disabled={createMeetingState.isLoading}><SelectValue>{selectedPeriodLabel(meetingPeriodId)}</SelectValue></SelectTrigger><SelectContent>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select><FieldDescription>Selected: {selectedPeriodLabel(meetingPeriodId)}</FieldDescription></Field> : null}
              <Field className="md:col-span-2"><FieldLabel>Location</FieldLabel><Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} disabled={createMeetingState.isLoading} /></Field>
              <Field className="md:col-span-2"><FieldLabel>Meeting link</FieldLabel><Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://..." disabled={createMeetingState.isLoading} /></Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMeetingOpen(false)} disabled={createMeetingState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitMeeting} disabled={!meetingTitle || !meetingScheduledAt || createMeetingState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
            <DialogDescription>Attach a file to the project or a specific period.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>File</FieldLabel><Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} disabled={uploadFileState.isLoading} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel>Period</FieldLabel><Select value={filePeriodId} onValueChange={(value) => setFilePeriodId(value ?? "")}><SelectTrigger disabled={uploadFileState.isLoading}><SelectValue>{selectedPeriodLabel(filePeriodId)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">Project scope</SelectItem>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select><FieldDescription>Selected: {selectedPeriodLabel(filePeriodId)}</FieldDescription></Field>
              <Field><FieldLabel>Purpose</FieldLabel><Select value={filePurpose} onValueChange={(value) => value && setFilePurpose(value as FilePurpose)}><SelectTrigger disabled={uploadFileState.isLoading}><SelectValue>{selectedFilePurposeLabel}</SelectValue></SelectTrigger><SelectContent>{Object.values(FilePurpose).map((purpose) => <SelectItem key={purpose} value={purpose}>{filePurposeLabel[purpose as FilePurpose]}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Current files</div>
              <ScrollArea className="max-h-44 rounded-md border">
                <div className="flex flex-col gap-2 p-2">
                  {(projectFiles?.items ?? []).map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{file.fileName}</div>
                        <div className="text-xs text-muted-foreground">{file.periodLabel} · {formatBytes(file.fileSize)} · {file.uploadedBy}</div>
                      </div>
                      {file.url ? (
                        <Button type="button" variant="outline" size="sm" nativeButton={false} render={<a href={file.url} target="_blank" rel="noreferrer" />}>
                          <DownloadIcon data-icon="inline-start" /> Download
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFileOpen(false)} disabled={uploadFileState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitFile} disabled={!selectedFile || uploadFileState.isLoading}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meeting note</DialogTitle>
            <DialogDescription>Add notes after a meeting.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>Meeting</FieldLabel><Select value={selectedMeetingId} onValueChange={(value) => value && setSelectedMeetingId(value)}><SelectTrigger disabled={updateMeetingState.isLoading}><SelectValue>{selectedMeetingLabel}</SelectValue></SelectTrigger><SelectContent>{project.meetingRows.map((meeting) => <SelectItem key={meeting.id} value={meeting.id}>{meeting.title}</SelectItem>)}</SelectContent></Select><FieldDescription>Selected: {selectedMeetingLabel}</FieldDescription></Field>
            <Field><FieldLabel>Notes</FieldLabel><Textarea value={meetingNote} onChange={(e) => setMeetingNote(e.target.value)} disabled={updateMeetingState.isLoading} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNoteOpen(false)} disabled={updateMeetingState.isLoading}>Cancel</Button>
            <Button type="button" onClick={submitMeetingNote} disabled={!selectedMeetingId || !meetingNote || updateMeetingState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
