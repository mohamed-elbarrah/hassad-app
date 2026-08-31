"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { useState } from "react";
import { FileIcon, Download, CheckCheck, X, Maximize2 } from "lucide-react";
import type { Message, MessageAttachment } from "@/features/chat/chatApi";
import { CHAT_DELETED_MESSAGE_LABEL } from "@/lib/i18n";

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

function AttachmentCard({
  attachment,
  isOwn,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (isImageType(attachment.fileType) && attachment.url) {
    return (
      <>
        <button
          onClick={() => setPreviewOpen(true)}
          className="group relative overflow-hidden rounded-xl"
          aria-label={`معاينة ${attachment.fileName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-h-48 max-w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-colors group-hover:bg-black/10">
            <Maximize2 className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </button>

        {/* Image preview modal */}
        {previewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute left-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              aria-label="إغلاق المعاينة"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <a
      href={attachment.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all hover:shadow-sm",
        isOwn
          ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
          : "border-border bg-muted text-foreground hover:bg-muted/80",
      )}
    >
      <div
        className={cn(
          "rounded-lg p-2",
          isOwn ? "bg-white/20" : "bg-muted",
        )}
      >
        <FileIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-xs opacity-70">{attachment.fileType}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const user = useAppSelector((s) => s.auth.user);
  const isOwn = message.sender.id === user?.id;
  const isDeleted = Boolean(message.deletedAt);
  const hasAttachments = !isDeleted && message.attachments && message.attachments.length > 0;

  return (
    <div
      className={cn(
        "group flex gap-2.5",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar for other users' messages */}
      {!isOwn && (
        <div className="mt-1 shrink-0">
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarFallback className="bg-muted text-xs text-foreground">
              {getInitials(message.sender.name ?? "?")}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[80%] flex-col md:max-w-[65%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name (for group messages) */}
        {!isOwn && message.sender.name && (
          <span className="mb-1 mr-1 text-[11px] font-medium text-muted-foreground">
            {message.sender.name}
          </span>
        )}

        {/* Message content */}
        {(isDeleted || message.displayContent || message.content) && (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              isDeleted
                ? "border border-border bg-muted text-muted-foreground italic"
                : isOwn
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "rounded-bl-md border border-border bg-background text-foreground",
            )}
          >
            {isDeleted
              ? CHAT_DELETED_MESSAGE_LABEL
              : message.displayContent || message.content}
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div
            className={cn(
              "mt-1.5 flex flex-col gap-1.5",
              isOwn ? "items-end" : "items-start",
            )}
          >
            {message.attachments!.map((att) => (
              <AttachmentCard key={att.id} attachment={att} isOwn={isOwn} />
            ))}
          </div>
        )}

        {/* Meta: time + read receipt */}
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5",
            isOwn ? "flex-row" : "flex-row-reverse",
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="text-primary">
              <CheckCheck className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
