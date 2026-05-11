"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} from "@/features/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { MessageInput } from "@/components/chat/MessageInput";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"SALES" | "PM" | undefined>(
    undefined,
  );
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const {
    data: conversationsData,
    isLoading: convLoading,
  } = useGetConversationsQuery({
    type: filterType,
    limit: 50,
  });

  const conversations = conversationsData?.data ?? [];
  const selectedConversation = conversations.find(
    (c) => c.id === selectedId,
  );

  const {
    data: messagesData,
    isLoading: msgLoading,
  } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100 },
    { skip: !selectedId },
  );

  const [sendMessage] = useSendMessageMutation();

  const { isConnected, onNewMessage, emitTyping, emitStopTyping } =
    useChatSocket(selectedId ?? undefined);

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

  const displayedMessages = localMessages.length > 0
    ? localMessages
    : (messagesData ?? []);

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setSelectedId(conv.id);
    },
    [],
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      try {
        await sendMessage({ conversationId: selectedId, content }).unwrap();
      } catch {
        // fallback: message will appear via socket
      }
    },
    [selectedId, sendMessage],
  );

  const roleFilterHint = () => {
    if (user?.role === UserRole.SALES) return "مبيعات";
    if (user?.role === UserRole.PM) return "مشاريع";
    return "";
  };

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
    <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-xl border" dir="rtl">
      {/* Desktop sidebar */}
      <div className="hidden w-80 shrink-0 border-l md:block">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
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
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  );
}