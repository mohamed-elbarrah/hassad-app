"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { formatRelativeTime } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { FileIcon, Download } from "lucide-react";
import type { Message, MessageAttachment } from "@/features/chat/chatApi";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function AttachmentCard({ attachment }: { attachment: MessageAttachment }) {
  if (isImageType(attachment.fileType) && attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-h-48 max-w-full rounded-lg object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm transition-colors hover:bg-background/80"
    >
      <FileIcon className="h-4 w-4 shrink-0 text-neutral-300" />
      <span className="max-w-[180px] truncate">{attachment.fileName}</span>
      <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-neutral-300" />
    </a>
  );
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const user = useAppSelector((s) => s.auth.user);
  const isOwn = message.senderId === user?.id;

  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div
      className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      {!isOwn && <UserAvatar name={message.sender?.name ?? "??"} size="sm" />}

      <div
        className={cn(
          "max-w-[75%] space-y-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-neutral-50 text-foreground",
            )}
          >
            {message.content}
          </div>
        )}

        {hasAttachments && (
          <div
            className={cn(
              "flex flex-col gap-1.5",
              isOwn ? "items-end" : "items-start",
            )}
          >
            {message.attachments!.map((att) => (
              <AttachmentCard key={att.id} attachment={att} />
            ))}
          </div>
        )}

        <p
          className={cn(
            "text-[10px] text-neutral-300",
            isOwn ? "text-left" : "text-right",
          )}
        >
          {isOwn ? "أنت" : message.sender?.name} ·{" "}
          {formatRelativeTime(message.createdAt)}
          {hasAttachments && (
            <span className="mr-1">
              · {message.attachments!.length} مرفق
              {message.attachments!.length > 1 ? "ات" : ""}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
