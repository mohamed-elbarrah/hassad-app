"use client";

import { useState, useMemo, useId } from "react";
import { ConversationItem } from "./ConversationItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
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
  const searchInputId = useId();

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const name = [
        conv.title ?? "",
        conv.participants.map((p) => p.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const clientName = conv.clientName?.toLowerCase() ?? "";
      const projectName = conv.project?.name?.toLowerCase() ?? "";
      return (
        name.includes(q) || clientName.includes(q) || projectName.includes(q)
      );
    });
  }, [conversations, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-4 border-b border-border p-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => toast.info("إنشاء محادثة جديدة قريباً")}
            aria-label="محادثة جديدة"
          >
            <MessageSquarePlus data-icon="inline-start" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            البحث في المحادثات
          </label>
          <Search aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن محادثة..."
            className="h-9 rounded-xl border-none bg-muted pr-9 pl-3 text-sm transition-all focus:ring-2 focus:ring-primary/30"
            dir="rtl"
          />
        </div>

        {/* Filter tabs */}
        {onFilterChange && (
          <ToggleGroup
            type="single"
            value={filterType}
            onValueChange={(value) => {
              if (value === "DIRECT" || value === "GROUP") onFilterChange(value);
            }}
            variant="outline"
            size="sm"
            aria-label="نوع المحادثة"
            className="mt-3 justify-start"
          >
            <ToggleGroupItem value="DIRECT" aria-label="المحادثات الخاصة">
              <MessageCircle data-icon="inline-start" />
              خاصة
            </ToggleGroupItem>
            <ToggleGroupItem value="GROUP" aria-label="المحادثات الجماعية">
              <Users data-icon="inline-start" />
              مجموعات
            </ToggleGroupItem>
          </ToggleGroup>
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
