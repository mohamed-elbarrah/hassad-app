"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";
import type { Message } from "@/features/chat/chatApi";

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  typingUser?: { userId: string; userName: string } | null;
}

export function ChatWindow({ messages, isLoading, typingUser }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-neutral-300">
          لا توجد رسائل بعد. ابدأ المحادثة!
        </p>
      </div>
    );
  }

  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="space-y-3">
        {messages.map((msg) => {
          const msgDate = new Date(msg.createdAt).toLocaleDateString("ar-SA");
          let showDateSeparator = false;
          if (msgDate !== lastDate) {
            lastDate = msgDate;
            showDateSeparator = true;
          }

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center py-2">
                  <span className="rounded-full bg-neutral-50 px-3 py-0.5 text-[10px] text-neutral-300">
                    {new Date(msg.createdAt).toLocaleDateString("ar-SA", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              <MessageBubble message={msg} />
            </div>
          );
        })}

        {typingUser && (
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <span className="animate-pulse">✍️</span>
            <span>{typingUser.userName} يكتب...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}