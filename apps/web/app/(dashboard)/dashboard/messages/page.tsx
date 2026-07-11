"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialConversationId = useMemo(
    () => searchParams.get("conversationId"),
    [searchParams],
  );

  const { user } = useAppSelector((s) => s.auth);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId,
  );
  const [filterType, setFilterType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const { data: conversationsData, isLoading: convLoading } =
    useGetConversationsQuery({
      type: filterType,
      limit: 50,
    });

  const conversations = conversationsData?.data ?? [];
  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const { data: messagesData, isLoading: msgLoading } = useGetMessagesQuery(
    { conversationId: selectedId!, limit: 100 },
    { skip: !selectedId },
  );

  const [sendMessage] = useSendMessageMutation();
  const [sendMessageWithFiles] = useSendMessageWithFilesMutation();

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
    setShowInfoPanel(false);
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
      } catch {
        // fallback: message will appear via socket
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
              messages={displayedMessages}
              isLoading={msgLoading}
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
                      {p.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-natural-100 truncate">
                        {p.user?.name || "مستخدم"}
                      </p>
                      <p className="text-[10px] text-portal-note-text">
                        {p.user?.role === "PM"
                          ? "مدير مشروع"
                          : p.user?.role === "CLIENT"
                            ? "عميل"
                            : p.user?.role === "SALES"
                              ? "مبيعات"
                              : p.user?.role === "ACCOUNTANT"
                                ? "محاسب"
                                : p.user?.role === "MARKETING"
                                  ? "تسويق"
                                  : p.user?.role === "ADMIN"
                                    ? "مدير"
                                    : p.user?.role || ""}
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
            {selectedConversation.client && (
              <div>
                <h4 className="text-xs font-medium text-portal-note-text mb-3 uppercase tracking-wider">
                  العميل
                </h4>
                <div className="p-3 rounded-xl bg-badge-gray-bg">
                  <p className="text-sm font-medium text-natural-100">
                    {selectedConversation.client.companyName}
                  </p>
                  <p className="text-xs text-portal-note-text mt-0.5">
                    {selectedConversation.client.contactName}
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
