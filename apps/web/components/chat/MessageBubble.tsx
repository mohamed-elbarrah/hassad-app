"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import type { Message } from "@/features/chat/chatApi";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const user = useAppSelector((s) => s.auth.user);
  const isOwn = message.senderId === user?.id;

  const initials = message.sender?.name
    ? message.sender.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "??";

  return (
    <div className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[75%] space-y-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {message.content}
        </div>

        <p
          className={cn(
            "text-[10px] text-muted-foreground",
            isOwn ? "text-left" : "text-right",
          )}
        >
          {isOwn ? "أنت" : message.sender?.name} ·{" "}
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}