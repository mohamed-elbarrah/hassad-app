"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CHAT_MAX_FILES } from "@/features/chat/chatApi";
import { portalErrorMessage } from "@/lib/i18n";

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

const CHAT_ATTACHMENT_ERROR_MESSAGES: Record<string, string> = {
  FILE_TYPE_NOT_ALLOWED: "نوع الملف غير مسموح.",
  INVALID_FILE_TYPE: "نوع الملف غير مدعوم.",
  INVALID_FILE_CONTENT: "محتوى الملف غير صالح.",
  CHAT_SVG_NOT_ALLOWED: "ملفات SVG غير مسموحة.",
};

function chatAttachmentErrorMessage(code: string): string {
  return (
    CHAT_ATTACHMENT_ERROR_MESSAGES[code] ||
    portalErrorMessage({ data: { error: { code, details: {} } } })
  );
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
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
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={disabled}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-danger-100 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`إزالة ${file.name}`}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Emoji button */}
        <button
          type="button"
          onClick={() => toast.info("إضافة رموز تعبيرية قريباً")}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          title="إضافة رمز تعبيري"
          aria-label="إضافة رمز تعبيري"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <label htmlFor="chat-message-input" className="sr-only">
          نص الرسالة
        </label>
        <textarea
          id="chat-message-input"
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="نص الرسالة"
          placeholder={isDragging ? "أفلت الملفات هنا..." : placeholder}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground transition-all",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            "max-h-[120px]",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          dir="rtl"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
            text.trim() || files.length > 0
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
              : "bg-muted text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          title="إرسال"
          aria-label="إرسال"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
