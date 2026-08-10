"use client";

import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  CheckCheckIcon,
  CopyIcon,
  DownloadIcon,
  Edit3Icon,
  FileImageIcon,
  FileTextIcon,
  LockIcon,
  MessageSquareDashedIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PinIcon,
  RefreshCcwIcon,
  ReplyIcon,
  SendHorizonalIcon,
  SmilePlusIcon,
  TriangleAlertIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/patterns/status-badge";
import { StateBlock } from "@/components/patterns/state-block";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  chatPreviewScenarios,
  getChatPreviewScenario,
} from "@/features/chat/lib/chat-preview-fixtures";
import type {
  ChatAttachmentRecord,
  ChatConnectionState,
  ChatConversationRecord,
  ChatMessageRecord,
  ChatMessageStatus,
  ChatPreviewScenario,
  ChatScenarioId,
} from "@/features/chat/lib/chat-types";

type ConversationFilter = "all" | "direct" | "group";
type CanvasMode = "desktop" | "mobile";

const reactionChoices = ["👍", "❤️", "🔥", "👀", "✅", "🧠"];

function statusToneForMessage(status: ChatMessageStatus | undefined): StatusTone {
  if (status === "failed") return "destructive";
  if (status === "sending") return "attention";
  if (status === "sent") return "neutral";
  if (status === "delivered") return "active";
  return "success";
}

function statusLabelForMessage(status: ChatMessageStatus | undefined) {
  if (!status) return "Seen";
  if (status === "sending") return "Sending";
  if (status === "sent") return "Sent";
  if (status === "delivered") return "Delivered";
  if (status === "failed") return "Failed";
  return "Seen";
}

function connectionTone(state: ChatConnectionState): StatusTone {
  if (state === "connected") return "success";
  if (state === "reconnecting") return "attention";
  if (state === "offline") return "warning";
  return "destructive";
}

function connectionLabel(state: ChatConnectionState) {
  if (state === "connected") return "Connected";
  if (state === "reconnecting") return "Reconnecting";
  if (state === "offline") return "Offline";
  return "Error";
}

function cloneScenarioState(id: ChatScenarioId) {
  const scenario = getChatPreviewScenario(id);

  return {
    scenario,
    conversations: scenario.conversations,
    activeConversationId:
      scenario.defaultConversationId ?? scenario.conversations[0]?.id ?? null,
    draft: scenario.defaultDraft,
  };
}

function findConversation(
  conversations: ChatConversationRecord[],
  conversationId: string | null
) {
  return conversations.find((item) => item.id === conversationId) ?? null;
}

function iconForAttachment(kind: ChatAttachmentRecord["kind"]) {
  if (kind === "image") return <FileImageIcon />;
  return <FileTextIcon />;
}

function presenceDotClass(presence: ChatConversationRecord["participants"][number]["presence"]) {
  if (presence === "online") return "bg-primary";
  if (presence === "away") return "bg-muted-foreground";
  if (presence === "last_seen") return "bg-border";
  return "bg-secondary-foreground";
}

export function ChatPreviewWorkspace() {
  const [scenarioId, setScenarioId] = useState<ChatScenarioId>("direct-active");
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("desktop");
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<ConversationFilter>("all");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [{ scenario, conversations, activeConversationId, draft }, setWorkspace] =
    useState(() => cloneScenarioState("direct-active"));

  useEffect(() => {
    setWorkspace(cloneScenarioState(scenarioId));
    setReplyToId(null);
    setEditingId(null);
    setCopiedMessageId(null);
    setSearchQuery("");
    setListFilter("all");
  }, [scenarioId]);

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      searchQuery.length === 0 ||
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.preview.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (listFilter === "all") return true;
    if (listFilter === "direct") {
      return conversation.type === "direct";
    }

    return conversation.type !== "direct";
  });

  const activeConversation =
    findConversation(conversations, activeConversationId) ??
    filteredConversations[0] ??
    null;

  const activeParticipants = activeConversation?.participants ?? [];
  const replyMessage =
    activeConversation?.messages.find((message) => message.id === replyToId) ?? null;
  const editingMessage =
    activeConversation?.messages.find((message) => message.id === editingId) ?? null;

  useEffect(() => {
    if (!activeConversation && filteredConversations[0]) {
      setWorkspace((current) => ({
        ...current,
        activeConversationId: filteredConversations[0]?.id ?? null,
      }));
    }
  }, [activeConversation, filteredConversations]);

  async function handleCopy(message: ChatMessageRecord) {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1200);
    }
  }

  function updateConversation(
    conversationId: string,
    updater: (conversation: ChatConversationRecord) => ChatConversationRecord
  ) {
    setWorkspace((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation
      ),
    }));
  }

  function handleToggleReaction(messageId: string, emoji: string) {
    if (!activeConversation) return;

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => {
        if (message.id !== messageId) return message;

        const existing = message.reactions.find((reaction) => reaction.emoji === emoji);

        if (!existing) {
          return {
            ...message,
            reactions: [
              ...message.reactions,
              {
                emoji,
                count: 1,
                reacted: true,
              },
            ],
          };
        }

        return {
          ...message,
          reactions: message.reactions.map((reaction) =>
            reaction.emoji === emoji
              ? {
                  ...reaction,
                  count: reaction.reacted ? Math.max(0, reaction.count - 1) : reaction.count + 1,
                  reacted: !reaction.reacted,
                }
              : reaction
          ),
        };
      }),
    }));
  }

  function handleDeleteMessage(messageId: string) {
    if (!activeConversation) return;

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => message.id !== messageId),
    }));

    if (replyToId === messageId) setReplyToId(null);
    if (editingId === messageId) {
      setEditingId(null);
      setWorkspace((current) => ({ ...current, draft: "" }));
    }
  }

  function handleTogglePin(messageId: string) {
    if (!activeConversation) return;

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === messageId
          ? { ...message, isPinned: !message.isPinned }
          : message
      ),
    }));
  }

  function handleEditMessage(messageId: string) {
    if (!activeConversation) return;
    const message = activeConversation.messages.find((item) => item.id === messageId);
    if (!message) return;

    setEditingId(messageId);
    setReplyToId(null);
    setWorkspace((current) => ({ ...current, draft: message.body }));
  }

  function handleSend() {
    if (!activeConversation || !draft.trim()) return;
    if (editingId) {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === editingId
            ? {
                ...message,
                body: draft.trim(),
                editedLabel: "Edited just now",
              }
            : message
        ),
        preview: draft.trim(),
      }));
      setEditingId(null);
      setWorkspace((current) => ({ ...current, draft: "" }));
      return;
    }

    const messageId = `draft-${Date.now()}`;
    const nextBody = draft.trim();

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      preview: nextBody,
      updatedAt: "Now",
      unreadCount: 0,
      messages: [
        ...conversation.messages,
        {
          id: messageId,
          kind: "text",
          authorId: "user-admin",
          body: nextBody,
          createdAt: "Now",
          status: "sending",
          reactions: [],
          attachments: [],
          replyPreview: replyMessage?.body,
        },
      ],
    }));
    setWorkspace((current) => ({ ...current, draft: "" }));
    setReplyToId(null);

    window.setTimeout(() => {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === messageId ? { ...message, status: "seen" } : message
        ),
      }));
    }, 900);
  }

  function handleScenarioRetry() {
    setWorkspace(cloneScenarioState(scenarioId));
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Scenario control</CardTitle>
          <CardDescription>
            Switch among fixture-backed chat situations before any API adapter work.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Tabs value={scenarioId} onValueChange={(value) => setScenarioId(value as ChatScenarioId)}>
            <div className="overflow-x-auto pb-1">
              <TabsList variant="line" className="min-w-max">
                {chatPreviewScenarios.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>
                    {item.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={connectionTone(scenario.connection)}>
                  {connectionLabel(scenario.connection)}
                </StatusBadge>
                <StatusBadge tone="neutral">{scenario.title}</StatusBadge>
              </div>
              <div className="max-w-4xl text-sm text-muted-foreground">
                <p>{scenario.description}</p>
                <p>{scenario.notice}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={canvasMode} onValueChange={(value) => setCanvasMode(value as CanvasMode)}>
                <TabsList>
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={listFilter} onValueChange={(value) => setListFilter(value as ConversationFilter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="group">Groups</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          "mx-auto w-full transition-[max-width] duration-300",
          canvasMode === "mobile" ? "max-w-md" : "max-w-[120rem]"
        )}
      >
        <Card className="min-h-[72vh]">
          <CardContent className="flex min-h-[72vh] flex-col p-0">
            <div
              className={cn(
                "grid min-h-[72vh]",
                canvasMode === "mobile"
                  ? "grid-cols-1"
                  : "lg:grid-cols-[minmax(19rem,0.28fr)_minmax(0,1fr)_minmax(18rem,0.26fr)]"
              )}
            >
              <aside className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-medium">Conversations</h2>
                      <p className="text-sm text-muted-foreground">
                        Direct, group, and embedded thread previews
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageSquareDashedIcon data-icon="inline-start" />
                      New
                    </Button>
                  </div>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search title or preview"
                    aria-label="Search conversations"
                  />
                </div>
                <Separator />
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                  {filteredConversations.length === 0 ? (
                    <Empty className="flex-1 border-none">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageSquareDashedIcon />
                        </EmptyMedia>
                        <EmptyTitle>No conversations in this view</EmptyTitle>
                        <EmptyDescription>
                          Use the scenario tabs to validate empty and no-selection states without
                          authenticated shell dependencies.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear search
                        </Button>
                      </EmptyContent>
                    </Empty>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const active = conversation.id === activeConversation?.id;

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            setWorkspace((current) => ({
                              ...current,
                              activeConversationId: conversation.id,
                            }))
                          }
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-3 text-left transition-colors",
                            active ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>{conversation.participants[0]?.initials ?? "CH"}</AvatarFallback>
                              <AvatarBadge className={presenceDotClass(conversation.participants[0]?.presence ?? "offline")} />
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate font-medium">{conversation.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {conversation.updatedAt}
                                </span>
                              </div>
                              <span className="truncate text-xs text-muted-foreground">
                                {conversation.subtitle}
                              </span>
                            </div>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {conversation.preview}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone="neutral">{conversation.type}</StatusBadge>
                            {conversation.unreadCount > 0 ? (
                              <StatusBadge tone="active">
                                {conversation.unreadCount} unread
                              </StatusBadge>
                            ) : null}
                            {conversation.isMuted ? <StatusBadge tone="warning">Muted</StatusBadge> : null}
                            {conversation.isLocked ? <StatusBadge tone="destructive">Locked</StatusBadge> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="flex min-h-0 min-w-0 flex-col border-b lg:border-r lg:border-b-0">
                {!activeConversation ? (
                  <div className="flex h-full flex-1 items-center p-4">
                    <StateBlock
                      icon={<MessageSquareDashedIcon />}
                      title="No conversation selected"
                      description="Pick a scenario or conversation to inspect the message surface."
                    />
                  </div>
                ) : scenario.connection === "error" ? (
                  <div className="flex h-full flex-1 items-center p-4">
                    <StateBlock
                      icon={<AlertCircleIcon />}
                      title="Conversation failed to load"
                      description="This preview state exists to validate route-level retry and degraded messaging behavior."
                      action={
                        <Button variant="outline" onClick={handleScenarioRetry}>
                          <RefreshCcwIcon data-icon="inline-start" />
                          Retry preview state
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 border-b p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="lg">
                            <AvatarFallback>{activeParticipants[0]?.initials ?? "CH"}</AvatarFallback>
                            <AvatarBadge className={presenceDotClass(activeParticipants[0]?.presence ?? "offline")} />
                          </Avatar>
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-medium">{activeConversation.title}</h3>
                              <StatusBadge tone={connectionTone(scenario.connection)}>
                                {connectionLabel(scenario.connection)}
                              </StatusBadge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activeConversation.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeConversation.isLocked ? (
                            <StatusBadge tone="destructive">Locked</StatusBadge>
                          ) : null}
                          {activeConversation.isPinned ? (
                            <StatusBadge tone="attention">Pinned</StatusBadge>
                          ) : null}
                          <Button variant="outline" size="sm">
                            <UsersIcon data-icon="inline-start" />
                            Info
                          </Button>
                        </div>
                      </div>
                      {scenario.connection !== "connected" || activeConversation.statusNote ? (
                        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                          {scenario.connection === "reconnecting"
                            ? "Transport is reconnecting. Messages remain visible and the jump-to-latest control stays active."
                            : null}
                          {scenario.connection === "offline"
                            ? "Transport is offline. Composition is disabled until the adapter reconnects."
                            : null}
                          {activeConversation.statusNote ? (
                            <p>{activeConversation.statusNote}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="min-h-0 flex-1">
                      <MessageScrollerProvider>
                        <MessageScroller className="h-full">
                          <MessageScrollerViewport>
                            <MessageScrollerContent className="px-4 py-4">
                              {activeConversation.messages.map((message, index) => {
                                if (message.kind === "system") {
                                  return (
                                    <MessageScrollerItem
                                      key={message.id}
                                      scrollAnchor={index === activeConversation.messages.length - 1}
                                    >
                                      <Marker variant="separator">
                                        <MarkerIcon>
                                          <PinIcon />
                                        </MarkerIcon>
                                        <MarkerContent>{message.body}</MarkerContent>
                                      </Marker>
                                    </MessageScrollerItem>
                                  );
                                }

                                const isOwn = message.authorId === "user-admin";
                                const author = activeConversation.participants.find(
                                  (participant) => participant.id === message.authorId
                                );
                                const status = statusLabelForMessage(message.status);

                                return (
                                  <MessageScrollerItem
                                    key={message.id}
                                    scrollAnchor={index === activeConversation.messages.length - 1}
                                  >
                                    <MessageGroup>
                                      <Message align={isOwn ? "end" : "start"}>
                                        <MessageAvatar>
                                          <Avatar size="sm">
                                            <AvatarFallback>
                                              {author?.initials ?? "SY"}
                                            </AvatarFallback>
                                          </Avatar>
                                        </MessageAvatar>
                                        <MessageContent>
                                          <MessageHeader className="gap-2">
                                            <span>{author?.name ?? "System"}</span>
                                            <span>{message.createdAt}</span>
                                          </MessageHeader>
                                          <Bubble
                                            align={isOwn ? "end" : "start"}
                                            variant={isOwn ? "default" : "outline"}
                                          >
                                            <BubbleContent>
                                              {message.replyPreview ? (
                                                <div className="mb-2 rounded-lg bg-background/20 px-2 py-1 text-xs text-primary-foreground/80">
                                                  {message.replyPreview}
                                                </div>
                                              ) : null}
                                              <p>{message.body}</p>
                                              {message.attachments.length > 0 ? (
                                                <AttachmentGroup className="mt-3">
                                                  {message.attachments.map((attachment) => (
                                                    <Attachment
                                                      key={attachment.id}
                                                      orientation={attachment.orientation ?? "horizontal"}
                                                      state={attachment.state ?? "done"}
                                                    >
                                                      <AttachmentMedia
                                                        variant={
                                                          attachment.kind === "image" ? "image" : "icon"
                                                        }
                                                      >
                                                        {iconForAttachment(attachment.kind)}
                                                      </AttachmentMedia>
                                                      <AttachmentContent>
                                                        <AttachmentTitle>{attachment.name}</AttachmentTitle>
                                                        <AttachmentDescription>
                                                          {attachment.description}
                                                        </AttachmentDescription>
                                                      </AttachmentContent>
                                                      <AttachmentActions>
                                                        <AttachmentAction size="icon-xs" variant="ghost">
                                                          <DownloadIcon />
                                                        </AttachmentAction>
                                                      </AttachmentActions>
                                                    </Attachment>
                                                  ))}
                                                </AttachmentGroup>
                                              ) : null}
                                            </BubbleContent>
                                            {message.reactions.length > 0 ? (
                                              <BubbleReactions
                                                align={isOwn ? "end" : "start"}
                                              >
                                                {message.reactions
                                                  .filter((reaction) => reaction.count > 0)
                                                  .map((reaction) => (
                                                    <button
                                                      key={`${message.id}-${reaction.emoji}`}
                                                      type="button"
                                                      onClick={() =>
                                                        handleToggleReaction(message.id, reaction.emoji)
                                                      }
                                                      className="rounded-full px-1.5 py-0.5 text-xs transition-colors hover:bg-background/80"
                                                    >
                                                      {reaction.emoji} {reaction.count}
                                                    </button>
                                                  ))}
                                              </BubbleReactions>
                                            ) : null}
                                          </Bubble>
                                          <MessageFooter className="gap-2">
                                            <StatusBadge tone={statusToneForMessage(message.status)}>
                                              {status}
                                            </StatusBadge>
                                            {message.editedLabel ? (
                                              <span>{message.editedLabel}</span>
                                            ) : null}
                                            {copiedMessageId === message.id ? (
                                              <span>Copied</span>
                                            ) : null}
                                            <DropdownMenu>
                                              <DropdownMenuTrigger
                                                render={<Button variant="ghost" size="icon-xs" />}
                                              >
                                                <MoreHorizontalIcon />
                                                <span className="sr-only">
                                                  Open message actions
                                                </span>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                                                <DropdownMenuGroup>
                                                  <DropdownMenuLabel>Message actions</DropdownMenuLabel>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                    onClick={() => setReplyToId(message.id)}
                                                    disabled={!activeConversation.capabilitySet.reply}
                                                  >
                                                    <ReplyIcon />
                                                    Reply
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                      <SmilePlusIcon />
                                                      React
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                      {reactionChoices.map((emoji) => (
                                                        <DropdownMenuItem
                                                          key={`${message.id}-${emoji}`}
                                                          onClick={() =>
                                                            handleToggleReaction(message.id, emoji)
                                                          }
                                                        >
                                                          <span>{emoji}</span>
                                                          <span className="font-medium">Toggle reaction</span>
                                                        </DropdownMenuItem>
                                                      ))}
                                                    </DropdownMenuSubContent>
                                                  </DropdownMenuSub>
                                                  <DropdownMenuItem onClick={() => void handleCopy(message)}>
                                                    <CopyIcon />
                                                    Copy text
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleEditMessage(message.id)}
                                                    disabled={
                                                      !isOwn || !activeConversation.capabilitySet.edit
                                                    }
                                                  >
                                                    <Edit3Icon />
                                                    Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    disabled={
                                                      !isOwn || !activeConversation.capabilitySet.delete
                                                    }
                                                  >
                                                    <TriangleAlertIcon />
                                                    Delete
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleTogglePin(message.id)}
                                                    disabled={!activeConversation.capabilitySet.pin}
                                                  >
                                                    <PinIcon />
                                                    {message.isPinned ? "Unpin" : "Pin"}
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    disabled={
                                                      message.attachments.length === 0 ||
                                                      !activeConversation.capabilitySet.download
                                                    }
                                                  >
                                                    <DownloadIcon />
                                                    Download
                                                  </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </MessageFooter>
                                        </MessageContent>
                                      </Message>
                                    </MessageGroup>
                                  </MessageScrollerItem>
                                );
                              })}
                            </MessageScrollerContent>
                          </MessageScrollerViewport>
                          <MessageScrollerButton />
                        </MessageScroller>
                      </MessageScrollerProvider>
                    </div>

                    <div className="border-t p-4">
                      {replyMessage ? (
                        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium">Replying to message</p>
                            <p className="truncate text-muted-foreground">{replyMessage.body}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setReplyToId(null)}>
                            Clear
                          </Button>
                        </div>
                      ) : null}
                      {editingMessage ? (
                        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium">Editing your message</p>
                            <p className="truncate text-muted-foreground">{editingMessage.body}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setWorkspace((current) => ({ ...current, draft: "" }));
                            }}
                          >
                            Cancel edit
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-3">
                        <Textarea
                          value={draft}
                          onChange={(event) =>
                            setWorkspace((current) => ({
                              ...current,
                              draft: event.target.value,
                            }))
                          }
                          placeholder={
                            activeConversation?.capabilitySet.compose
                              ? "Type a message or keep this as a saved draft preview"
                              : "Composition is disabled for this scenario"
                          }
                          disabled={!activeConversation?.capabilitySet.compose}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!activeConversation?.capabilitySet.attach}
                            >
                              <PaperclipIcon data-icon="inline-start" />
                              Add files
                            </Button>
                            <StatusBadge tone="neutral">
                              {activeConversation?.capabilitySet.compose
                                ? "Draft-ready"
                                : "Read only"}
                            </StatusBadge>
                          </div>
                          <Button
                            onClick={handleSend}
                            disabled={!activeConversation?.capabilitySet.compose || draft.trim().length === 0}
                          >
                            <SendHorizonalIcon data-icon="inline-start" />
                            {editingId ? "Save edit" : "Send preview message"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <aside className="flex min-h-0 flex-col">
                <div className="flex items-center justify-between gap-3 border-b p-4">
                  <div>
                    <h3 className="text-base font-medium">Thread details</h3>
                    <p className="text-sm text-muted-foreground">
                      Participants, pinned context, and adapter hints
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <PinIcon />
                    <span className="sr-only">Pinned items</span>
                  </Button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
                  {activeConversation ? (
                    <>
                      <Card size="sm">
                        <CardHeader>
                          <CardTitle>Participants</CardTitle>
                          <CardDescription>
                            Presence and last-seen UI preview
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          <AvatarGroup>
                            {activeParticipants.slice(0, 3).map((participant) => (
                              <Avatar key={participant.id} size="lg">
                                <AvatarFallback>{participant.initials}</AvatarFallback>
                                <AvatarBadge className={presenceDotClass(participant.presence)} />
                              </Avatar>
                            ))}
                            {activeParticipants.length > 3 ? (
                              <AvatarGroupCount>+{activeParticipants.length - 3}</AvatarGroupCount>
                            ) : null}
                          </AvatarGroup>
                          <div className="flex flex-col gap-3">
                            {activeParticipants.map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium">{participant.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {participant.role}
                                  </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  <p>{participant.presence.replace("_", " ")}</p>
                                  <p>{participant.lastSeen}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card size="sm">
                        <CardHeader>
                          <CardTitle>Capabilities</CardTitle>
                          <CardDescription>
                            Future adapter toggles for embedded comment and dispute use
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          {Object.entries(activeConversation.capabilitySet).map(([key, enabled]) => (
                            <StatusBadge key={key} tone={enabled ? "success" : "neutral"}>
                              {key}
                            </StatusBadge>
                          ))}
                        </CardContent>
                      </Card>

                      <Card size="sm">
                        <CardHeader>
                          <CardTitle>Pinned and shared</CardTitle>
                          <CardDescription>
                            Files and pinned messages that should stay visible across threads
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          {activeConversation.messages.filter((message) => message.isPinned).length > 0 ? (
                            <div className="flex flex-col gap-2 rounded-lg border p-3">
                              {activeConversation.messages
                                .filter((message) => message.isPinned)
                                .map((message) => (
                                  <div key={message.id} className="text-sm">
                                    <p className="font-medium">Pinned message</p>
                                    <p className="text-muted-foreground">{message.body}</p>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No pinned messages in this scenario.
                            </p>
                          )}

                          {activeConversation.sharedFiles.length > 0 ? (
                            <AttachmentGroup>
                              {activeConversation.sharedFiles.map((attachment) => (
                                <Attachment
                                  key={attachment.id}
                                  orientation={attachment.orientation ?? "horizontal"}
                                >
                                  <AttachmentMedia
                                    variant={attachment.kind === "image" ? "image" : "icon"}
                                  >
                                    {iconForAttachment(attachment.kind)}
                                  </AttachmentMedia>
                                  <AttachmentContent>
                                    <AttachmentTitle>{attachment.name}</AttachmentTitle>
                                    <AttachmentDescription>
                                      {attachment.description}
                                    </AttachmentDescription>
                                  </AttachmentContent>
                                  <AttachmentActions>
                                    <AttachmentAction size="icon-xs">
                                      <DownloadIcon />
                                    </AttachmentAction>
                                  </AttachmentActions>
                                </Attachment>
                              ))}
                            </AttachmentGroup>
                          ) : null}
                        </CardContent>
                      </Card>

                      <Card size="sm">
                        <CardHeader>
                          <CardTitle>Preview checklist</CardTitle>
                          <CardDescription>
                            Fast review of the states covered by the current scenario
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CheckCheckIcon />
                            Message actions and reactions visible
                          </div>
                          <div className="flex items-center gap-2">
                            <PinIcon />
                            Pinned context and shared files visible
                          </div>
                          <div className="flex items-center gap-2">
                            {scenario.connection === "offline" ? <WifiOffIcon /> : <RefreshCcwIcon />}
                            Transport state visible in header chrome
                          </div>
                          <div className="flex items-center gap-2">
                            {activeConversation.isLocked ? <LockIcon /> : <UsersIcon />}
                            Adapter-specific thread rules visible
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <StateBlock
                      icon={<UsersIcon />}
                      title="No thread details yet"
                      description="Select a conversation to inspect participants, shared files, and capability gates."
                    />
                  )}
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
