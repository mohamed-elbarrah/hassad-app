"use client";

import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
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
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          محادثة جديدة
        </button>
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
              className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                conv.id === activeId
                  ? "bg-secondary-50 text-secondary-700"
                  : "hover:bg-neutral-100 text-neutral-700"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">
                {conv.title || "محادثة جديدة"}
              </span>
              <span className="text-xs text-neutral-400">
                {conv._count?.messages ?? 0}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
