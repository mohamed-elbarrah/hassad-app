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

function getLastMessage(conversation: Conversation): Message | null {
  if (!conversation.messages || conversation.messages.length === 0) return null;
  return conversation.messages[0];
}

function getTypeLabel(type: "DIRECT" | "GROUP") {
  return type === "DIRECT" ? "محادثة خاصة" : "مجموعة";
}

function getParticipantPreview(
  conversation: Conversation,
  currentUserId?: string,
): string {
  const others = conversation.participants
    .filter((p) => p.userId !== currentUserId)
    .map((p) => p.user?.name ?? "")
    .filter(Boolean);

  if (others.length === 0) return "أنت فقط";
  if (others.length <= 2) return others.join("، ");
  return `${others[0]}، ${others[1]} +${others.length - 2}`;
}

function getDisplayInfo(conversation: Conversation, currentUserId?: string) {
  if (conversation.type === "GROUP") {
    return {
      name: conversation.title || "مجموعة",
      subtitle: getParticipantPreview(conversation, currentUserId),
      avatarName: conversation.title || "G",
    };
  }

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const name = other?.user?.name ?? conversation.title ?? "محادثة";
  return {
    name,
    subtitle: conversation.client?.companyName,
    avatarName: name,
  };
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const user = useAppSelector((s) => s.auth.user);
  const lastMessage = getLastMessage(conversation);
  const info = getDisplayInfo(conversation, user?.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors hover:bg-neutral-50/50",
        isActive && "bg-neutral-50",
      )}
    >
      <UserAvatar name={info.avatarName} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{info.name}</span>
          <span className="shrink-0 text-xs text-neutral-300">
            {lastMessage
              ? formatRelativeTime(lastMessage.createdAt)
              : formatRelativeTime(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-neutral-300">
            {lastMessage ? lastMessage.content : info.subtitle ?? "لا توجد رسائل بعد"}
          </p>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {getTypeLabel(conversation.type)}
          </span>
        </div>
      </div>
    </button>
  );
}
