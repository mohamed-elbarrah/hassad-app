"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toast } from "sonner"; // NEW
import {
  chatApi,
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
  useSendMessageWithFilesMutation,
  useLazyGetDirectConversationQuery,
} from "@/features/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useGetTeamMembersQuery } from "@/features/portal/portalApi";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { Button } from "@/components/ui/button";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { MessageSquare } from "lucide-react";
import { portalErrorMessage } from "@/lib/i18n";

export default function PortalChatPage() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resolvingConversationRef = useRef<string | null>(null);

  const openSales = searchParams.get("openSales") === "true";
  const openUserId = searchParams.get("userId");
  const deepLinkKey = `${openUserId ?? ""}:${openSales ? "sales" : ""}`;

  useEffect(() => {
    if (resolvingConversationRef.current !== deepLinkKey) {
      resolvingConversationRef.current = deepLinkKey;
      setSelectedId(null);
    }
  }, [deepLinkKey]);

  const {
    data: conversationsData,
    isLoading: convLoading,
    isError: convError,
    error: conversationsError,
    refetch: refetchConversations,
  } = useGetConversationsQuery({ limit: 50 });

  const [fetchDirectConv] = useLazyGetDirectConversationQuery();
  const { data: teamMembersData } = useGetTeamMembersQuery(undefined, {
    skip: !openSales,
  });

  const conversations = useMemo(() => conversationsData?.data ?? [], [conversationsData?.data]);
  const { data: selectedConvDetails } = useGetConversationQuery(selectedId!, {
    skip: !selectedId,
  });
  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? selectedConvDetails;

  useEffect(() => {
    if (!openUserId && !openSales) {
      resolvingConversationRef.current = null;
      if (!selectedId && !convLoading && conversations[0]) {
        setSelectedId(conversations[0].id);
      }
      return;
    }
    if (selectedId || convLoading) return;

    // Deep links must resolve a target, rather than selecting whichever direct
    // conversation happens to be first in an independently paginated response.
    const targetId = openUserId ?? (() => {
      const members = teamMembersData?.members ?? [];
      return [...members]
        .filter((member) =>
          member.roleType === "SALES" || member.roleType === "ACCOUNT_MANAGER",
        )
        .sort((a, b) => {
          const roleRank = (role: string) => (role === "SALES" ? 0 : 1);
          return (
            roleRank(a.roleType) - roleRank(b.roleType) ||
            a.name.localeCompare(b.name) ||
            a.id.localeCompare(b.id)
          );
        })[0]?.id;
    })();

    if (!targetId) return;
    if (resolvingConversationRef.current === targetId) return;

    const existing = conversations.find((conversation) =>
      conversation.type === "DIRECT" &&
      conversation.participants.some((participant) => participant.id === targetId),
    );
    if (existing) {
      setSelectedId(existing.id);
      return;
    }

    resolvingConversationRef.current = targetId;
    fetchDirectConv(targetId)
      .unwrap()
      .then((conversation) => {
        setSelectedId(conversation.id);
        dispatch(chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }]));
      })
      .catch((error) => {
        resolvingConversationRef.current = null;
        toast.error(portalErrorMessage(error));
      });
  }, [
    openSales,
    openUserId,
    selectedId,
    convLoading,
    conversations,
    fetchDirectConv,
    teamMembersData,
    dispatch,
  ]);

  const {
    data: messagesData,
    isLoading: msgLoading,
    isError: messagesError,
    error: messagesQueryError,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100 },
    { skip: !selectedId },
  );

  const [loadMessages, { isFetching: isLoadingOlder }] = useLazyGetMessagesQuery();
  const [markConversationRead] = useMarkConversationReadMutation();
  const [sendMessage, { isLoading: isSendingText }] = useSendMessageMutation();
  const [sendMessageWithFiles, { isLoading: isSendingFiles }] =
    useSendMessageWithFilesMutation();
  const isSending = isSendingText || isSendingFiles;

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
        // Persist the read boundary while the active conversation receives
        // messages, rather than waiting for a conversation switch.
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
          { limit: 50 },
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
  }, [dispatch, markConversationRead, markReadSocket, onNewMessage, refetchConversations, selectedId]);

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
          { limit: 50 },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === updatedMessage.conversationId);
            if (conversation?.lastMessage?.id === updatedMessage.id) {
              conversation.lastMessage = updatedMessage;
            }
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData("getConversation", selectedId, (draft) => {
          if (draft.lastMessage?.id === updatedMessage.id) draft.lastMessage = updatedMessage;
        }),
      );
    });
  }, [dispatch, onMessageUpdated, selectedId]);

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
          { limit: 50 },
          (draft) => {
            const conversation = draft.data.find((item) => item.id === deletedMessage.conversationId);
            if (conversation?.lastMessage?.id === deletedMessage.id) {
              conversation.lastMessage = deletedMessage;
            }
          },
        ),
      );
      dispatch(
        chatApi.util.updateQueryData("getConversation", selectedId, (draft) => {
          if (draft.lastMessage?.id === deletedMessage.id) draft.lastMessage = deletedMessage;
        }),
      );
    });
  }, [dispatch, onMessageDeleted, selectedId]);

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
          { limit: 50 },
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
      if (selectedId) {
        dispatch(
          chatApi.util.updateQueryData("getConversation", selectedId, (draft) => {
            const participant = draft.participants.find((item) => item.id === userId);
            if (participant) {
              participant.isOnline = isOnline;
              if (lastSeenAt) participant.lastSeenAt = lastSeenAt;
            }
          }),
        );
      }
    });
  }, [dispatch, onPresenceChange, selectedId]);

  useEffect(() => {
    setTypingUser(null);
  }, [selectedId]);

  const displayedMessages = useMemo(() => messagesData?.data ?? [], [messagesData]);

  // Read state is owned by the server. The optimistic cache update only keeps
  // the list responsive while the durable mark-read request is in flight.
  useEffect(() => {
    if (!selectedId) return;
    dispatch(chatApi.util.updateQueryData("getConversations", { limit: 50 }, (draft) => {
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
  }, [dispatch, isConnected, markConversationRead, markReadSocket, selectedId]);

  useEffect(() => {
    if (!onUnreadCount) return;
    const unsubscribe = onUnreadCount(({ conversationId, unreadCount }) => {
      dispatch(chatApi.util.updateQueryData("getConversations", { limit: 50 }, (draft) => {
        const conversation = draft.data.find((item) => item.id === conversationId);
        if (conversation) conversation.unreadCount = unreadCount;
      }));
    });
    return () => unsubscribe?.();
  }, [dispatch, onUnreadCount]);

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
        if (files?.length) {
          await sendMessageWithFiles({
            conversationId: selectedId,
            content,
            files,
          }).unwrap();
        } else {
          await sendMessage({ conversationId: selectedId, content }).unwrap();
        }
      } catch (err) {
        toast.error(portalErrorMessage(err));
        throw err;
      }
    },
    [selectedId, sendMessage, sendMessageWithFiles],
  );

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        icon={MessageSquare}
        title="المحادثات"
        description="من هنا يمكنك التواصل مع المشرفين ومدراء المشاريع المسؤولين عن حسابك."
      />

      <div className="h-[calc(100vh-15rem)] lg:h-[calc(100vh-13rem)]">
        {convError ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-muted/30">
            <PortalEmptyState
              icon={MessageSquare}
              title={portalErrorMessage(conversationsError)}
              description="يرجى المحاولة مرة أخرى."
              actionLabel="إعادة المحاولة"
              onAction={() => refetchConversations()}
            />
          </div>
        ) : conversations.length === 0 && !convLoading ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-muted/30">
            <PortalEmptyState
              icon={MessageSquare}
              title="لا توجد محادثات"
              description="سيتم إنشاء محادثة تلقائياً عند تعيين مسؤول حساب أو مدير مشروع"
            />
          </div>
        ) : (
          <div className="flex h-full gap-4">
            {/* Conversation list — always visible on desktop, hidden on mobile when a conversation is selected */}
            <div
              className={`w-full shrink-0 md:block md:w-80 ${
                selectedId ? "hidden md:block" : ""
              }`}
            >
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                <ConversationList
                  conversations={conversations}
                  activeId={selectedId ?? undefined}
                  onSelect={handleSelectConversation}
                  isLoading={convLoading}
                />
              </div>
            </div>

            {/* Chat area */}
            {selectedConversation ? (
              <div
                className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card ${
                  selectedId ? "" : "hidden md:flex"
                }`}
              >
                <ChatHeader
                  conversation={selectedConversation}
                  isTyping={typingUser}
                />
                {messagesError ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                    <PortalEmptyState
                      icon={MessageSquare}
                      title={portalErrorMessage(messagesQueryError)}
                      description="تعذر تحميل رسائل المحادثة."
                      actionLabel="إعادة المحاولة"
                      onAction={() => refetchMessages()}
                    />
                  </div>
                ) : (
                  <ChatWindow
                    key={selectedId}
                    messages={displayedMessages}
                    isLoading={msgLoading}
                    hasMore={messagesData?.hasMore}
                    isLoadingOlder={isLoadingOlder}
                    onLoadOlder={handleLoadOlder}
                    typingUser={typingUser}
                  />
                )}
                <MessageInput
                  onSend={handleSend}
                  onTyping={() => selectedId && emitTyping(selectedId)}
                  onStopTyping={() => selectedId && emitStopTyping(selectedId)}
                  disabled={isSending}
                />
              </div>
            ) : (
              <div className="hidden min-w-0 flex-1 md:flex">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-border bg-card">
                  <PortalEmptyState
                    icon={MessageSquare}
                    title="ابدأ محادثة"
                    description="اختر محادثة من القائمة للبدء"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile back button when viewing a conversation */}
        {selectedId && (
          <Button
            onClick={() => setSelectedId(null)}
            className="fixed bottom-24 right-4 z-50 flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-lg md:hidden"
          >
            ← المحادثات
          </Button>
        )}
      </div>
    </main>
  );
}
