"use client";

import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Pill } from "@/components/design-system/Pill";
import type { Conversation } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";

interface ChatHeaderProps {
  conversation: Conversation;
  isTyping?: { userId: string; userName: string } | null;
}

function getTypeBadge(type: "DIRECT" | "GROUP") {
  return type === "GROUP"
    ? { label: "مجموعة", tone: "success" as const }
    : { label: "محادثة خاصة", tone: "blue" as const };
}

export function ChatHeader({ conversation, isTyping }: ChatHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const typeBadge = getTypeBadge(conversation.type);

  const other = conversation.participants.find((p) => p.userId !== user?.id);

  const name =
    conversation.type === "GROUP"
      ? conversation.title || "مجموعة"
      : other?.user?.name ?? conversation.title ?? "محادثة";

  const subtitle =
    conversation.type === "GROUP"
      ? `${conversation.participants.length} عضو${conversation.participants.length !== 1 ? "اً" : ""}`
      : conversation.client?.companyName;

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <UserAvatar name={name} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{name}</span>
          <Pill tone={typeBadge.tone} className="text-[10px]">
            {typeBadge.label}
          </Pill>
        </div>

        {isTyping ? (
          <p className="text-xs text-primary animate-pulse">
            {isTyping.userName} يكتب...
          </p>
        ) : (
          subtitle && (
            <p className="truncate text-xs text-neutral-300">{subtitle}</p>
          )
        )}
      </div>
    </div>
  );
}
