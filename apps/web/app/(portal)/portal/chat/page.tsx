"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toast } from "sonner"; // NEW
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
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { MessageInput } from "@/components/chat/MessageInput";
import { Button } from "@/components/ui/button";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { MessageSquare } from "lucide-react";

export default function PortalChatPage() {
  void useAppSelector((s) => s.auth);
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
              chatApi.util.invalidateTags([
                { type: "Conversation", id: "LIST" },
              ]),
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
              chatApi.util.invalidateTags([
                { type: "Conversation", id: "LIST" },
              ]),
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

  const displayedMessages = useMemo(() => {
    const server = messagesData ?? [];
    const serverIds = new Set(server.map((m) => m.id));
    const uniqueLocal = localMessages.filter((m) => !serverIds.has(m.id));
    return [...server, ...uniqueLocal];
  }, [messagesData, localMessages]);

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
      } catch (err) {
        toast.error(err?.data?.message || "فشل في إرسال الرسالة");
      }
    },
    [selectedId, sendMessage],
  );

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageSquare className="h-6 w-6 text-primary" />
          المحادثات
        </h1>
        <p className="text-muted-foreground">
          من هنا يمكنك التواصل مع المشرفين ومدراء المشاريع المسؤولين عن حسابك.
        </p>
      </div>

      <div className="h-[calc(100vh-15rem)] lg:h-[calc(100vh-13rem)]">
        {conversations.length === 0 && !convLoading ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-border bg-muted/30">
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
                <ChatWindow
                  messages={displayedMessages}
                  isLoading={msgLoading}
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
