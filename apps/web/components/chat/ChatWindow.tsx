"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
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
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
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
              <div className="mt-1 h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            )}
            <div className="space-y-2">
              <div
                className={cn(
                  "h-10 animate-pulse rounded-2xl bg-muted",
                  i % 2 === 0 ? "w-64" : "w-48",
                )}
              />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <p className="mb-1 text-base font-medium text-foreground">
            لا توجد رسائل بعد
          </p>
          <p className="text-sm text-muted-foreground">
            أرسل أول رسالة لبدء المحادثة 👋
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
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
                    <div className="flex w-full items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <span className="text-xs font-medium text-muted-foreground">
                  {typingUser.userName.charAt(0)}
                </span>
              </div>
              <div className="rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          variant="outline"
          size="icon"
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border-border bg-background text-muted-foreground shadow-lg transition-all hover:bg-muted hover:text-primary"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
