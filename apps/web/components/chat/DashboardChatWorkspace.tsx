"use client";

import { startTransition, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  chatApi,
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useLazyGetDirectConversationQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
  useSendMessageWithFilesMutation,
} from "@/features/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { MessageInput } from "@/components/chat/MessageInput";
import { Button } from "@/components/ui/button";
import type { ChatScope, Conversation, Message } from "@/features/chat/chatApi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Info, X } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { chatErrorMessage } from "@/lib/i18n";


export function DashboardChatWorkspace({ scope }: { scope?: ChatScope } = {}) {
  const searchParams = useSearchParams();
  const initialConversationId = useMemo(
    () => searchParams.get("conversationId"),
    [searchParams],
  );
  const openUserId = searchParams.get("userId");
  const deepLinkKey = `${scope ?? "shared"}:${initialConversationId ?? ""}:${openUserId ?? ""}`;
  const resolvingTargetRef = useRef<string | null>(null);
  const lastDeepLinkRef = useRef<string | null>(null);
  const chatScope = scope;

  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId,
  );
  const [filterType, setFilterType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const {
    data: conversationsData,
    isLoading: convLoading,
    refetch: refetchConversations,
  } = useGetConversationsQuery({
      type: filterType,
      limit: 50,
      scope: chatScope,
    });

  const [fetchDirectConversation] = useLazyGetDirectConversationQuery();
  const conversations = useMemo(
    () => conversationsData?.data ?? [],
    [conversationsData?.data],
  );
  const selectedConversationQuery = selectedId
    ? chatScope
      ? { id: selectedId, scope: chatScope }
      : selectedId
    : "";
  const { data: selectedConversationDetails } = useGetConversationQuery(
    selectedConversationQuery,
    { skip: !selectedId },
  );
  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? selectedConversationDetails;

  const {
    data: messagesData,
    isLoading: msgLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100, scope: chatScope },
    { skip: !selectedId },
  );

  const [loadMessages, { isFetching: isLoadingOlder }] = useLazyGetMessagesQuery();
  const [markConversationRead] = useMarkConversationReadMutation();
  const [sendMessage] = useSendMessageMutation();
  const [sendMessageWithFiles] = useSendMessageWithFilesMutation();

  useEffect(() => {
    if (lastDeepLinkRef.current === deepLinkKey) return;
    lastDeepLinkRef.current = deepLinkKey;
    resolvingTargetRef.current = null;
    if (selectedId === initialConversationId) return;
    startTransition(() => setSelectedId(initialConversationId));
  }, [deepLinkKey, initialConversationId, selectedId]);

  useEffect(() => {
    if (!openUserId || selectedId || convLoading) return;

    const targetKey = `${chatScope ?? "shared"}:${openUserId}`;
    if (resolvingTargetRef.current === targetKey) return;

    const existing = conversations.find(
      (conversation) =>
        conversation.type === "DIRECT" &&
        conversation.participants.some((participant) => participant.id === openUserId),
    );
    if (existing) {
      resolvingTargetRef.current = targetKey;
      startTransition(() => setSelectedId(existing.id));
      return;
    }

    resolvingTargetRef.current = targetKey;
    fetchDirectConversation({ userId: openUserId, scope: chatScope })
      .unwrap()
      .then((conversation) => {
        setSelectedId(conversation.id);
        dispatch(chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }]));
      })
      .catch((error) => {
        resolvingTargetRef.current = null;
        toast.error(chatErrorMessage(error));
      });
  }, [chatScope, convLoading, conversations, dispatch, fetchDirectConversation, openUserId, selectedId]);

  const {
    isConnected,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onUserTyping,
    onUserStopTyping,
    onPresenceChange,
    onUnreadCount,
    markConversationRead: markReadSocket,
    emitTyping,
    emitStopTyping,
  } = useChatSocket(selectedId ?? undefined);

  useEffect(() => {
    if (!isConnected) return;
    void refetchConversations();
    if (selectedId) void refetchMessages();
  }, [isConnected, refetchConversations, refetchMessages, selectedId]);

  const [typingUser, setTypingUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (!onNewMessage) return;
    const unsub = onNewMessage((msg: Message) => {
      if (msg.conversationId === selectedId) {
        // The open conversation is considered read as messages arrive, not
        // only when the user changes conversations.
        void markReadSocket(selectedId).catch(() =>
          markConversationRead({ conversationId: selectedId, scope: chatScope }).unwrap().catch(() => undefined),
        );
        dispatch(
          chatApi.util.updateQueryData(
            "getMessages",
            { conversationId: selectedId, limit: 100, scope: chatScope },
            (draft) => {
              if (!draft.data.some((message) => message.id === msg.id)) {
                draft.data.push(msg);
                draft.data.sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
                    a.id.localeCompare(b.id),
                );
              }
            },
          ),
        );
      }
      if (msg.conversationId !== selectedId) void refetchConversations();
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50, scope: chatScope },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === msg.conversationId);
            if (conversation) {
              conversation.lastMessage = msg;
              conversation.updatedAt = msg.createdAt;
              draft.data.sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              );
            }
          },
        ),
      );
    });
    return () => {
      unsub?.();
    };
  }, [chatScope, dispatch, filterType, markConversationRead, markReadSocket, onNewMessage, refetchConversations, selectedId]);

  useEffect(() => {
    if (!onMessageUpdated || !selectedId) return;
    return onMessageUpdated((updatedMessage) => {
      if (updatedMessage.conversationId !== selectedId) return;
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId: selectedId, limit: 100, scope: chatScope },
          (draft) => {
            const index = draft.data.findIndex((message) => message.id === updatedMessage.id);
            if (index !== -1) draft.data[index] = updatedMessage;
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50, scope: chatScope },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === updatedMessage.conversationId);
            if (conversation?.lastMessage?.id === updatedMessage.id) {
              conversation.lastMessage = updatedMessage;
            }
          },
        ),
      );
    });
  }, [chatScope, dispatch, filterType, onMessageUpdated, selectedId]);

  useEffect(() => {
    if (!onMessageDeleted || !selectedId) return;
    return onMessageDeleted((deletedMessage) => {
      if (deletedMessage.conversationId !== selectedId) return;
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId: selectedId, limit: 100, scope: chatScope },
          (draft) => {
            const index = draft.data.findIndex((message) => message.id === deletedMessage.id);
            if (index !== -1) draft.data[index] = deletedMessage;
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50, scope: chatScope },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === deletedMessage.conversationId);
            if (conversation?.lastMessage?.id === deletedMessage.id) {
              conversation.lastMessage = deletedMessage;
            }
          },
        ),
      );
    });
  }, [chatScope, dispatch, filterType, onMessageDeleted, selectedId]);

  useEffect(() => {
    if (!onUserTyping || !selectedId) return;
    const unsubscribeTyping = onUserTyping((data) => {
      if (data.userId !== currentUserId) {
        setTypingUser({ userId: data.userId, userName: data.userName });
      }
    });
    const unsubscribeStopTyping = onUserStopTyping?.((data) => {
      setTypingUser((current) =>
        current?.userId === data.userId ? null : current,
      );
    });
    return () => {
      unsubscribeTyping?.();
      unsubscribeStopTyping?.();
    };
  }, [currentUserId, onUserTyping, onUserStopTyping, selectedId]);

  useEffect(() => {
    if (!onPresenceChange) return;
    return onPresenceChange(({ userId, isOnline, lastSeenAt }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50, scope: chatScope },
          (draft) => {
            for (const conversation of draft.data) {
              const participant = conversation.participants.find((item) => item.id === userId);
              if (participant) {
                participant.isOnline = isOnline;
                if (lastSeenAt) participant.lastSeenAt = lastSeenAt;
              }
            }
          },
        ),
      );
    });
  }, [chatScope, dispatch, filterType, onPresenceChange]);

  useEffect(() => {
    startTransition(() => {
      setTypingUser(null);
      setShowInfoPanel(false);
    });
  }, [selectedId]);

  const displayedMessages = useMemo(() => messagesData?.data ?? [], [messagesData]);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(chatApi.util.updateQueryData("getConversations", { type: filterType, limit: 50, scope: chatScope }, (draft) => {
      const conversation = draft.data.find((item) => item.id === selectedId);
      if (conversation) conversation.unreadCount = 0;
    }));
    if (isConnected) {
      void markReadSocket(selectedId)
        .catch(() => markConversationRead({ conversationId: selectedId, scope: chatScope }).unwrap())
        .catch((error) => toast.error(chatErrorMessage(error)));
    } else {
      // REST is the fallback when the socket is unavailable; both paths use
      // ChatService.markConversationRead on the server.
      void markConversationRead({ conversationId: selectedId, scope: chatScope })
        .unwrap()
        .catch((error) => toast.error(chatErrorMessage(error)));
    }
  }, [chatScope, dispatch, filterType, isConnected, markConversationRead, markReadSocket, selectedId]);

  useEffect(() => {
    if (!onUnreadCount) return;
    const unsubscribe = onUnreadCount(({ conversationId, unreadCount }) => {
      dispatch(chatApi.util.updateQueryData("getConversations", { type: filterType, limit: 50, scope: chatScope }, (draft) => {
        const conversation = draft.data.find((item) => item.id === conversationId);
        if (conversation) conversation.unreadCount = unreadCount;
      }));
    });
    return () => unsubscribe?.();
  }, [chatScope, dispatch, filterType, onUnreadCount]);

  const handleLoadOlder = useCallback(() => {
    if (!selectedId || !messagesData?.hasMore || !messagesData.nextCursor) return;
    void loadMessages({ conversationId: selectedId, limit: 100, cursor: messagesData.nextCursor, scope: chatScope });
  }, [chatScope, loadMessages, messagesData, selectedId]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedId(conv.id);
  }, []);

  const handleSend = useCallback(
    async (content: string, files?: File[]) => {
      if (!selectedId) return;
      try {
        if (files && files.length > 0) {
          await sendMessageWithFiles({
            conversationId: selectedId,
            content,
            files,
            scope: chatScope,
          }).unwrap();
        } else {
          await sendMessage({ conversationId: selectedId, content, scope: chatScope }).unwrap();
        }
      } catch (error) {
        toast.error(chatErrorMessage(error));
        throw error;
      }
    },
    [chatScope, selectedId, sendMessage, sendMessageWithFiles],
  );

  const sidebarContent = (
    <ConversationList
      conversations={conversations}
      activeId={selectedId ?? undefined}
      onSelect={handleSelectConversation}
      isLoading={convLoading}
      filterType={filterType}
      onFilterChange={setFilterType}
    />
  );

  return (
    <div
      className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-xl border border-portal-card-border bg-natural-0 shadow-sm"
      dir="rtl"
    >
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col shrink-0 border-l border-portal-divider transition-all duration-300",
          selectedConversation ? "w-80" : "w-80",
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <ActionButton
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 z-10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </ActionButton>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main chat area */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              isTyping={typingUser}
            />
            <ChatWindow
              key={selectedId}
              messages={displayedMessages}
              isLoading={msgLoading}
              hasMore={messagesData?.hasMore}
              isLoadingOlder={isLoadingOlder}
              onLoadOlder={handleLoadOlder}
              typingUser={typingUser}
            />
            <MessageInput
              onSend={handleSend}
              onTyping={() => emitTyping?.(selectedId)}
              onStopTyping={() => emitStopTyping?.(selectedId)}
            />
          </>
        ) : (
          <ChatEmptyState />
        )}

        {/* Info toggle button (when panel is hidden) */}
        {selectedConversation && !showInfoPanel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoPanel(true)}
            className="absolute left-3 top-20 z-10 hidden rounded-xl text-portal-note-text transition-all hover:bg-secondary-500/10 hover:text-secondary-500 lg:flex"
            title="معلومات المحادثة"
            aria-label="معلومات المحادثة"
          >
            <Info data-icon="inline-start" />
          </Button>
        )}
      </div>

      {/* Info panel (desktop) */}
      {selectedConversation && showInfoPanel && (
        <div className="hidden lg:flex flex-col w-72 shrink-0 border-r border-portal-divider bg-badge-gray-bg/30">
          <div className="flex items-center justify-between p-4 border-b border-portal-divider">
            <h3 className="text-sm font-medium text-natural-100">معلومات</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowInfoPanel(false)}
              className="rounded-lg text-portal-note-text hover:bg-badge-gray-bg hover:text-natural-100"
              aria-label="إغلاق معلومات المحادثة"
            >
              <X data-icon="inline-start" />
            </Button>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {/* Participants */}
            <div>
              <h4 className="text-xs font-medium text-portal-note-text mb-3 uppercase tracking-wider">
                المشاركون
              </h4>
              <div className="flex flex-col gap-2">
                {selectedConversation.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-badge-gray-bg transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-xs font-medium text-secondary-500">
                      {p.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-natural-100 truncate">
                        {p.name || "مستخدم"}
                      </p>
                      <p className="text-[10px] text-portal-note-text">
                        {p.isOnline ? "متصل" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project info */}
            {selectedConversation.project && (
              <div>
                <h4 className="text-xs font-medium text-portal-note-text mb-3 uppercase tracking-wider">
                  المشروع
                </h4>
                <div className="p-3 rounded-xl bg-badge-gray-bg">
                  <p className="text-sm font-medium text-natural-100">
                    {selectedConversation.project.name}
                  </p>
                </div>
              </div>
            )}

            {/* Client info */}
            {selectedConversation.clientId && selectedConversation.clientName && (
              <div>
                <h4 className="text-xs font-medium text-portal-note-text mb-3 uppercase tracking-wider">
                  العميل
                </h4>
                <div className="p-3 rounded-xl bg-badge-gray-bg">
                  <p className="text-sm font-medium text-natural-100">
                    {selectedConversation.clientName}
                  </p>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
