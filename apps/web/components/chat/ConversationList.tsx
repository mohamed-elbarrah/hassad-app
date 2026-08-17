"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/features/chat/chatApi";
import { Search, MessageSquarePlus, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
  filterType?: "DIRECT" | "GROUP";
  onFilterChange?: (type: "DIRECT" | "GROUP") => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
  filterType,
  onFilterChange,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const name =
        conv.title?.toLowerCase() ??
        conv.participants.map((p) => p.user?.name?.toLowerCase()).join(" ") ??
        "";
      const clientName = conv.client?.companyName?.toLowerCase() ?? "";
      const projectName = conv.project?.name?.toLowerCase() ?? "";
      return (
        name.includes(q) || clientName.includes(q) || projectName.includes(q)
      );
    });
  }, [conversations, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="space-y-4 border-b border-border p-4">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="flex-1 space-y-1 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">المحادثات</h2>
          <button
            onClick={() => toast.info("إنشاء محادثة جديدة قريباً")}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="محادثة جديدة"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن محادثة..."
            className="h-9 w-full rounded-xl border-none bg-muted pr-9 pl-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            dir="rtl"
          />
        </div>

        {/* Filter tabs */}
        {onFilterChange && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onFilterChange("DIRECT")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "DIRECT"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              خاصة
            </button>
            <button
              onClick={() => onFilterChange("GROUP")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filterType === "GROUP"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              مجموعات
            </button>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            {searchQuery ? (
              <>
                <Search className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  لا توجد نتائج
                </p>
                <p className="text-xs text-muted-foreground">
                  لا توجد محادثات تطابق &quot;{searchQuery}&quot;
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  لا توجد محادثات
                </p>
                <p className="text-xs text-muted-foreground">
                  {filterType === "DIRECT"
                    ? "لم تبدأ أي محادثة خاصة بعد"
                    : "لم تنشئ أي مجموعة بعد"}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="py-1">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onClick={() => onSelect(conv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
