"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { formatFileSize, formatRelativeTime } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { useState } from "react";
import {
  FileIcon,
  Download,
  CheckCheck,
  X,
  Maximize2,
} from "lucide-react";
import type { Message, MessageAttachment } from "@/features/chat/chatApi";

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
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
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-h-48 max-w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Image preview modal */}
        {previewOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
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
          ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
          : "bg-badge-gray-bg border-portal-card-border text-natural-100 hover:bg-badge-gray-bg/80",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          isOwn ? "bg-white/20" : "bg-badge-gray-bg",
        )}
      >
        <FileIcon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-xs opacity-70">{formatFileSize(0)}</p>
      </div>
      <Download className="w-4 h-4 shrink-0 opacity-70" />
    </a>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const user = useAppSelector((s) => s.auth.user);
  const isOwn = message.senderId === user?.id;
  const hasAttachments =
    message.attachments && message.attachments.length > 0;

  return (
    <div
      className={cn(
        "flex gap-2.5 group",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar for other users' messages */}
      {!isOwn && (
        <div className="mt-1 shrink-0">
          <UserAvatar
            name={message.sender?.name ?? "?"}
            size="sm"
            className="!w-8 !h-8"
          />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[80%] md:max-w-[65%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name (for group messages) */}
        {!isOwn && message.sender?.name && (
          <span className="text-[11px] font-medium text-portal-note-text mb-1 mr-1">
            {message.sender.name}
          </span>
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              isOwn
                ? "bg-secondary-500 text-white rounded-br-md"
                : "bg-natural-0 border border-portal-card-border text-natural-100 rounded-bl-md",
            )}
          >
            {message.content}
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div
            className={cn(
              "flex flex-col gap-1.5 mt-1.5",
              isOwn ? "items-end" : "items-start",
            )}
          >
            {message.attachments!.map((att) => (
              <AttachmentCard
                key={att.id}
                attachment={att}
                isOwn={isOwn}
              />
            ))}
          </div>
        )}

        {/* Meta: time + read receipt */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1",
            isOwn ? "flex-row" : "flex-row-reverse",
          )}
        >
          <span className="text-[10px] text-portal-note-text">
            {formatRelativeTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="text-secondary-500">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
