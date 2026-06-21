"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  chatApi,
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useLazyGetDirectConversationQuery,
} from "@/features/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useGetTeamMembersQuery } from "@/features/portal/portalApi";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { MessageInput } from "@/components/chat/MessageInput";
import { PageIntro } from "@/components/design-system/PageIntro";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { MessageSquare } from "lucide-react";

export default function PortalChatPage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const openSales = searchParams.get("openSales") === "true";
  const openUserId = searchParams.get("userId");

  const { data: conversationsData, isLoading: convLoading } =
    useGetConversationsQuery({ type: "DIRECT", limit: 50 });

  const [fetchDirectConv] = useLazyGetDirectConversationQuery();
  const { data: teamMembersData } = useGetTeamMembersQuery(undefined, {
    skip: !openSales,
  });

  const conversations = conversationsData?.data ?? [];
  const { data: selectedConvDetails } = useGetConversationQuery(selectedId!, {
    skip: !selectedId,
  });
  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? selectedConvDetails;

  useEffect(() => {
    if (openUserId && !selectedId && !convLoading) {
      const existing = conversations.find((c) =>
        c.participants.some((p) => p.userId === openUserId),
      );
      if (existing) {
        setSelectedId(existing.id);
      } else {
        fetchDirectConv(openUserId)
          .unwrap()
          .then((conv) => {
            setSelectedId(conv.id);
            dispatch(
              chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }]),
            );
          })
          .catch(() => {});
      }
      return;
    }

    if (!openSales || selectedId || convLoading) return;

    // If a specific sales user is requested via openSales but no conversation exists,
    // resolve the first sales/account manager from the team and create a direct chat.
    if (!conversations.length && teamMembersData?.members) {
      const salesMember = teamMembersData.members.find(
        (m) => m.roleType === "SALES" || m.roleType === "ACCOUNT_MANAGER",
      );
      if (salesMember) {
        fetchDirectConv(salesMember.id)
          .unwrap()
          .then((conv) => {
            setSelectedId(conv.id);
            dispatch(
              chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }]),
            );
          })
          .catch(() => {});
        return;
      }
    }

    const firstDirect = conversations[0];
    if (firstDirect) {
      setSelectedId(firstDirect.id);
    }
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

  const { data: messagesData, isLoading: msgLoading } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100 },
    { skip: !selectedId },
  );

  const [sendMessage] = useSendMessageMutation();

  const { onNewMessage, emitTyping, emitStopTyping } = useChatSocket(
    selectedId ?? undefined,
  );

  const [typingUser, setTypingUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (!onNewMessage) return;
    const unsub = onNewMessage((msg: Message) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => {
      unsub?.();
    };
  }, [onNewMessage]);

  useEffect(() => {
    setLocalMessages([]);
    setTypingUser(null);
  }, [selectedId]);

  const displayedMessages =
    localMessages.length > 0 ? localMessages : (messagesData ?? []);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedId(conv.id);
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      try {
        await sendMessage({
          conversationId: selectedId,
          content,
        }).unwrap();
      } catch {
        // message will appear via socket
      }
    },
    [selectedId, sendMessage],
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المحادثات"
        description="من هنا يمكنك التواصل مع المشرفين ومدراء المشاريع المسؤولين عن حسابك."
        icon={MessageSquare}
      />

      <div className="h-[calc(100vh-15rem)] lg:h-[calc(100vh-13rem)]">
        {conversations.length === 0 && !convLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
              <MessageSquare className="h-8 w-8 text-secondary-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-natural-100">
                لا توجد محادثات
              </h3>
              <p className="mt-1 text-sm text-portal-note-text">
                سيتم إنشاء محادثة تلقائياً عند تعيين مسؤول حساب أو مدير مشروع
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full gap-4">
            {/* Conversation list — always visible on desktop, hidden on mobile when a conversation is selected */}
            <div
              className={`w-full shrink-0 md:w-80 md:block ${
                selectedId ? "hidden md:block" : ""
              }`}
            >
              <div className="h-full overflow-hidden rounded-2xl border-portal-card-border border bg-natural-0">
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
                className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-portal-card-border border bg-natural-0 ${
                  selectedId ? "" : "hidden md:flex"
                }`}
              >
                <ChatHeader
                  conversation={selectedConversation}
                  isTyping={typingUser}
                />
                <ChatWindow
                  messages={displayedMessages}
                  isLoading={msgLoading && localMessages.length === 0}
                  typingUser={typingUser}
                />
                <MessageInput
                  onSend={handleSend}
                  onTyping={() => selectedId && emitTyping(selectedId)}
                  onStopTyping={() => selectedId && emitStopTyping(selectedId)}
                />
              </div>
            ) : (
              <div className="hidden min-w-0 flex-1 md:flex">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-portal-card-border border bg-natural-0">
                  <ChatEmptyState />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile back button when viewing a conversation */}
        {selectedId && (
          <button
            onClick={() => setSelectedId(null)}
            className="fixed bottom-24 right-4 z-50 flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-lg md:hidden"
          >
            ← المحادثات
          </button>
        )}
      </div>
    </div>
  );
}
