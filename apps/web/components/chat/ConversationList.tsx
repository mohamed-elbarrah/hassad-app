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
        <div className="border-b border-portal-divider p-4 space-y-4">
          <div className="h-6 w-24 bg-badge-gray-bg rounded-lg animate-pulse" />
          <div className="h-9 w-full bg-badge-gray-bg rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 space-y-1 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-badge-gray-bg animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-badge-gray-bg rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-badge-gray-bg rounded animate-pulse" />
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
      <div className="border-b border-portal-divider p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-natural-100">المحادثات</h2>
          <button
            onClick={() => toast.info("إنشاء محادثة جديدة قريباً")}
            className="p-1.5 rounded-lg text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-colors"
            title="محادثة جديدة"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن محادثة..."
            className="w-full h-9 pr-9 pl-3 text-sm rounded-xl bg-badge-gray-bg border-none outline-none focus:ring-2 focus:ring-secondary-500/30 placeholder:text-portal-note-text text-natural-100 transition-all"
            dir="rtl"
          />
        </div>

        {/* Filter tabs */}
        {onFilterChange && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onFilterChange("DIRECT")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all",
                filterType === "DIRECT"
                  ? "bg-secondary-500 text-white shadow-sm"
                  : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              خاصة
            </button>
            <button
              onClick={() => onFilterChange("GROUP")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all",
                filterType === "GROUP"
                  ? "bg-secondary-500 text-white shadow-sm"
                  : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
              )}
            >
              <Users className="w-3.5 h-3.5" />
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
                <Search className="w-10 h-10 text-portal-note-text mb-3" />
                <p className="text-sm font-medium text-natural-100 mb-1">
                  لا توجد نتائج
                </p>
                <p className="text-xs text-portal-note-text">
                  لا توجد محادثات تطابق &quot;{searchQuery}&quot;
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="w-10 h-10 text-portal-note-text mb-3" />
                <p className="text-sm font-medium text-natural-100 mb-1">
                  لا توجد محادثات
                </p>
                <p className="text-xs text-portal-note-text">
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
