"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, EyeOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/shared/FileDropzone";

// Generic message type that works for both portal and admin
interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  isInternal?: boolean;
  createdAt: string;
}

interface DisputeMessageThreadProps {
  messages: Message[];
  onSendMessage: (content: string, files?: File[]) => void;
  isLoading?: boolean;
  canSendMessage?: boolean;
  showInternalBadge?: boolean;
}

export function DisputeMessageThread({
  messages,
  onSendMessage,
  isLoading = false,
  canSendMessage = true,
  showInternalBadge = false,
}: DisputeMessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [showAttach, setShowAttach] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if ((!newMessage.trim() && !attachFiles.length) || isLoading) return;
    onSendMessage(
      newMessage.trim(),
      attachFiles.length > 0 ? attachFiles : undefined,
    );
    setNewMessage("");
    setAttachFiles([]);
    setShowAttach(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex max-h-[400px] min-h-[200px] flex-col gap-4 overflow-y-auto rounded-2xl border-[1.5px] border-portal-divider bg-portal-bg p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-portal-note-text">
            <User className="h-8 w-8 opacity-50" />
            <p className="text-sm">لا توجد رسائل بعد</p>
            <p className="text-xs">سيتم عرض الرسائل هنا بمجرد بدء المحادثة</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showInternalBadge={showInternalBadge}
            />
          ))
        )}
      </div>

      {/* Input Area */}
      {canSendMessage && (
        <div className="flex flex-col gap-2">
          {showAttach && (
            <div className="rounded-2xl border-[1.5px] border-portal-divider bg-natural-0 p-3">
              <FileDropzone
                files={attachFiles}
                onFilesChange={setAttachFiles}
                maxFiles={5}
                maxSizeMB={10}
              />
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border-[1.5px] border-portal-divider bg-natural-0 p-3">
            <button
              type="button"
              onClick={() => setShowAttach(!showAttach)}
              className={cn(
                "h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-colors",
                showAttach
                  ? "bg-secondary-100 text-secondary-600"
                  : "text-portal-icon hover:bg-badge-gray-bg",
              )}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 resize-none border-0 bg-transparent text-sm text-natural-100 placeholder:text-portal-placeholder focus:outline-none focus:ring-0 min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={
                (!newMessage.trim() && !attachFiles.length) || isLoading
              }
              className="h-9 w-9 shrink-0 rounded-full bg-secondary-500 p-0 hover:bg-secondary-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  showInternalBadge?: boolean;
}

function MessageBubble({
  message,
  showInternalBadge = false,
}: MessageBubbleProps) {
  // For now, we assume the current user is the client
  // In a real implementation, you'd check against the current user ID
  const isClient = message.author.name !== "مدير المشروع"; // Simple heuristic for demo
  const isAdminInternal = message.isInternal && showInternalBadge;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isClient ? "flex-row" : "flex-row-reverse",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
          {message.author.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-2.5",
          isAdminInternal
            ? "rounded-tl-none bg-gray-100 border border-gray-300 text-gray-800"
            : isClient
              ? "rounded-tr-none bg-secondary-500 text-white"
              : "rounded-tl-none bg-natural-100/10 border border-portal-divider text-natural-100",
        )}
      >
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span className="font-medium">{message.author.name}</span>
          {isAdminInternal && (
            <>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                <EyeOff className="h-3 w-3" />
                داخلي
              </span>
            </>
          )}
          <span>•</span>
          <span>
            {new Date(message.createdAt).toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}
