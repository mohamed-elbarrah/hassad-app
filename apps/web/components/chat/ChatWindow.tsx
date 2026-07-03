"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/features/chat/chatApi";

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  typingUser?: { userId: string; userName: string } | null;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";

  return date.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shouldShowDateSeparator(
  currentMsg: Message,
  prevMsg: Message | null,
): boolean {
  if (!prevMsg) return true;
  const curr = new Date(currentMsg.createdAt);
  const prev = new Date(prevMsg.createdAt);
  return (
    curr.getFullYear() !== prev.getFullYear() ||
    curr.getMonth() !== prev.getMonth() ||
    curr.getDate() !== prev.getDate()
  );
}

export function ChatWindow({
  messages,
  isLoading,
  typingUser,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
    setShowScrollButton(!isNearBottom);
  }, []);

  // Auto-scroll when new messages arrive (only if at bottom)
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setShowScrollButton(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto">
        {/* Skeleton messages */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              i % 2 === 0 ? "flex-row" : "flex-row-reverse",
            )}
          >
            {i % 2 !== 0 && (
              <div className="w-8 h-8 rounded-full bg-badge-gray-bg animate-pulse shrink-0 mt-1" />
            )}
            <div className="space-y-2">
              <div
                className={cn(
                  "h-10 rounded-2xl bg-badge-gray-bg animate-pulse",
                  i % 2 === 0 ? "w-64" : "w-48",
                )}
              />
              <div className="h-3 w-16 bg-badge-gray-bg animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-secondary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-base font-medium text-natural-100 mb-1">
            لا توجد رسائل بعد
          </p>
          <p className="text-sm text-portal-note-text">
            أرسل أول رسالة لبدء المحادثة 👋
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        onScroll={checkIfAtBottom}
        className="h-full overflow-y-auto px-5 py-4"
      >
        <div className="space-y-3">
          {messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDate = shouldShowDateSeparator(msg, prevMsg);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-px bg-portal-divider" />
                      <span className="shrink-0 text-[11px] text-portal-note-text bg-natural-0 px-3 py-1 rounded-full border border-portal-divider">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-portal-divider" />
                    </div>
                  </div>
                )}
                <MessageBubble message={msg} />
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-badge-gray-bg flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-portal-note-text">
                  {typingUser.userName.charAt(0)}
                </span>
              </div>
              <div className="bg-natural-0 border border-portal-card-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-portal-note-text animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-portal-note-text animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-portal-note-text animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-natural-0 border border-portal-card-border shadow-lg hover:shadow-xl hover:bg-badge-gray-bg transition-all text-portal-note-text hover:text-secondary-500 z-10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
