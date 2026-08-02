"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { Send, Paperclip, X, FileText, Smile } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

function getFilePreview(file: File): {
  type: "image" | "document";
  url?: string;
} {
  if (file.type.startsWith("image/")) {
    return { type: "image", url: URL.createObjectURL(file) };
  }
  return { type: "document" };
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

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if ((f as any)._previewUrl) {
          URL.revokeObjectURL((f as any)._previewUrl);
        }
      });
    };
  }, [files]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || disabled) return;
    onSend(trimmed || "📎", files.length > 0 ? files : undefined);
    setText("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onStopTyping?.();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles((prev) => {
        const combined = [...prev, ...selected];
        return combined.slice(0, 10);
      });
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if ((file as any)._previewUrl) {
        URL.revokeObjectURL((file as any)._previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
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
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (dropped.length > 0) {
      setFiles((prev) => {
        const combined = [...prev, ...dropped];
        return combined.slice(0, 10);
      });
    }
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
            const preview = getFilePreview(file);
            return (
              <div
                key={`${file.name}-${i}`}
                className="group relative flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
              >
                {preview.type === "image" && preview.url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.url}
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
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-danger-100 hover:text-danger-600"
                >
                  <X className="h-3.5 w-3.5" />
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
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        />

        {/* Attach file button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          title="إرفاق ملف"
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
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
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
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
