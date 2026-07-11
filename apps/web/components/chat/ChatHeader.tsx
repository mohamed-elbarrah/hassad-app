"use client";

import { UserAvatar } from "@/components/design-system/UserAvatar";
import type { Conversation } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { Phone, MoreHorizontal, Search, ExternalLink } from "lucide-react";

interface ChatHeaderProps {
  conversation: Conversation;
  isTyping?: { userId: string; userName: string } | null;
}

function getHeaderInfo(
  conversation: Conversation,
  currentUserId?: string,
  currentUserRole?: string,
) {
  if (conversation.type === "GROUP") {
    return {
      name: conversation.title || "مجموعة",
      subtitle: `${conversation.participants.length} أعضاء`,
      avatarName: conversation.title || "G",
      projectLink: conversation.project?.id
        ? `/dashboard/pm/projects/${conversation.project.id}`
        : null,
      projectName: conversation.project?.name,
    };
  }

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const name = other?.user?.name ?? conversation.title ?? "محادثة";

  // Role-based subtitle
  let subtitle = "";
  let projectLink: string | null = null;
  let projectName: string | null = null;

  if (currentUserRole === "PM" || currentUserRole === "ADMIN") {
    if (conversation.project?.name) {
      subtitle = `مشروع ${conversation.project.name}`;
      projectName = conversation.project.name;
      projectLink = `/dashboard/pm/projects/${conversation.project.id}`;
    } else if (conversation.client?.companyName) {
      subtitle = conversation.client.companyName;
    }
  } else if (currentUserRole === "CLIENT") {
    if (conversation.project?.name) {
      subtitle = `مشروع ${conversation.project.name}`;
      projectName = conversation.project.name;
      projectLink = `/portal/projects/${conversation.project.id}`;
    }
  } else {
    if (conversation.project?.name) {
      subtitle = `مشروع ${conversation.project.name}`;
    } else if (conversation.client?.companyName) {
      subtitle = conversation.client.companyName;
    }
  }

  return {
    name,
    subtitle,
    avatarName: name,
    projectLink,
    projectName,
    otherUserRole: other?.user?.role,
  };
}

export function ChatHeader({ conversation, isTyping }: ChatHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const info = getHeaderInfo(conversation, user?.id, user?.role);

  return (
    <div className="flex items-center gap-3 border-b border-portal-divider px-5 py-3.5 bg-natural-0">
      {/* Avatar with online status */}
      <div className="relative shrink-0">
        <UserAvatar name={info.avatarName} size="sm" />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            "bg-success-500",
          )}
        />
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-natural-100">
            {info.name}
          </span>
          {info.otherUserRole && (
            <span className="shrink-0 text-[10px] text-portal-note-text bg-badge-gray-bg px-1.5 py-0.5 rounded-md">
              {info.otherUserRole === "PM"
                ? "مدير مشروع"
                : info.otherUserRole === "SALES"
                  ? "مبيعات"
                  : info.otherUserRole === "CLIENT"
                    ? "عميل"
                    : info.otherUserRole === "ACCOUNTANT"
                      ? "محاسب"
                      : info.otherUserRole === "MARKETING"
                        ? "تسويق"
                        : info.otherUserRole === "ADMIN"
                          ? "مدير"
                          : info.otherUserRole}
            </span>
          )}
        </div>

        {isTyping ? (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs text-secondary-500">
              {isTyping.userName} يكتب...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="truncate text-xs text-portal-note-text">
              {info.subtitle || "متصل"}
            </span>
            {info.projectLink && (
              <Link
                href={info.projectLink}
                className="flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-600 transition-colors shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                {info.projectName}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => toast.info("البحث في المحادثة قريباً")}
          className="p-2 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all"
          title="بحث في المحادثة"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast.info("المكالمات الصوتية قريباً")}
          className="p-2 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all"
          title="مكالمة"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast.info("خيارات إضافية قريباً")}
          className="p-2 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all"
          title="المزيد"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
