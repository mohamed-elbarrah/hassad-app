"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  chatApi,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
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
import type { Conversation, Message } from "@/features/chat/chatApi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Info, X } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { portalErrorMessage } from "@/lib/i18n";


export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialConversationId = useMemo(
    () => searchParams.get("conversationId"),
    [searchParams],
  );

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
    });

  const conversations = conversationsData?.data ?? [];
  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const {
    data: messagesData,
    isLoading: msgLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100 },
    { skip: !selectedId },
  );

  const [loadMessages, { isFetching: isLoadingOlder }] = useLazyGetMessagesQuery();
  const [markConversationRead] = useMarkConversationReadMutation();
  const [sendMessage] = useSendMessageMutation();
  const [sendMessageWithFiles] = useSendMessageWithFilesMutation();

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
          markConversationRead(selectedId).unwrap().catch(() => undefined),
        );
        dispatch(
          chatApi.util.updateQueryData(
            "getMessages",
            { conversationId: selectedId, limit: 100 },
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
          { type: filterType, limit: 50 },
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
  }, [dispatch, filterType, markConversationRead, markReadSocket, onNewMessage, refetchConversations, selectedId]);

  useEffect(() => {
    if (!onMessageUpdated || !selectedId) return;
    return onMessageUpdated((updatedMessage) => {
      if (updatedMessage.conversationId !== selectedId) return;
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId: selectedId, limit: 100 },
          (draft) => {
            const index = draft.data.findIndex((message) => message.id === updatedMessage.id);
            if (index !== -1) draft.data[index] = updatedMessage;
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50 },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === updatedMessage.conversationId);
            if (conversation?.lastMessage?.id === updatedMessage.id) {
              conversation.lastMessage = updatedMessage;
            }
          },
        ),
      );
    });
  }, [dispatch, filterType, onMessageUpdated, selectedId]);

  useEffect(() => {
    if (!onMessageDeleted || !selectedId) return;
    return onMessageDeleted((deletedMessage) => {
      if (deletedMessage.conversationId !== selectedId) return;
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId: selectedId, limit: 100 },
          (draft) => {
            const index = draft.data.findIndex((message) => message.id === deletedMessage.id);
            if (index !== -1) draft.data[index] = deletedMessage;
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { type: filterType, limit: 50 },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === deletedMessage.conversationId);
            if (conversation?.lastMessage?.id === deletedMessage.id) {
              conversation.lastMessage = deletedMessage;
            }
          },
        ),
      );
    });
  }, [dispatch, filterType, onMessageDeleted, selectedId]);

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
          { type: filterType, limit: 50 },
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
  }, [dispatch, filterType, onPresenceChange]);

  useEffect(() => {
    setTypingUser(null);
    setShowInfoPanel(false);
  }, [selectedId]);

  const displayedMessages = useMemo(() => messagesData?.data ?? [], [messagesData]);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(chatApi.util.updateQueryData("getConversations", { type: filterType, limit: 50 }, (draft) => {
      const conversation = draft.data.find((item) => item.id === selectedId);
      if (conversation) conversation.unreadCount = 0;
    }));
    if (isConnected) {
      void markReadSocket(selectedId)
        .catch(() => markConversationRead(selectedId).unwrap())
        .catch((error) => toast.error(portalErrorMessage(error)));
    } else {
      // REST is the fallback when the socket is unavailable; both paths use
      // ChatService.markConversationRead on the server.
      void markConversationRead(selectedId)
        .unwrap()
        .catch((error) => toast.error(portalErrorMessage(error)));
    }
  }, [dispatch, filterType, isConnected, markConversationRead, markReadSocket, selectedId]);

  useEffect(() => {
    if (!onUnreadCount) return;
    const unsubscribe = onUnreadCount(({ conversationId, unreadCount }) => {
      dispatch(chatApi.util.updateQueryData("getConversations", { type: filterType, limit: 50 }, (draft) => {
        const conversation = draft.data.find((item) => item.id === conversationId);
        if (conversation) conversation.unreadCount = unreadCount;
      }));
    });
    return () => unsubscribe?.();
  }, [dispatch, filterType, onUnreadCount]);

  const handleLoadOlder = useCallback(() => {
    if (!selectedId || !messagesData?.hasMore || !messagesData.nextCursor) return;
    void loadMessages({ conversationId: selectedId, limit: 100, cursor: messagesData.nextCursor });
  }, [loadMessages, messagesData, selectedId]);

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
          }).unwrap();
        } else {
          await sendMessage({ conversationId: selectedId, content }).unwrap();
        }
      } catch (error) {
        toast.error(portalErrorMessage(error));
        throw error;
      }
    },
    [selectedId, sendMessage, sendMessageWithFiles],
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
          <button
            onClick={() => setShowInfoPanel(true)}
            className="hidden lg:flex absolute top-20 left-3 p-2 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all z-10"
            title="معلومات المحادثة"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info panel (desktop) */}
      {selectedConversation && showInfoPanel && (
        <div className="hidden lg:flex flex-col w-72 shrink-0 border-r border-portal-divider bg-badge-gray-bg/30">
          <div className="flex items-center justify-between p-4 border-b border-portal-divider">
            <h3 className="text-sm font-medium text-natural-100">معلومات</h3>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="p-1 rounded-lg text-portal-note-text hover:text-natural-100 hover:bg-badge-gray-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Participants */}
            <div>
              <h4 className="text-xs font-medium text-portal-note-text mb-3 uppercase tracking-wider">
                المشاركون
              </h4>
              <div className="space-y-2">
                {selectedConversation.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-badge-gray-bg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary-500/10 flex items-center justify-center text-xs font-medium text-secondary-500 shrink-0">
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
