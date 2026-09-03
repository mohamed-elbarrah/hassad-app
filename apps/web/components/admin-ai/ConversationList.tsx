"use client";

import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiConversation } from "@/features/aiAssistantApi";

interface ConversationListProps {
  conversations: AiConversation[] | undefined;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isLoading,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-200">
        <Button type="button" onClick={onNew} className="w-full">
          <Plus />
          محادثة جديدة
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-8">
            لا توجد محادثات سابقة
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${
                conv.id === activeId
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-right"
                onClick={() => onSelect(conv.id)}
                aria-current={conv.id === activeId ? "true" : undefined}
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate text-sm">{conv.title || "محادثة جديدة"}</span>
                <span className="text-xs text-muted-foreground">{conv._count?.messages ?? 0}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(conv.id)}
                className="size-8 text-muted-foreground opacity-70 hover:text-destructive"
                aria-label={`حذف ${conv.title || "المحادثة"}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
