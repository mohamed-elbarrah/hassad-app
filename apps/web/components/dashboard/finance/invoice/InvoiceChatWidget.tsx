"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateDirectConversationMutation,
} from "@/features/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import type { Message } from "@/features/chat/chatApi";

interface InvoiceChatWidgetProps {
  clientId: string;
  clientUserId?: string | null;
}

export function InvoiceChatWidget({
  clientId,
  clientUserId,
}: InvoiceChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  void useAppSelector((s) => s.auth.user);

  // Find conversation for this client
  const { data: conversationsData, isLoading: convLoading } =
    useGetConversationsQuery({ clientId, limit: 1 }, { skip: !clientId });

  const conversation = conversationsData?.data?.[0];
  const conversationId = conversation?.id;

  // Get messages if conversation exists
  const { data: messagesData, isLoading: msgLoading } = useGetMessagesQuery(
    { conversationId: conversationId!, limit: 10 },
    { skip: !conversationId },
  );

  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateDirectConversationMutation();

  // Socket for real-time
  const { isConnected, onNewMessage, emitTyping, emitStopTyping } =
    useChatSocket(conversationId);

  // Listen for new messages via socket
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

  // Reset local state when conversation changes
  useEffect(() => {
    setLocalMessages([]);
    setTypingUser(null);
  }, [conversationId]);

  // Merge server + local messages
  const displayedMessages = useMemo(() => {
    const server = messagesData ?? [];
    const serverIds = new Set(server.map((m) => m.id));
    const uniqueLocal = localMessages.filter((m) => !serverIds.has(m.id));
    return [...server, ...uniqueLocal].slice(-10); // last 10
  }, [messagesData, localMessages]);

  const handleSend = useCallback(
    async (content: string, _files?: File[]) => {
      if (!conversationId) {
        // Create conversation first if we have the client's user ID
        if (clientUserId) {
          try {
            const newConv = await createConversation({
              userId: clientUserId,
            }).unwrap();
            // After creation, send the message
            await sendMessage({ conversationId: newConv.id, content }).unwrap();
          } catch {
            toast.error("فشل إنشاء المحادثة");
          }
        }
        return;
      }
      try {
        await sendMessage({ conversationId, content }).unwrap();
      } catch {
        // Message will appear via socket
      }
    },
    [conversationId, clientUserId, sendMessage, createConversation],
  );

  const handleStartConversation = useCallback(async () => {
    if (clientUserId) {
      try {

        toast.success("تم إنشاء المحادثة");
        // Expand the widget to show the new conversation
        setIsExpanded(true);
      } catch {
        toast.error("فشل إنشاء المحادثة");
      }
    } else {
      toast.error(
        "لا يمكن إنشاء محادثة: لم يتم العثور على حساب المستخدم للعميل",
      );
    }
  }, [clientUserId, createConversation]);

  const lastMessage = displayedMessages[displayedMessages.length - 1];

  return (
    <>
      {convLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-portal-note-text" />
        </div>
      ) : !conversation ? (
        <div className="text-center py-3 space-y-2">
          <p className="text-sm text-portal-note-text">
            لا توجد محادثة مع هذا العميل
          </p>
          <ActionButton
            variant="outline"
            size="sm"
            icon={<MessageSquare className="w-3 h-3" />}
            onClick={handleStartConversation}
          >
            بدء محادثة
          </ActionButton>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connection status + expand toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-success-500" : "bg-alert-500",
                )}
              />
              <span className="text-[10px] text-portal-note-text">
                {isConnected ? "متصل" : "غير متصل"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {conversationId && (
                <Link
                  href={`/dashboard/messages?conversationId=${conversationId}`}
                >
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    icon={<ExternalLink className="w-3 h-3" />}
                  >
                    فتح
                  </ActionButton>
                </Link>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {isExpanded ? (
            <>
              {/* Messages */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-portal-note-text" />
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <p className="text-center text-sm text-portal-note-text py-4">
                    لا توجد رسائل بعد. أرسل أول رسالة.
                  </p>
                ) : (
                  displayedMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
              </div>

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:300ms]" />
                  </span>
                  {typingUser.userName} يكتب...
                </div>
              )}

              {/* Input */}
              <MessageInput
                onSend={handleSend}
                onTyping={() => emitTyping?.(conversationId!)}
                onStopTyping={() => emitStopTyping?.(conversationId!)}
                placeholder="اكتب رسالتك..."
              />
            </>
          ) : (
            /* Collapsed: show last message preview */
            <div className="flex items-center gap-2 text-sm">
              {lastMessage ? (
                <>
                  <span className="text-xs text-portal-note-text shrink-0">
                    آخر رسالة:
                  </span>
                  <span className="truncate text-natural-100">
                    {lastMessage.content}
                  </span>
                </>
              ) : (
                <span className="text-portal-note-text">
                  لا توجد رسائل سابقة
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
