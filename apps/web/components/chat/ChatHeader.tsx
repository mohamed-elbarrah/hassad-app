"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

export function ChatHeader({ conversation, isTyping }: ChatHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const info = getHeaderInfo(conversation, user?.id, user?.role);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-background px-5 py-3.5">
      {/* Avatar with online status */}
      <div className="relative shrink-0">
        <Avatar className="h-6 w-6 rounded-lg">
          <AvatarFallback className="bg-muted text-xs text-foreground">
            {getInitials(info.avatarName)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            "bg-success",
          )}
        />
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {info.name}
          </span>
          {info.otherUserRole && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
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
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs text-primary">
              {isTyping.userName} يكتب...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {info.subtitle || "متصل"}
            </span>
            {info.projectLink && (
              <Link
                href={info.projectLink}
                className="flex shrink-0 items-center gap-1 text-xs text-primary transition-colors hover:text-primary"
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
          className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
          title="بحث في المحادثة"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast.info("المكالمات الصوتية قريباً")}
          className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
          title="مكالمة"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast.info("خيارات إضافية قريباً")}
          className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
          title="المزيد"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
