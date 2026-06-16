"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
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

function getTypeLabel(type: "SALES" | "PM" | "TEAM") {
  if (type === "TEAM") return "فريق العمل";
  return type === "SALES" ? "مستشارك الفني" : "مدير مشروع";
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const user = useAppSelector((s) => s.auth.user);
  const otherParticipant = getOtherParticipant(conversation, user?.id ?? "");
  const lastMessage = getLastMessage(conversation);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors hover:bg-neutral-50/50",
        isActive && "bg-neutral-50",
      )}
    >
      <UserAvatar
        name={otherParticipant?.user?.name ?? conversation.title}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {otherParticipant?.user?.name ?? conversation.title}
          </span>
          <span className="shrink-0 text-xs text-neutral-300">
            {lastMessage
              ? formatRelativeTime(lastMessage.createdAt)
              : formatRelativeTime(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-neutral-300">
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
