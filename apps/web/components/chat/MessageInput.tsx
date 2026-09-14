"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CHAT_MAX_FILES } from "@/features/chat/chatApi";
import { chatErrorMessage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import { Send, Paperclip, X, FileText, Smile } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void | Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const CHAT_ACCEPTED_FILE_TYPES = [
  { extension: ".pdf", mimeType: "application/pdf" },
  { extension: ".png", mimeType: "image/png" },
  { extension: ".jpg", mimeType: "image/jpeg" },
  { extension: ".jpeg", mimeType: "image/jpeg" },
  { extension: ".gif", mimeType: "image/gif" },
  { extension: ".webp", mimeType: "image/webp" },
  { extension: ".doc", mimeType: "application/msword" },
  {
    extension: ".docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  { extension: ".zip", mimeType: "application/zip" },
  { extension: ".txt", mimeType: "text/plain" },
  { extension: ".csv", mimeType: "text/csv" },
  { extension: ".mp4", mimeType: "video/mp4" },
  { extension: ".mov", mimeType: "video/quicktime" },
  { extension: ".webm", mimeType: "video/webm" },
] as const;

const CHAT_ACCEPT = CHAT_ACCEPTED_FILE_TYPES.flatMap(({ extension, mimeType }) => [
  mimeType,
  extension,
]).join(",");

function chatAttachmentErrorMessage(code: string): string {
  return chatErrorMessage({ data: { error: { code, details: {} } } });
}

function getFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function isAcceptedChatFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return CHAT_ACCEPTED_FILE_TYPES.some(
    (type) => type.extension === extension && type.mimeType === file.type,
  );
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  placeholder = "اكتب رسالتك...",
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});

  // Create previews once per selected image and release removed previews.
  useEffect(() => {
    const activeKeys = new Set(
      files.filter((file) => file.type.startsWith("image/")).map(getFileKey),
    );
    setPreviewUrls((current) => {
      const next = { ...current };
      for (const [key, url] of Object.entries(current)) {
        if (!activeKeys.has(key)) {
          URL.revokeObjectURL(url);
          delete next[key];
        }
      }
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const key = getFileKey(file);
          if (!next[key]) next[key] = URL.createObjectURL(file);
        }
      }
      previewUrlsRef.current = next;
      return next;
    });
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current)) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onStopTyping?.();
    };
  }, [onStopTyping]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || disabled) return;

    // Keep the draft and attachments until the request succeeds. This prevents
    // a failed upload from silently discarding the user's files.
    try {
      await onSend(trimmed || "📎", files.length > 0 ? files : undefined);
      setText("");
      setFiles([]);
      onStopTyping?.();
    } catch {
      // The owning page presents the localized transport error.
    }
  }, [text, files, disabled, onSend, onStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.();
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
    }, 2000);
  };

  const addFiles = (candidates: File[]) => {
    if (disabled) return;

    const accepted = candidates.filter(isAcceptedChatFile);
    if (accepted.length !== candidates.length) {
      toast.error(chatAttachmentErrorMessage("FILE_TYPE_NOT_ALLOWED"));
    }
    if (accepted.length > 0) {
      setFiles((prev) => {
        const combined = [...prev, ...accepted];
        return combined.slice(0, CHAT_MAX_FILES);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative border-t border-border bg-background p-4 transition-colors",
        isDragging && "bg-primary/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <p className="text-sm font-medium text-primary">
            أفلت الملفات هنا
          </p>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, i) => {
            const previewUrl = previewUrls[getFileKey(file)];
            return (
              <div
                key={`${file.name}-${i}`}
                className="group relative flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
              >
                {file.type.startsWith("image/") && previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="max-w-[100px] truncate text-foreground">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-background p-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[100px] truncate text-foreground">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(i)}
                  disabled={disabled}
                  className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`إزالة ${file.name}`}
                >
                  <X aria-hidden="true" data-icon="inline-start" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={CHAT_ACCEPT}
        />

        {/* Attach file button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
        >
          <Paperclip data-icon="inline-start" />
        </Button>

        {/* Emoji button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => toast.info("إضافة رموز تعبيرية قريباً")}
          disabled={disabled}
          title="إضافة رمز تعبيري"
          aria-label="إضافة رمز تعبيري"
        >
          <Smile data-icon="inline-start" />
        </Button>

        {/* Textarea */}
        <label htmlFor="chat-message-input" className="sr-only">
          نص الرسالة
        </label>
        <Textarea
          id="chat-message-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="نص الرسالة"
          placeholder={isDragging ? "أفلت الملفات هنا..." : placeholder}
          rows={3}
          className="max-h-30 min-h-10 flex-1 resize-none rounded-xl border-border bg-muted px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />

        {/* Send button */}
        <Button
          type="button"
          variant={text.trim() || files.length > 0 ? "default" : "secondary"}
          size="icon"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          title="إرسال"
          aria-label="إرسال"
        >
          <Send data-icon="inline-start" />
        </Button>
      </div>
    </div>
  );
}
