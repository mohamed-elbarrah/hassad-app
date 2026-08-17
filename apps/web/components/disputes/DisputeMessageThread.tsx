"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, EyeOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Textarea } from "@/components/ui/textarea";
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
  currentAudience?: "admin" | "pm" | "client";
}

export function DisputeMessageThread({
  messages,
  onSendMessage,
  isLoading = false,
  canSendMessage = true,
  showInternalBadge = false,
  currentAudience = "client",
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
      <Card>
        <CardContent
          ref={scrollRef}
          className="flex max-h-[420px] min-h-[220px] flex-col gap-4 overflow-y-auto p-4"
        >
        {messages.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <User />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد رسائل بعد</EmptyTitle>
              <EmptyDescription>سيتم عرض المحادثة هنا فور بدء التواصل.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showInternalBadge={showInternalBadge}
              currentAudience={currentAudience}
            />
          ))
        )}
        </CardContent>
      </Card>

      {canSendMessage && (
        <div className="flex flex-col gap-2">
          {showAttach && (
            <Card>
              <CardContent className="p-3">
              <FileDropzone
                files={attachFiles}
                onFilesChange={setAttachFiles}
                maxFiles={5}
                maxSizeMB={10}
              />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="flex items-end gap-2 p-3">
              <Button
                type="button"
                variant={showAttach ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowAttach(!showAttach)}
              >
                <Paperclip />
              </Button>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="min-h-[44px] max-h-[120px] flex-1 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={
                (!newMessage.trim() && !attachFiles.length) || isLoading
              }
              size="icon"
            >
              <Send />
            </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  showInternalBadge?: boolean;
  currentAudience?: "admin" | "pm" | "client";
}

function MessageBubble({
  message,
  showInternalBadge = false,
  currentAudience = "client",
}: MessageBubbleProps) {
  const isCurrentUserMessage =
    currentAudience === "client"
      ? !message.isInternal && message.author.name !== "مدير المشروع"
      : currentAudience === "pm"
        ? message.author.name === "مدير المشروع"
        : !!message.isInternal;
  const isAdminInternal = message.isInternal && showInternalBadge;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isCurrentUserMessage ? "flex-row" : "flex-row-reverse",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-primary/10 text-xs text-primary">
          {message.author.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-2.5",
          isAdminInternal
            ? "rounded-tl-none border bg-muted text-foreground"
            : isCurrentUserMessage
              ? "rounded-tr-none bg-primary text-primary-foreground"
              : "rounded-tl-none border bg-background text-foreground",
        )}
      >
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span className="font-medium">{message.author.name}</span>
          {isAdminInternal && (
            <>
              <span className="inline-flex items-center gap-1 rounded bg-background/70 px-1.5 py-0.5">
                <EyeOff className="size-3" />
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
