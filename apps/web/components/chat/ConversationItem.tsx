"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";
import { CHAT_DELETED_MESSAGE_LABEL } from "@/lib/i18n";

import { CheckCheck, Users } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function getLastMessage(conversation: Conversation): Message | null {
  return conversation.lastMessage ?? null;
}

function getParticipantPreview(
  conversation: Conversation,
  currentUserId?: string,
): string {
  const others = conversation.participants
    .filter((p) => p.id !== currentUserId)
    .map((p) => p.name ?? "")
    .filter(Boolean);

  if (others.length === 0) return "أنت فقط";
  if (others.length <= 2) return others.join("، ");
  return `${others[0]}، ${others[1]} +${others.length - 2}`;
}

function getDisplayInfo(
  conversation: Conversation,
  currentUserId?: string,
  currentUserRole?: string,
) {
  if (conversation.type === "GROUP") {
    return {
      name: conversation.title || "مجموعة",
      subtitle: getParticipantPreview(conversation, currentUserId),
      avatarName: conversation.title || "G",
      meta: `${conversation.participants.length} أعضاء`,
    };
  }

  const other = conversation.participants.find(
    (p) => p.id !== currentUserId,
  );
  const name = other?.name ?? conversation.title ?? "محادثة";

  // Role-based subtitle
  let subtitle = "";
  if (currentUserRole === "PM" || currentUserRole === "ADMIN") {
    subtitle = conversation.clientName
      ? conversation.clientName
      : conversation.project?.name
        ? `مشروع ${conversation.project.name}`
        : "";
  } else if (currentUserRole === "CLIENT") {
    subtitle = conversation.project?.name
      ? `مشروع ${conversation.project.name}`
      : "";
  } else {
    subtitle = conversation.clientName ?? "";
  }

  return {
    name,
    subtitle,
    avatarName: name,
    meta: "",
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const user = useAppSelector((s) => s.auth.user);
  const lastMessage = getLastMessage(conversation);
  const info = getDisplayInfo(conversation, user?.id, user?.role);

  const unreadCount = Math.max(0, conversation.unreadCount ?? 0);

  // Check if last message was from the current user
  const isLastMessageOwn = lastMessage?.sender.id === user?.id;
  const otherParticipant = conversation.participants.find(
    (participant) => participant.id !== user?.id,
  );
  const isOnline = conversation.type === "DIRECT" && Boolean(otherParticipant?.isOnline);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-3 px-4 py-3.5 text-right transition-all duration-200",
        "hover:bg-primary/5",
        isActive && "bg-primary/10",
        unreadCount > 0 && !isActive && "font-semibold",
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          "absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
          isActive ? "bg-primary" : "bg-transparent",
        )}
      />

      {/* Avatar with online status */}
      <div className="relative mt-0.5 shrink-0">
        <Avatar className="h-6 w-6 rounded-lg">
          <AvatarFallback className="bg-muted text-xs text-foreground">
            {getInitials(info.avatarName)}
          </AvatarFallback>
        </Avatar>
        {/* Online status dot */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            conversation.type === "DIRECT" && isOnline
              ? "bg-success"
              : "bg-muted-foreground/40",
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + time + pin */}
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium",
                isActive ? "text-primary" : "text-foreground",
              )}
            >
              {info.name}
            </span>
            {info.meta && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {info.meta}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {lastMessage
              ? formatRelativeTime(lastMessage.createdAt)
              : formatRelativeTime(conversation.createdAt)}
          </span>
        </div>

        {/* Subtitle row */}
        {info.subtitle && !lastMessage && (
          <p className="mb-1 truncate text-xs text-muted-foreground">
            {info.subtitle}
          </p>
        )}

        {/* Bottom row: last message preview + unread */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {isLastMessageOwn && lastMessage && (
              <CheckCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            <p className="truncate text-xs text-muted-foreground">
              {lastMessage ? (
                <>
                  {conversation.type === "GROUP" && lastMessage.sender && (
                    <span className="font-medium text-foreground">
                      {lastMessage.sender.name}:{" "}
                    </span>
                  )}
                  {lastMessage.deletedAt
                    ? CHAT_DELETED_MESSAGE_LABEL
                    : lastMessage.displayContent || lastMessage.content}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {info.subtitle || "لا توجد رسائل بعد"}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} رسائل غير مقروءة`}
                className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}

            {/* Type icon */}
            {conversation.type === "GROUP" && (
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
