"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function getOtherParticipant(
  conversation: Conversation,
  currentUserId: string,
) {
  return conversation.participants.find((p) => p.userId !== currentUserId);
}

function getLastMessage(conversation: Conversation): Message | null {
  if (!conversation.messages || conversation.messages.length === 0) return null;
  return conversation.messages[0];
}

function getTypeLabel(type: "SALES" | "PM") {
  return type === "SALES" ? "مبيعات" : "مدير مشروع";
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const user = useAppSelector((s) => s.auth.user);
  const otherParticipant = getOtherParticipant(
    conversation,
    user?.id ?? "",
  );
  const lastMessage = getLastMessage(conversation);

  const initials = otherParticipant?.user?.name
    ? otherParticipant.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "??";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors hover:bg-muted/50",
        isActive && "bg-muted",
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
        {otherParticipant?.user && (
          <AvatarImage src="" alt={otherParticipant.user.name} />
        )}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {otherParticipant?.user?.name ?? conversation.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {lastMessage
              ? formatRelativeTime(lastMessage.createdAt)
              : formatRelativeTime(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {lastMessage ? lastMessage.content : "لا توجد رسائل بعد"}
          </p>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {getTypeLabel(conversation.type)}
          </span>
        </div>
      </div>
    </button>
  );
}