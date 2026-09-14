"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortDateLong } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import type { Message } from "@/features/chat/chatApi";

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
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

  return formatShortDateLong(dateStr);
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
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  typingUser,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingScrollAdjustment = useRef<{
    top: number;
    height: number;
    firstMessageId: string | null;
  } | null>(null);
  const didInitialScroll = useRef(false);
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
    if (!isLoading && messages.length > 0 && !didInitialScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      didInitialScroll.current = true;
    }
  }, [isLoading, messages.length]);

  // Prepending history must not move the messages currently in view.
  useLayoutEffect(() => {
    const pending = pendingScrollAdjustment.current;
    const container = containerRef.current;
    if (!pending || !container) return;
    // Ignore socket updates to existing/latest messages. Only a changed first
    // item means the older cursor page has actually been prepended.
    if (pending.firstMessageId === messages[0]?.id) {
      if (!isLoadingOlder) pendingScrollAdjustment.current = null;
      return;
    }
    container.scrollTop = pending.top + (container.scrollHeight - pending.height);
    pendingScrollAdjustment.current = null;
  }, [isLoadingOlder, messages]);

  const handleLoadOlder = () => {
    const container = containerRef.current;
    if (container) {
      pendingScrollAdjustment.current = {
        top: container.scrollTop,
        height: container.scrollHeight,
        firstMessageId: messages[0]?.id ?? null,
      };
    }
    onLoadOlder?.();
  };

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
            {i % 2 !== 0 && <Skeleton className="mt-1 size-8 shrink-0 rounded-full" />}
            <div className="flex flex-col gap-2">
              <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-64" : "w-48")} />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Empty className="border-0 p-6">
        <EmptyMedia variant="icon">
          <MessageSquare />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>لا توجد رسائل بعد</EmptyTitle>
          <EmptyDescription>أرسل أول رسالة لبدء المحادثة 👋</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        onScroll={checkIfAtBottom}
        className="h-full overflow-y-auto px-5 py-4"
      >
        <div className="flex flex-col gap-3">
          {hasMore && onLoadOlder && (
            <div className="flex justify-center pb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadOlder}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder ? "جارٍ تحميل الرسائل..." : "تحميل الرسائل الأقدم"}
              </Button>
            </div>
          )}
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
          aria-label="الانتقال إلى أحدث الرسائل"
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border-border bg-background text-muted-foreground shadow-lg transition-all hover:bg-muted hover:text-primary"
        >
          <ChevronDown data-icon="inline-start" />
        </Button>
      )}
    </div>
  );
}
