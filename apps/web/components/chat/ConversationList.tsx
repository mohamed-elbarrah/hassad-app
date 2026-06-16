"use client";

import { cn } from "@/lib/utils";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/features/chat/chatApi";
import { Loader2 } from "lucide-react";

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
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <h2 className="mb-2 text-lg font-semibold">المحادثات</h2>
        {onFilterChange && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onFilterChange("DIRECT")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                filterType === "DIRECT"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              خاصة
            </button>
            <button
              onClick={() => onFilterChange("GROUP")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                filterType === "GROUP"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              مجموعات
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">لا توجد محادثات بعد</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {conversations.map((conv) => (
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
