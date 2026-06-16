"use client";

import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import type { Conversation } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";

interface ChatHeaderProps {
  conversation: Conversation;
  isTyping?: { userId: string; userName: string } | null;
}

function getTypeBadge(type: "SALES" | "PM" | "TEAM") {
  if (type === "TEAM") return { label: "فريق العمل", tone: "success" as const };
  return type === "SALES"
    ? { label: "مستشارك الفني", tone: "neutral" as const }
    : { label: "مدير مشروع", tone: "blue" as const };
}

export function ChatHeader({ conversation, isTyping }: ChatHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== user?.id,
  );
  const typeBadge = getTypeBadge(conversation.type);

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <UserAvatar
        name={otherParticipant?.user?.name ?? conversation.title}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {otherParticipant?.user?.name ?? conversation.title}
          </span>
          <Pill tone={typeBadge.tone} className="text-[10px]">
            {typeBadge.label}
          </Pill>
        </div>

        {isTyping && (
          <p className="text-xs text-primary animate-pulse">
            {isTyping.userName} يكتب...
          </p>
        )}
      </div>

      <span className="text-xs text-neutral-300">
        {conversation.client?.companyName}
      </span>
    </div>
  );
}
