"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation, Message } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";
import { useMemo } from "react";
import { CheckCheck, Users } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function getLastMessage(conversation: Conversation): Message | null {
  if (!conversation.messages || conversation.messages.length === 0) return null;
  return conversation.messages[0];
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
    (p) => p.userId !== currentUserId,
  );
  const name = other?.user?.name ?? conversation.title ?? "محادثة";

  // Role-based subtitle
  let subtitle = "";
  if (currentUserRole === "PM" || currentUserRole === "ADMIN") {
    subtitle = conversation.client?.companyName
      ? conversation.client.companyName
      : conversation.project?.name
        ? `مشروع ${conversation.project.name}`
        : "";
  } else if (currentUserRole === "CLIENT") {
    subtitle = conversation.project?.name
      ? `مشروع ${conversation.project.name}`
      : "";
  } else {
    subtitle = conversation.client?.companyName ?? "";
  }

  return {
    name,
    subtitle,
    avatarName: name,
    meta: other?.user?.role
      ? other.user.role === "PM"
        ? "مدير مشروع"
        : other.user.role === "SALES"
          ? "مبيعات"
          : other.user.role === "CLIENT"
            ? "عميل"
            : ""
      : "",
  };
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const user = useAppSelector((s) => s.auth.user);
  const lastMessage = getLastMessage(conversation);
  const info = getDisplayInfo(conversation, user?.id, user?.role);

  // Simulated unread count — would come from API in production
  const unreadCount = 0;

  // Check if last message was from the current user
  const isLastMessageOwn = lastMessage?.senderId === user?.id;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-3 px-4 py-3.5 text-right transition-all duration-200",
        "hover:bg-secondary-500/5",
        isActive && "bg-secondary-500/10",
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-200",
          isActive ? "bg-secondary-500" : "bg-transparent",
        )}
      />

      {/* Avatar with online status */}
      <div className="relative shrink-0 mt-0.5">
        <UserAvatar name={info.avatarName} size="sm" />
        {/* Online status dot */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            "bg-success-500", // would be dynamic based on real status
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + time + pin */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "truncate text-sm font-medium",
                isActive ? "text-secondary-700" : "text-natural-100",
              )}
            >
              {info.name}
            </span>
            {info.meta && (
              <span className="shrink-0 text-[10px] text-portal-note-text bg-badge-gray-bg px-1.5 py-0.5 rounded-md">
                {info.meta}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-portal-note-text">
            {lastMessage
              ? formatRelativeTime(lastMessage.createdAt)
              : formatRelativeTime(conversation.createdAt)}
          </span>
        </div>

        {/* Subtitle row */}
        {info.subtitle && !lastMessage && (
          <p className="text-xs text-portal-note-text mb-1 truncate">
            {info.subtitle}
          </p>
        )}

        {/* Bottom row: last message preview + unread */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isLastMessageOwn && lastMessage && (
              <CheckCheck className="w-3.5 h-3.5 shrink-0 text-secondary-500" />
            )}
            <p className="truncate text-xs text-portal-note-text">
              {lastMessage ? (
                <>
                  {conversation.type === "GROUP" && lastMessage.sender && (
                    <span className="font-medium text-natural-100">
                      {lastMessage.sender.name}:{" "}
                    </span>
                  )}
                  {lastMessage.content}
                </>
              ) : (
                <span className="text-portal-note-text">
                  {info.subtitle || "لا توجد رسائل بعد"}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary-500 text-[10px] font-bold text-white px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}

            {/* Type icon */}
            {conversation.type === "GROUP" && (
              <Users className="w-3.5 h-3.5 text-portal-note-text" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
