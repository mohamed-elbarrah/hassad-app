"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminErrorMessage } from "@/lib/i18n";
import { AiAssistantArea } from "@hassad/shared";
import {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
} from "@/features/aiAssistantApi";
import type { AiMessage } from "@/features/aiAssistantApi";
import { useAiAssistantStream } from "@/hooks/useAiAssistantStream";
import type { StreamEvent } from "@/hooks/useAiAssistantStream";
import { ConversationList } from "./ConversationList";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { AreaSelector } from "./AreaSelector";

interface AiAssistantPanelProps {
  onClose: () => void;
}

export function AiAssistantPanel({ onClose }: AiAssistantPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newAreas, setNewAreas] = useState<AiAssistantArea[]>([AiAssistantArea.ALL]);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamErrorCode, setStreamErrorCode] = useState<string | null>(null);

  const { data: conversations, isLoading: listLoading } =
    useGetConversationsQuery();
  const {
    data: conversation,
    refetch: refetchMessages,
  } = useGetConversationQuery(activeId ?? "", { skip: !activeId });

  const [createConversation] = useCreateConversationMutation();
  const [deleteConversation] = useDeleteConversationMutation();

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    if (event.type === "token") {
      setStreamErrorCode(null);
      setStreamingContent((prev) => prev + event.content);
    } else if (event.type === "done") {
      setStreamingContent("");
      refetchMessages();
    } else if (event.type === "error") {
      setStreamingContent("");
      setStreamErrorCode(event.code);
    }
  }, [refetchMessages]);

  const { send, isStreaming } = useAiAssistantStream(handleStreamEvent);

  const handleCreateNew = async () => {
    try {
      const conv = await createConversation({
        areas: newAreas,
        title: `محادثة ${new Date().toLocaleDateString("ar-SA")}`,
      }).unwrap();
      setActiveId(conv.id);
      setShowNewChat(false);
    } catch {
      // ignore
    }
  };

  const handleSend = async (content: string) => {
    if (!activeId) return;
    setStreamErrorCode(null);
    setStreamingContent("");
    await send(activeId, content);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-neutral-200">
        <h2 className="font-semibold text-neutral-800 text-sm">المساعد الذكي</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="إغلاق المساعد الذكي"
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-40 shrink-0 border-l bg-muted/30 sm:w-56">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => setShowNewChat(true)}
            onDelete={handleDelete}
            isLoading={listLoading}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {showNewChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <h3 className="font-medium text-neutral-700">محادثة جديدة</h3>
              <p className="text-sm text-neutral-500">اختر المجالات التي تريد مناقشتها:</p>
              <AreaSelector selected={newAreas} onChange={setNewAreas} />
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setShowNewChat(false)}>
                  إلغاء
                </Button>
                <Button type="button" onClick={handleCreateNew}>
                  بدء المحادثة
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeId && conversation && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-neutral-50/50">
                  <span className="text-xs text-neutral-500">
                    {(conversation.areas as string[]).join(" • ")}
                  </span>
                </div>
              )}
              {streamErrorCode && (
                <div role="alert" className="mx-4 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {adminErrorMessage({ data: { error: { code: streamErrorCode } } })}
                </div>
              )}
              <ChatMessages
                messages={(conversation?.messages as AiMessage[]) ?? []}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />
              <ChatInput onSend={handleSend} disabled={!activeId || isStreaming} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
