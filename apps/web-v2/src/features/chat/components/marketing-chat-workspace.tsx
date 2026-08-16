"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeftIcon,
  CopyIcon,
  Edit3Icon,
  MessageSquareIcon,
  PlusIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  ReplyIcon,
  SendHorizonalIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteMarketingChatMessageMutation,
  useGetMarketingChatConversationsQuery,
  useGetMarketingChatMessagesQuery,
  useSearchMarketingClientChatTargetsQuery,
  useSearchMarketingEmployeeChatTargetsQuery,
  useSendMarketingConversationMessageMutation,
  useSendMarketingDirectMessageMutation,
  useUpdateMarketingChatMessageMutation,
} from "@/lib/api/marketing-chat-api";
import { cn } from "@/lib/utils";
import {
  buildInitials,
  getConversationPeer,
  getConversationSubtitle,
  getConversationTitle,
  resolvePresence,
  type ChatMessageRecord,
  type ChatTargetOption,
} from "@/features/chat/lib/chat-runtime";

type MarketingChatWorkspaceProps = {
  currentUserId: string;
};

function apiSocketUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  return baseUrl.replace(/\/v1\/?$/, "");
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function mergeByUserId(
  employeeTargets: ChatTargetOption[],
  clientTargets: ChatTargetOption[],
) {
  const map = new Map<string, ChatTargetOption>();

  for (const target of [...employeeTargets, ...clientTargets]) {
    if (!map.has(target.userId)) {
      map.set(target.userId, target);
    }
  }

  return Array.from(map.values());
}

export function MarketingChatWorkspace({
  currentUserId,
}: MarketingChatWorkspaceProps) {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [draftTarget, setDraftTarget] = useState<ChatTargetOption | null>(null);
  const [localMessagesByConversation, setLocalMessagesByConversation] =
    useState<Record<string, ChatMessageRecord[]>>({});
  const [composerValue, setComposerValue] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessageRecord | null>(
    null,
  );
  const [editingTarget, setEditingTarget] = useState<ChatMessageRecord | null>(
    null,
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [conversationType, setConversationType] = useState<"DIRECT" | "GROUP">(
    "DIRECT",
  );
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationSearch, setNewConversationSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "messages">("list");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [presenceOverrides, setPresenceOverrides] = useState<
    Record<string, { isOnline: boolean; lastSeenAt: string | null }>
  >({});

  const deferredNewConversationSearch = useDeferredValue(
    newConversationSearch.trim(),
  );

  const {
    data: conversationsResponse,
    error: conversationsError,
    isError: conversationsIsError,
    isLoading: conversationsIsLoading,
    refetch: refetchConversations,
  } = useGetMarketingChatConversationsQuery({ type: conversationType });
  const conversations = useMemo(
    () => conversationsResponse?.data ?? [],
    [conversationsResponse?.data],
  );

  const queryTarget = useMemo(() => {
    const targetUserId = searchParams.get("targetUserId");
    const targetName = searchParams.get("targetName");
    const targetKind = searchParams.get("targetKind");

    if (!targetUserId || !targetName) {
      return null;
    }

    return {
      userId: targetUserId,
      name: targetName,
      subtitle:
        targetKind === "client"
          ? "Client chat will start after the first message."
          : "Employee chat will start after the first message.",
      kind: targetKind === "client" ? "client" : "employee",
      avatarUrl: null,
      isActive: true,
      lastLoginAt: null,
    } satisfies ChatTargetOption;
  }, [searchParams]);

  useEffect(() => {
    if (queryTarget) {
      setMobileView("messages");
    }
  }, [queryTarget]);

  const queryConversationId = queryTarget
    ? (conversations.find((conversation) =>
        conversation.participants.some(
          (participant) => participant.id === queryTarget.userId,
        ),
      )?.id ?? null)
    : null;

  const activeConversationId =
    selectedConversationId ??
    queryConversationId ??
    (draftTarget || queryTarget ? null : (conversations[0]?.id ?? null));
  const effectiveDraftTarget =
    draftTarget ?? (queryConversationId ? null : queryTarget);

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? null;

  const {
    data: messagesData,
    error: messagesError,
    isError: messagesIsError,
    isFetching: messagesIsFetching,
    isLoading: messagesIsLoading,
    refetch: refetchMessages,
  } = useGetMarketingChatMessagesQuery(activeConversationId ?? skipToken);

  const searchArgs =
    isNewConversationOpen && deferredNewConversationSearch.length >= 2
      ? { search: deferredNewConversationSearch, limit: 6 }
      : skipToken;

  const { data: employeeTargets = [] } =
    useSearchMarketingEmployeeChatTargetsQuery(searchArgs);
  const { data: clientTargets = [] } =
    useSearchMarketingClientChatTargetsQuery(searchArgs);

  const [sendConversationMessage, sendConversationState] =
    useSendMarketingConversationMessageMutation();
  const [sendDirectMessage, sendDirectState] =
    useSendMarketingDirectMessageMutation();
  const [updateChatMessage, updateChatMessageState] =
    useUpdateMarketingChatMessageMutation();
  const [deleteChatMessage, deleteChatMessageState] =
    useDeleteMarketingChatMessageMutation();

  const isMutating =
    sendConversationState.isLoading ||
    sendDirectState.isLoading ||
    updateChatMessageState.isLoading ||
    deleteChatMessageState.isLoading;

  const combinedTargets = useMemo(
    () =>
      mergeByUserId(employeeTargets, clientTargets).filter(
        (target) => target.userId !== currentUserId,
      ),
    [clientTargets, currentUserId, employeeTargets],
  );

  const visibleConversations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) =>
      [
        getConversationTitle(conversation, currentUserId),
        getConversationSubtitle(conversation, currentUserId),
        conversation.lastMessage?.displayContent ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [conversations, currentUserId, searchValue]);

  useEffect(() => {
    const socket = io(apiSocketUrl(), {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;
    const heartbeat = window.setInterval(
      () => socket.emit("presenceHeartbeat"),
      30_000,
    );

    socket.on("connect", () => {
      void refetchConversations();
      if (activeConversationId) void refetchMessages();
    });

    socket.on("userOnline", (payload: { userId: string }) => {
      setPresenceOverrides((current) => ({
        ...current,
        [payload.userId]: {
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
        },
      }));
    });

    socket.on(
      "userOffline",
      (payload: { userId: string; lastSeenAt: string }) => {
        setPresenceOverrides((current) => ({
          ...current,
          [payload.userId]: { isOnline: false, lastSeenAt: payload.lastSeenAt },
        }));
      },
    );

    socket.on("newMessage", (message: ChatMessageRecord) => {
      if (message.conversationId === activeConversationId) {
        updateConversationMessages(message.conversationId, (current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      }
      void refetchConversations();
    });

    socket.on("messageUpdated", (message: ChatMessageRecord) => {
      if (message.conversationId === activeConversationId) {
        updateConversationMessages(message.conversationId, (current) =>
          current.map((item) => (item.id === message.id ? message : item)),
        );
      }
      void refetchConversations();
    });

    socket.on("messageDeleted", (message: ChatMessageRecord) => {
      if (message.conversationId === activeConversationId) {
        updateConversationMessages(message.conversationId, (current) =>
          current.map((item) => (item.id === message.id ? message : item)),
        );
      }
      void refetchConversations();
    });

    socket.on(
      "userTyping",
      (payload: {
        conversationId: string;
        userId: string;
        userName: string;
      }) => {
        if (
          payload.conversationId === activeConversationId &&
          payload.userId !== currentUserId
        ) {
          setTypingLabel(`${payload.userName} is typing...`);
        }
      },
    );

    socket.on(
      "userStopTyping",
      (payload: { conversationId: string; userId: string }) => {
        if (
          payload.conversationId === activeConversationId &&
          payload.userId !== currentUserId
        ) {
          setTypingLabel(null);
        }
      },
    );

    return () => {
      window.clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    activeConversationId,
    currentUserId,
    refetchConversations,
    refetchMessages,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) {
      return;
    }

    socket.emit("joinConversation", { conversationId: activeConversationId });
    return () => {
      socket.emit("leaveConversation", {
        conversationId: activeConversationId,
      });
    };
  }, [activeConversationId]);

  function updateConversationMessages(
    conversationId: string,
    updater: (messages: ChatMessageRecord[]) => ChatMessageRecord[],
  ) {
    setLocalMessagesByConversation((current) => ({
      ...current,
      [conversationId]: updater(
        current[conversationId] ??
          (conversationId === activeConversationId ? (messagesData ?? []) : []),
      ),
    }));
  }

  const threadMessages =
    (activeConversationId
      ? localMessagesByConversation[activeConversationId]
      : undefined) ??
    messagesData ??
    [];

  const activePeer =
    (activeConversation &&
      getConversationPeer(activeConversation, currentUserId)) ??
    (effectiveDraftTarget
      ? {
          id: effectiveDraftTarget.userId,
          name: effectiveDraftTarget.name,
          email: "",
          avatarUrl: effectiveDraftTarget.avatarUrl,
          isActive: effectiveDraftTarget.isActive,
          lastLoginAt: effectiveDraftTarget.lastLoginAt,
        }
      : null);

  const activePresence = resolvePresence(
    activePeer?.lastLoginAt ?? null,
    presenceOverrides[activePeer?.id ?? ""]?.isOnline ?? activePeer?.isOnline,
    presenceOverrides[activePeer?.id ?? ""]?.lastSeenAt ??
      activePeer?.lastSeenAt,
  );

  function chooseTarget(target: ChatTargetOption) {
    const existingConversation = conversations.find((conversation) =>
      conversation.participants.some(
        (participant) => participant.id === target.userId,
      ),
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      setDraftTarget(null);
      setMobileView("messages");
      return;
    }

    setConversationType("DIRECT");
    setIsNewConversationOpen(false);
    setDraftTarget(target);
    setSelectedConversationId(null);
    setMobileView("messages");
    setReplyTarget(null);
    setEditingTarget(null);
  }

  function handleComposerChange(value: string) {
    setComposerValue(value);

    if (!activeConversationId || !socketRef.current) {
      return;
    }

    socketRef.current.emit("typing", { conversationId: activeConversationId });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("stopTyping", {
        conversationId: activeConversationId,
      });
    }, 1200);
  }

  async function handleSend() {
    const content = composerValue.trim();
    if (!content || isMutating) {
      return;
    }

    if (editingTarget && activeConversationId) {
      const message = await updateChatMessage({
        conversationId: activeConversationId,
        messageId: editingTarget.id,
        content,
      }).unwrap();
      updateConversationMessages(activeConversationId, (current) =>
        current.map((item) => (item.id === message.id ? message : item)),
      );
      setEditingTarget(null);
      setComposerValue("");
      return;
    }

    if (activeConversationId) {
      const message = await sendConversationMessage({
        conversationId: activeConversationId,
        content,
        parentMessageId: replyTarget?.id ?? null,
        files: selectedFiles,
      }).unwrap();

      updateConversationMessages(activeConversationId, (current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      setComposerValue("");
      setReplyTarget(null);
      setSelectedFiles([]);
      void refetchConversations();
      return;
    }

    if (!effectiveDraftTarget) {
      return;
    }

    const message = await sendDirectMessage({
      userId: effectiveDraftTarget.userId,
      content,
      parentMessageId: replyTarget?.id ?? null,
      files: selectedFiles,
    }).unwrap();

    setSelectedConversationId(message.conversationId);
    updateConversationMessages(message.conversationId, () => [message]);
    setComposerValue("");
    setReplyTarget(null);
    setSelectedFiles([]);
    void refetchConversations();
    void refetchMessages();
  }

  async function handleDeleteMessage(message: ChatMessageRecord) {
    if (!activeConversationId) {
      return;
    }

    const updated = await deleteChatMessage({
      conversationId: activeConversationId,
      messageId: message.id,
    }).unwrap();

    updateConversationMessages(activeConversationId, (current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleCopy(message: ChatMessageRecord) {
    await navigator.clipboard.writeText(message.displayContent);
  }

  if (conversationsIsError && !conversationsResponse) {
    return (
      <PageScaffold
        title="Chat"
        description="Direct conversations between admin, employees, and clients."
      >
        <WorkspaceQueryState
          kind="error"
          error={conversationsError}
          onRetry={refetchConversations}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="Chat"
      description="Direct conversations stay in one shared workspace and only create a thread after the first message is sent."
      actions={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/chat-preview" />}
        >
          <MessageSquareIcon data-icon="inline-start" />
          Preview route
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card
          className={cn(
            "min-h-[72vh] flex-col",
            mobileView === "list" ? "flex" : "hidden lg:flex",
          )}
        >
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              Search existing conversations or start a new direct chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search conversations"
                className="min-w-0 flex-1"
              />
              <Tabs
                value={conversationType}
                onValueChange={(value) => {
                  setConversationType(value as "DIRECT" | "GROUP");
                  setSelectedConversationId(null);
                  setDraftTarget(null);
                  setMobileView("list");
                }}
              >
                <TabsList>
                  <TabsTrigger value="DIRECT">Direct</TabsTrigger>
                  <TabsTrigger value="GROUP">Groups</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Dialog
              open={isNewConversationOpen}
              onOpenChange={setIsNewConversationOpen}
            >
              <DialogTrigger
                render={<Button variant="outline" className="w-full" />}
              >
                <PlusIcon data-icon="inline-start" />
                New conversation
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New direct conversation</DialogTitle>
                  <DialogDescription>
                    Search for an employee or client to start a direct
                    conversation.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  autoFocus
                  value={newConversationSearch}
                  onChange={(event) =>
                    setNewConversationSearch(event.target.value)
                  }
                  placeholder="Search people"
                />
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {combinedTargets.map((target) => {
                    const presence = resolvePresence(
                      target.lastLoginAt,
                      presenceOverrides[target.userId]?.isOnline,
                      presenceOverrides[target.userId]?.lastSeenAt,
                    );
                    return (
                      <button
                        key={target.userId}
                        type="button"
                        onClick={() => chooseTarget(target)}
                        className="flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted"
                      >
                        <Avatar size="sm">
                          <AvatarImage
                            src={target.avatarUrl ?? undefined}
                            alt=""
                          />
                          <AvatarFallback>
                            {buildInitials(target.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{target.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {target.subtitle}
                          </p>
                        </div>
                        <StatusBadge
                          tone={
                            presence.state === "online" ? "success" : "neutral"
                          }
                        >
                          {presence.label}
                        </StatusBadge>
                      </button>
                    );
                  })}
                  {isNewConversationOpen &&
                  deferredNewConversationSearch.length >= 2 &&
                  combinedTargets.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No people found.
                    </p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {conversationsIsLoading && conversations.length === 0 ? (
                <WorkspaceQueryState
                  kind="loading"
                  loadingTitle="Loading conversations"
                />
              ) : null}

              {visibleConversations.map((conversation) => {
                const title = getConversationTitle(conversation, currentUserId);
                const subtitle = getConversationSubtitle(
                  conversation,
                  currentUserId,
                );
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conversation.id);
                      setDraftTarget(null);
                      setMobileView("messages");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted",
                      isActive ? "bg-muted" : "",
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarImage
                        src={
                          (conversation.type === "DIRECT"
                            ? getConversationPeer(conversation, currentUserId)
                                ?.avatarUrl
                            : undefined) ?? undefined
                        }
                        alt=""
                      />
                      <AvatarFallback>{buildInitials(title)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {subtitle}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conversation.lastMessage?.displayContent ??
                            "No messages yet"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conversation.updatedAt)}
                        </span>
                        {conversation.messageCount ? (
                          <StatusBadge tone="active">
                            {conversation.messageCount} msg
                          </StatusBadge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "min-h-[72vh] flex-col",
            mobileView === "messages" ? "flex" : "hidden lg:flex",
          )}
        >
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  onClick={() => setMobileView("list")}
                  aria-label="Back to conversations"
                >
                  <ArrowLeftIcon />
                </Button>
                <Avatar size="sm">
                  <AvatarImage
                    src={activePeer?.avatarUrl ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>
                    {activePeer ? buildInitials(activePeer.name) : "CH"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {activeConversation
                      ? getConversationTitle(activeConversation, currentUserId)
                      : (effectiveDraftTarget?.name ?? "Select a conversation")}
                  </CardTitle>
                  <CardDescription>
                    {activeConversation
                      ? getConversationSubtitle(
                          activeConversation,
                          currentUserId,
                        )
                      : (effectiveDraftTarget?.subtitle ??
                        "Choose an existing conversation or start a new one.")}
                  </CardDescription>
                </div>
              </div>
              {activePeer ? (
                <StatusBadge
                  tone={
                    activePresence.state === "online" ? "success" : "neutral"
                  }
                >
                  {activePresence.label}
                </StatusBadge>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="flex h-[calc(72vh-5rem)] flex-col p-0">
            <div className="min-h-0 flex-1">
              {messagesIsError && activeConversationId ? (
                <WorkspaceQueryState
                  kind="error"
                  error={messagesError}
                  onRetry={refetchMessages}
                />
              ) : null}

              {!messagesIsError ? (
                <MessageScrollerProvider>
                  <MessageScroller className="h-full">
                    <MessageScrollerViewport>
                      <MessageScrollerContent className="px-4 py-4">
                        {messagesIsLoading && activeConversationId ? (
                          <WorkspaceQueryState
                            kind="loading"
                            loadingTitle="Loading messages"
                          />
                        ) : null}

                        {!activeConversationId && !effectiveDraftTarget ? (
                          <Empty>
                            <EmptyHeader>
                              <EmptyTitle>No conversation selected</EmptyTitle>
                              <EmptyDescription>
                                Pick an existing thread or search for a client
                                or employee to start one.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : null}

                        {activeConversationId &&
                        threadMessages.length === 0 &&
                        !messagesIsFetching ? (
                          <Empty>
                            <EmptyHeader>
                              <EmptyTitle>No messages yet</EmptyTitle>
                              <EmptyDescription>
                                Send the first message to start this thread.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : null}

                        {threadMessages.map((message, index) => {
                          const isOwn = message.sender.id === currentUserId;
                          return (
                            <MessageScrollerItem
                              key={message.id}
                              scrollAnchor={index === threadMessages.length - 1}
                            >
                              <MessageGroup>
                                <Message align={isOwn ? "end" : "start"}>
                                  <MessageAvatar>
                                    <Avatar size="sm">
                                      <AvatarImage
                                        src={
                                          message.sender.avatarUrl ?? undefined
                                        }
                                        alt=""
                                      />
                                      <AvatarFallback>
                                        {buildInitials(message.sender.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </MessageAvatar>
                                  <MessageContent>
                                    <MessageHeader className="gap-2">
                                      <span>{message.sender.name}</span>
                                      <span>
                                        {formatMessageTime(message.createdAt)}
                                      </span>
                                    </MessageHeader>
                                    <Bubble
                                      align={isOwn ? "end" : "start"}
                                      variant={isOwn ? "default" : "outline"}
                                    >
                                      <BubbleContent>
                                        {message.replyTo ? (
                                          <div className="mb-2 rounded-lg bg-background/20 px-2 py-1 text-xs">
                                            {message.replyTo.senderName}:{" "}
                                            {message.replyTo.content}
                                          </div>
                                        ) : null}
                                        <p>{message.displayContent}</p>
                                        {message.attachments.length > 0 ? (
                                          <AttachmentGroup className="mt-3">
                                            {message.attachments.map(
                                              (attachment) => (
                                                <Attachment key={attachment.id}>
                                                  <AttachmentContent>
                                                    <AttachmentTitle>
                                                      {attachment.fileName}
                                                    </AttachmentTitle>
                                                    <AttachmentDescription>
                                                      {attachment.fileType}
                                                    </AttachmentDescription>
                                                  </AttachmentContent>
                                                </Attachment>
                                              ),
                                            )}
                                          </AttachmentGroup>
                                        ) : null}
                                      </BubbleContent>
                                    </Bubble>
                                    <MessageFooter className="gap-2">
                                      {message.editedAt ? (
                                        <span>Edited</span>
                                      ) : null}
                                      {message.deletedAt ? (
                                        <span>Deleted</span>
                                      ) : null}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger
                                          render={
                                            <Button
                                              variant="ghost"
                                              size="icon-xs"
                                            />
                                          }
                                        >
                                          <MoreHorizontalIcon />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align={isOwn ? "end" : "start"}
                                        >
                                          <DropdownMenuGroup>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                setReplyTarget(message)
                                              }
                                            >
                                              <ReplyIcon />
                                              Reply
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                void handleCopy(message)
                                              }
                                            >
                                              <CopyIcon />
                                              Copy
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={
                                                !isOwn || !!message.deletedAt
                                              }
                                              onClick={() => {
                                                setEditingTarget(message);
                                                setComposerValue(
                                                  message.content,
                                                );
                                              }}
                                            >
                                              <Edit3Icon />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={
                                                !isOwn || !!message.deletedAt
                                              }
                                              onClick={() =>
                                                void handleDeleteMessage(
                                                  message,
                                                )
                                              }
                                            >
                                              <Trash2Icon />
                                              Delete
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
              ) : null}
            </div>

            <div className="border-t p-4">
              {replyTarget ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      Replying to {replyTarget.sender.name}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {replyTarget.displayContent}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTarget(null)}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}

              {editingTarget ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">Editing your message</p>
                    <p className="truncate text-muted-foreground">
                      {editingTarget.displayContent}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTarget(null);
                      setComposerValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}

              {selectedFiles.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file) => (
                    <StatusBadge
                      key={`${file.name}-${file.size}`}
                      tone="neutral"
                    >
                      {file.name}
                    </StatusBadge>
                  ))}
                </div>
              ) : null}

              {typingLabel ? (
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <UsersIcon />
                  <span>{typingLabel}</span>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <Textarea
                  value={composerValue}
                  onChange={(event) => handleComposerChange(event.target.value)}
                  placeholder={
                    effectiveDraftTarget
                      ? `Message ${effectiveDraftTarget.name}...`
                      : "Write a message..."
                  }
                  rows={4}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
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
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <PaperclipIcon data-icon="inline-start" />
                      Attach files
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={
                      composerValue.trim().length === 0 ||
                      isMutating ||
                      (!activeConversationId && !effectiveDraftTarget)
                    }
                  >
                    <SendHorizonalIcon data-icon="inline-start" />
                    {editingTarget ? "Save edit" : "Send message"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageScaffold>
  );
}
