"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";

interface ChatHeaderProps {
  conversation: Conversation;
  isTyping?: { userId: string; userName: string } | null;
}

function getTypeBadge(type: "SALES" | "PM") {
  return type === "SALES"
    ? { label: "مستشارك الفني", variant: "secondary" as const }
    : { label: "مدير مشروع", variant: "default" as const };
}

export function ChatHeader({ conversation, isTyping }: ChatHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== user?.id,
  );
  const typeBadge = getTypeBadge(conversation.type);

  const initials = otherParticipant?.user?.name
    ? otherParticipant.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "??";

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {otherParticipant?.user?.name ?? conversation.title}
          </span>
          <Badge variant={typeBadge.variant} className="text-[10px]">
            {typeBadge.label}
          </Badge>
        </div>

        {isTyping && (
          <p className="text-xs text-primary animate-pulse">
            {isTyping.userName} يكتب...
          </p>
        )}
      </div>

      <span className="text-xs text-muted-foreground">
        {conversation.client?.companyName}
      </span>
    </div>
  );
}