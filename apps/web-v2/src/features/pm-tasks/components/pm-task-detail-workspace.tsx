"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, Building2Icon, FileTextIcon, SendHorizonalIcon, UserIcon } from "lucide-react";
import { FilePurpose } from "@hassad/shared";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { EntityTimeline } from "@/components/patterns/entity-timeline";
import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkflowStepper } from "@/components/patterns/workflow-stepper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/components/ui/message";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import type { TaskDetailRecord, TaskDetailComment } from "@/features/tasks/lib/task-detail";
import { showApiErrorToast, showCrmActionToast } from "@/lib/api/crm-action-toast";
import { useAddPmTaskCommentMutation, useUpdatePmTaskStatusMutation, useUploadPmTaskFileMutation } from "@/lib/api/pm-tasks-api";
import { cn } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function renderComments(
  comments: TaskDetailComment[],
  currentUserId: string,
  audience: "Team" | "Internal",
) {
  return comments
    .filter((comment) => comment.audience === audience)
    .map((comment, index, filtered) => {
      const isOwn = comment.senderId === currentUserId;
      return (
        <MessageScrollerItem key={comment.id} scrollAnchor={index === filtered.length - 1}>
          <MessageGroup>
            <Message align={isOwn ? "end" : "start"}>
              <MessageAvatar>
                <Avatar size="sm">
                  <AvatarFallback>{comment.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="gap-2">
                  <span>{comment.author}</span>
                  <span>{formatDateTime(comment.postedAt)}</span>
                </MessageHeader>
                <Bubble align={isOwn ? "end" : "start"} variant={isOwn ? "default" : "outline"}>
                  <BubbleContent>
                    <p>{comment.message}</p>
                  </BubbleContent>
                </Bubble>
                <MessageFooter className="gap-2">
                  <StatusBadge tone={comment.audience === "Team" ? "active" : "neutral"}>{comment.audience}</StatusBadge>
                  <StatusBadge tone={comment.tone}>{comment.role}</StatusBadge>
                </MessageFooter>
              </MessageContent>
            </Message>
          </MessageGroup>
        </MessageScrollerItem>
      );
    });
}

type PmTaskDetailWorkspaceProps = {
  task: TaskDetailRecord;
  currentUserId: string;
};

export function PmTaskDetailWorkspace({ task, currentUserId }: PmTaskDetailWorkspaceProps) {
  const [status, setStatus] = useState(task.status);
  const [conversationDraft, setConversationDraft] = useState("");
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(FilePurpose.REFERENCE);

  const [updateStatus, updateStatusState] = useUpdatePmTaskStatusMutation();
  const [addComment, addCommentState] = useAddPmTaskCommentMutation();
  const [uploadFile, uploadFileState] = useUploadPmTaskFileMutation();

  const conversationComments = useMemo(
    () => task.comments.filter((comment) => comment.audience === "Team"),
    [task.comments],
  );
  const internalNotes = useMemo(
    () => task.comments.filter((comment) => comment.audience === "Internal"),
    [task.comments],
  );

  const submitStatus = async () => {
    try {
      await updateStatus({ taskId: task.id, status }).unwrap();
      showCrmActionToast({ type: "success", title: "Task status updated", description: `Status moved to ${String(status).replaceAll("_", " ")}.` });
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitConversationMessage = async () => {
    try {
      if (!conversationDraft.trim()) return;
      await addComment({ taskId: task.id, content: conversationDraft.trim(), isInternal: false }).unwrap();
      showCrmActionToast({ type: "success", title: "Message sent", description: "The team conversation was updated." });
      setConversationDraft("");
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitInternalNote = async () => {
    try {
      if (!internalNoteDraft.trim()) return;
      await addComment({ taskId: task.id, content: internalNoteDraft.trim(), isInternal: true }).unwrap();
      showCrmActionToast({ type: "success", title: "Internal note saved", description: "The private PM note was added." });
      setInternalNoteDraft("");
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  const submitFile = async () => {
    try {
      if (!file) return;
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", filePurpose);
      await uploadFile({ taskId: task.id, body }).unwrap();
      showCrmActionToast({ type: "success", title: "File uploaded", description: "The task file was attached." });
      setFile(null);
    } catch (error) {
      showApiErrorToast(error);
    }
  };

  return (
    <PageScaffold
      title={task.title}
      description="PM task workspace with conversation, internal notes, files, and workflow control."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/pm/tasks" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Tasks
          </Button>
          <Button type="button" onClick={() => void submitStatus()} disabled={updateStatusState.isLoading}>
            Save status
          </Button>
        </div>
      }
    >
      <EntityDetailLayout
        sidebar={
          <>
            <Card>
              <CardHeader className="gap-4">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>{task.assigneeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-2xl">{task.title}</CardTitle>
                      <CardDescription>{task.departmentLabel}</CardDescription>
                      <p className="text-sm text-muted-foreground">{task.projectName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={task.statusTone}>{task.statusLabel}</StatusBadge>
                      <StatusBadge tone={task.priorityTone}>{task.priorityLabel}</StatusBadge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{task.description}</p>
                {task.projectId ? (
                  <Button variant="outline" nativeButton={false} render={<Link href={`/pm/projects/${task.projectId}`} />}>
                    <Building2Icon data-icon="inline-start" />
                    Open project
                  </Button>
                ) : null}
                {task.clientId ? (
                  <Button variant="outline" nativeButton={false} render={<Link href={`/pm/clients/${task.clientId}`} />}>
                    <UserIcon data-icon="inline-start" />
                    Open client
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task info</CardTitle>
                <CardDescription>Current ownership and delivery details.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{task.projectName}</dd></div>
                  <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Assignee</dt><dd className="font-medium">{task.assigneeName ?? "Unassigned"}</dd></div>
                  <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Due</dt><dd className="font-medium">{task.dueDateValue}</dd></div>
                  <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Period</dt><dd className="font-medium">{task.periodLabel}</dd></div>
                </dl>
              </CardContent>
            </Card>
          </>
        }
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {task.metrics.map((metric) => (
            <MetricTile key={metric.label} label={metric.label} value={metric.value} description={metric.description} trend={metric.trend} />
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>Execution path from queue to approval, including revision loops when they happen.</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowStepper steps={task.workflow} />
          </CardContent>
        </Card>

        <Tabs defaultValue="conversation">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="conversation">Comments</TabsTrigger>
              <TabsTrigger value="notes">Internal notes</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conversation">
            <Card>
              <CardHeader>
                <CardTitle>Task conversation</CardTitle>
                <CardDescription>PM and assigned team-user thread for execution updates and replies.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="min-h-[24rem]">
                  <MessageScrollerProvider>
                    <MessageScroller className="h-[24rem]">
                      <MessageScrollerViewport>
                        <MessageScrollerContent className="px-4 py-4">
                          {conversationComments.length === 0 ? (
                            <Empty>
                              <EmptyHeader>
                                <EmptyTitle>No team conversation yet</EmptyTitle>
                                <EmptyDescription>Send the first team message to start the thread.</EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          ) : (
                            renderComments(task.comments, currentUserId, "Team")
                          )}
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton />
                    </MessageScroller>
                  </MessageScrollerProvider>
                </div>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="pm-task-conversation">Message</FieldLabel>
                    <Textarea id="pm-task-conversation" value={conversationDraft} onChange={(event) => setConversationDraft(event.target.value)} rows={4} placeholder="Write a team message..." />
                  </Field>
                </FieldGroup>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => void submitConversationMessage()} disabled={addCommentState.isLoading || conversationDraft.trim().length === 0}>
                    <SendHorizonalIcon data-icon="inline-start" />
                    Send message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Internal notes</CardTitle>
                <CardDescription>Private PM notes that are not part of the team conversation.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="min-h-[20rem]">
                  <MessageScrollerProvider>
                    <MessageScroller className="h-[20rem]">
                      <MessageScrollerViewport>
                        <MessageScrollerContent className="px-4 py-4">
                          {internalNotes.length === 0 ? (
                            <Empty>
                              <EmptyHeader>
                                <EmptyTitle>No internal notes yet</EmptyTitle>
                                <EmptyDescription>Keep private PM observations here.</EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          ) : (
                            renderComments(task.comments, currentUserId, "Internal")
                          )}
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton />
                    </MessageScroller>
                  </MessageScrollerProvider>
                </div>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="pm-task-note">Note</FieldLabel>
                    <Textarea id="pm-task-note" value={internalNoteDraft} onChange={(event) => setInternalNoteDraft(event.target.value)} rows={4} placeholder="Write a private PM note..." />
                  </Field>
                </FieldGroup>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => void submitInternalNote()} disabled={addCommentState.isLoading || internalNoteDraft.trim().length === 0}>
                    Save note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
                <CardDescription>Task brief, working files, and review submissions tied to this task.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="pm-task-file">Upload file</FieldLabel>
                    <input id="pm-task-file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                  </Field>
                  <Field>
                    <FieldLabel>Purpose</FieldLabel>
                    <Select value={filePurpose} onValueChange={(value) => setFilePurpose((value ?? FilePurpose.REFERENCE) as FilePurpose)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="REFERENCE">Reference</SelectItem>
                          <SelectItem value="INTERNAL_DRAFT">Internal draft</SelectItem>
                          <SelectItem value="DELIVERABLE">Deliverable</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setFile(null)} disabled={uploadFileState.isLoading}>Clear</Button>
                  <Button type="button" onClick={() => void submitFile()} disabled={uploadFileState.isLoading || !file}>
                    <FileTextIcon data-icon="inline-start" />
                    Upload file
                  </Button>
                </div>
                <div className="grid gap-3">
                  {task.files.map((fileItem) => (
                    <div key={fileItem.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium">{fileItem.name}</p>
                          <p className="text-sm text-muted-foreground">{fileItem.purpose}</p>
                        </div>
                        <StatusBadge tone="neutral">{fileItem.mime}</StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Status history</CardTitle>
                <CardDescription>Key workflow transitions and task events.</CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline items={task.history.map((item) => ({ id: item.id, date: item.date, title: item.title, badges: <StatusBadge tone={item.tone}>{item.actor}</StatusBadge>, content: item.summary, completed: item.completed }))} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </EntityDetailLayout>
    </PageScaffold>
  );
}
