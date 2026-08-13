"use client";

import { useMemo, useState } from "react";
import { CalendarPlusIcon, FileUpIcon, MessageSquareMoreIcon, PencilLineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectDetailRecord } from "@/features/projects/lib/project-detail";
import { useAssignPmTaskMutation, useCreatePmMeetingMutation, useCreatePmTaskMutation, useGetPmAssignableUsersQuery, useUpdatePmMeetingMutation, useUploadPmProjectFileMutation } from "@/lib/api/pm-project-actions-api";
import { TaskDepartment, TaskPriority, type MeetingStatus } from "@hassad/shared";

type Props = { project: ProjectDetailRecord };

const departments = [TaskDepartment.DESIGN, TaskDepartment.CONTENT, TaskDepartment.DEVELOPMENT, TaskDepartment.MARKETING, TaskDepartment.PRODUCTION];

const priorityLabel: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.NORMAL]: "Normal",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.URGENT]: "Urgent",
};

export function PmProjectActionsBar({ project }: Props) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const [taskDept, setTaskDept] = useState<TaskDepartment>(TaskDepartment.DESIGN);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.NORMAL);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPeriodId, setTaskPeriodId] = useState(project.periods[0]?.id ?? "");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskVisibleToClient, setTaskVisibleToClient] = useState(false);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingScheduledAt, setMeetingScheduledAt] = useState("");
  const [meetingDurationMin, setMeetingDurationMin] = useState(60);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPeriodId, setMeetingPeriodId] = useState(project.periods[0]?.id ?? "");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingIdForNotes, setMeetingIdForNotes] = useState(project.meetingRows[0]?.id ?? "");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePeriodId, setFilePeriodId] = useState(project.periods[0]?.id ?? "");
  const [filePurpose, setFilePurpose] = useState("ATTACHMENT");

  const [assignTask, assignTaskState] = useAssignPmTaskMutation();
  const [createTask, createTaskState] = useCreatePmTaskMutation();
  const [createMeeting, createMeetingState] = useCreatePmMeetingMutation();
  const [updateMeeting, updateMeetingState] = useUpdatePmMeetingMutation();
  const [uploadFile, uploadFileState] = useUploadPmProjectFileMutation();

  const { data: assignableUsers } = useGetPmAssignableUsersQuery(
    { projectId: project.id, dept: taskDept, limit: 50 },
    { skip: !taskOpen },
  );

  const currentPeriodId = useMemo(
    () => project.periods.find((period) => period.markerLabel === "Current")?.id ?? project.periods[0]?.id ?? "",
    [project.periods],
  );

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
    setMeetingNotes("");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePeriodId(currentPeriodId);
    setFilePurpose("ATTACHMENT");
  };

  const submitTask = async () => {
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
    setTaskOpen(false);
    clearTask();
  };

  const submitMeeting = async () => {
    const body = new FormData();
    body.append("title", meetingTitle);
    body.append("scheduledAt", meetingScheduledAt);
    body.append("durationMin", String(meetingDurationMin));
    if (meetingLocation) body.append("location", meetingLocation);
    if (meetingLink) body.append("meetingLink", meetingLink);
    if (meetingPeriodId) body.append("periodId", meetingPeriodId);
    if (meetingNotes) body.append("notes", meetingNotes);
    await createMeeting({ projectId: project.id, body }).unwrap();
    setMeetingOpen(false);
    clearMeeting();
  };

  const submitMeetingNotes = async () => {
    if (!meetingIdForNotes) return;
    await updateMeeting({ projectId: project.id, meetingId: meetingIdForNotes, body: { notes: meetingNotes } }).unwrap();
    setNoteOpen(false);
    setMeetingNotes("");
  };

  const submitFile = async () => {
    if (!selectedFile) return;
    const body = new FormData();
    body.append("file", selectedFile);
    if (filePeriodId) body.append("periodId", filePeriodId);
    body.append("purpose", filePurpose);
    await uploadFile({ projectId: project.id, body }).unwrap();
    setFileOpen(false);
    clearFile();
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
              <Field><FieldLabel>Title</FieldLabel><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></Field>
              <Field><FieldLabel>Department</FieldLabel><Select value={taskDept} onValueChange={(value) => value && setTaskDept(value as TaskDepartment)}><SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger><SelectContent>{departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Priority</FieldLabel><Select value={taskPriority} onValueChange={(value) => value && setTaskPriority(value as TaskPriority)}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{Object.values(TaskPriority).map((priority) => <SelectItem key={priority} value={priority}>{priorityLabel[priority]}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Due date</FieldLabel><Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} /></Field>
              <Field><FieldLabel>Assignee</FieldLabel><Select value={taskAssigneeId} onValueChange={(value) => value && setTaskAssigneeId(value)}><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{(assignableUsers?.items ?? []).map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Period</FieldLabel><Select value={taskPeriodId} onValueChange={(value) => setTaskPeriodId(value ?? "") }><SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger><SelectContent><SelectItem value="">Project</SelectItem>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field><FieldLabel>Description</FieldLabel><Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitTask} disabled={!taskTitle || !taskAssigneeId || !taskDueDate || createTaskState.isLoading}>Save</Button>
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
              <Field><FieldLabel>Title</FieldLabel><Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} /></Field>
              <Field><FieldLabel>Date & time</FieldLabel><Input type="datetime-local" value={meetingScheduledAt} onChange={(e) => setMeetingScheduledAt(e.target.value)} /></Field>
              <Field><FieldLabel>Duration (min)</FieldLabel><Input type="number" value={meetingDurationMin} onChange={(e) => setMeetingDurationMin(Number(e.target.value))} /></Field>
              <Field><FieldLabel>Period</FieldLabel><Select value={meetingPeriodId} onValueChange={(value) => setMeetingPeriodId(value ?? "") }><SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger><SelectContent><SelectItem value="">Project</SelectItem>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field className="md:col-span-2"><FieldLabel>Location</FieldLabel><Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} /></Field>
              <Field className="md:col-span-2"><FieldLabel>Meeting link</FieldLabel><Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://..." /></Field>
            </div>
            <Field><FieldLabel>Notes</FieldLabel><Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMeetingOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitMeeting} disabled={!meetingTitle || !meetingScheduledAt || createMeetingState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
            <DialogDescription>Attach a file to the project or a specific period.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>File</FieldLabel><Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel>Period</FieldLabel><Select value={filePeriodId} onValueChange={(value) => setFilePeriodId(value ?? "") }><SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger><SelectContent><SelectItem value="">Project</SelectItem>{project.periods.map((period) => <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Purpose</FieldLabel><Input value={filePurpose} onChange={(e) => setFilePurpose(e.target.value)} /></Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFileOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitFile} disabled={!selectedFile || uploadFileState.isLoading}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Meeting note</DialogTitle>
            <DialogDescription>Write notes for a meeting after it happens.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>Meeting</FieldLabel><Select value={meetingIdForNotes} onValueChange={(value) => value && setMeetingIdForNotes(value)}><SelectTrigger><SelectValue placeholder="Meeting" /></SelectTrigger><SelectContent>{project.meetingRows.map((meeting) => <SelectItem key={meeting.id} value={meeting.id}>{meeting.title}</SelectItem>)}</SelectContent></Select></Field>
            <Field><FieldLabel>Notes</FieldLabel><Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitMeetingNotes} disabled={!meetingIdForNotes || !meetingNotes || updateMeetingState.isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
