"use client";

import { useEffect, useRef } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import type { AiMessage } from "@/features/aiAssistantApi";

interface ChatMessagesProps {
  messages: AiMessage[];
  streamingContent: string;
  isStreaming: boolean;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const visible = messages.filter(
    (m) => m.role === "USER" || m.role === "ASSISTANT",
  );

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite">
      {visible.length === 0 && !isStreaming && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <Bot className="w-12 h-12 text-neutral-300" />
          <div>
            <p className="font-medium text-neutral-500">مرحباً بك في المساعد الذكي</p>
            <p className="text-sm mt-1">
              يمكنني مساعدتك في التقارير والنصائح حول CRM، المالية، العملاء، المشاريع، والتسويق
            </p>
          </div>
        </div>
      )}

      {visible.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "ASSISTANT" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary-600" />
            </div>
          )}

          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "USER"
                ? "rounded-bl-sm bg-primary text-primary-foreground"
                : "rounded-tr-sm bg-muted text-foreground"
            }`}
          >
            {msg.content}
          </div>

          {msg.role === "USER" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
          )}
        </div>
      ))}

      {isStreaming && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-secondary-600" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-neutral-100 text-neutral-800 px-4 py-2.5 text-sm leading-relaxed">
            {streamingContent || <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
