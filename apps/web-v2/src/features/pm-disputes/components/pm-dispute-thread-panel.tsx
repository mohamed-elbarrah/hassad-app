"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import {
  AlertCircleIcon,
  PaperclipIcon,
  SendHorizonalIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Textarea } from "@/components/ui/textarea";
import {
  type DisputeThreadType,
  useGetPmDisputeThreadMessagesQuery,
  useGetPmDisputeThreadsQuery,
  useSendPmDisputeThreadMessageMutation,
} from "@/lib/api/pm-disputes-api";
import { cn } from "@/lib/utils";

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function roleLabel(role: "CLIENT" | "PM" | "ADMIN") {
  if (role === "CLIENT") return "Client";
  if (role === "PM") return "PM";
  return "Admin";
}

function privacyTone(threadType: DisputeThreadType) {
  return threadType === "CLIENT_PM" ? "active" : "attention";
}

function privacyLabel(threadType: DisputeThreadType) {
  if (threadType === "CLIENT_PM") return "Client thread";
  return "Admin thread";
}

export function PmDisputeThreadPanel({ disputeId }: { disputeId: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedThread, setSelectedThread] = useState<DisputeThreadType>("CLIENT_PM");
  const [composerValue, setComposerValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    data: threads = [],
    error: threadsError,
    isError: threadsIsError,
    isLoading: threadsIsLoading,
    refetch: refetchThreads,
  } = useGetPmDisputeThreadsQuery(disputeId);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.threadType === selectedThread) ?? threads[0] ?? null,
    [selectedThread, threads],
  );

  const {
    data: messages = [],
    error: messagesError,
    isError: messagesIsError,
    isLoading: messagesIsLoading,
    refetch: refetchMessages,
  } = useGetPmDisputeThreadMessagesQuery(
    activeThread ? { disputeId, threadType: activeThread.threadType } : skipToken,
  );

  const [sendMessage, sendMessageState] = useSendPmDisputeThreadMessageMutation();

  async function handleSend() {
    if (!activeThread || !activeThread.canReply || composerValue.trim().length === 0) {
      return;
    }

    await sendMessage({
      disputeId,
      threadType: activeThread.threadType,
      content: composerValue.trim(),
      files: selectedFiles,
    }).unwrap();

    setComposerValue("");
    setSelectedFiles([]);
    void refetchThreads();
    void refetchMessages();
  }

  if (threadsIsError) {
    return <WorkspaceQueryState kind="error" error={threadsError} onRetry={refetchThreads} />;
  }

  if (threadsIsLoading && threads.length === 0) {
    return <WorkspaceQueryState kind="loading" loadingTitle="Loading dispute threads" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Conversation lanes</CardTitle>
          <CardDescription>
            Use the client lane for resolution work and the admin lane for internal coordination.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {threads.map((thread) => {
            const isActive = activeThread?.threadType === thread.threadType;
            return (
              <button
                key={thread.threadType}
                type="button"
                onClick={() => setSelectedThread(thread.threadType)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted",
                  isActive ? "border-primary bg-muted" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{thread.title}</p>
                    <p className="text-xs text-muted-foreground">{thread.participantsLabel}</p>
                  </div>
                  <StatusBadge tone={privacyTone(thread.threadType)}>
                    {privacyLabel(thread.threadType)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{thread.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{thread.messageCount} message(s)</span>
                  <span>
                    {thread.lastMessage
                      ? `${thread.lastMessage.authorName} · ${formatDateTime(thread.lastMessage.createdAt)}`
                      : "No messages yet"}
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{activeThread?.title ?? "Thread"}</CardTitle>
              <CardDescription>
                {activeThread?.description ?? "Select a dispute thread to inspect the conversation."}
              </CardDescription>
            </div>
            {activeThread ? (
              <StatusBadge tone={privacyTone(activeThread.threadType)}>
                {privacyLabel(activeThread.threadType)}
              </StatusBadge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messagesIsError ? (
            <WorkspaceQueryState kind="error" error={messagesError} onRetry={refetchMessages} />
          ) : null}

          {messagesIsLoading && activeThread ? (
            <WorkspaceQueryState kind="loading" loadingTitle="Loading thread messages" />
          ) : null}

          {!messagesIsLoading && activeThread && messages.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No messages yet</EmptyTitle>
                <EmptyDescription>
                  {activeThread.canReply
                    ? "Use this lane to move the dispute toward a clean resolution."
                    : "This lane is read only for the PM role."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{buildInitials(message.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{message.author.name}</p>
                      <span className="text-xs text-muted-foreground">{roleLabel(message.author.role)}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
                    {message.attachments.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {message.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                          >
                            {attachment.fileName}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeThread ? (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">PM composer</p>
                  <p className="text-sm text-muted-foreground">
                    {activeThread.canReply
                      ? "Messages are sent to the selected thread and remain within the dispute record."
                      : "This lane is not writable for the PM role."}
                  </p>
                </div>
                <StatusBadge tone={privacyTone(activeThread.threadType)}>
                  {privacyLabel(activeThread.threadType)}
                </StatusBadge>
              </div>

              {selectedFiles.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file) => (
                    <StatusBadge key={`${file.name}-${file.size}`} tone="neutral">
                      {file.name}
                    </StatusBadge>
                  ))}
                </div>
              ) : null}

              <Textarea
                rows={4}
                value={composerValue}
                disabled={!activeThread.canReply}
                onChange={(event) => setComposerValue(event.target.value)}
                placeholder={
                  activeThread.canReply
                    ? `Message in ${activeThread.title}...`
                    : "This lane is monitor-only for the PM role."
                }
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    setSelectedFiles(Array.from(event.target.files ?? []));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!activeThread.canReply}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon data-icon="inline-start" />
                  Attach files
                </Button>
                <Button
                  type="button"
                  disabled={
                    !activeThread.canReply ||
                    composerValue.trim().length === 0 ||
                    sendMessageState.isLoading
                  }
                  onClick={() => void handleSend()}
                >
                  <SendHorizonalIcon data-icon="inline-start" />
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <AlertCircleIcon className="mx-auto mb-3" />
              Select a thread to review or respond.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
