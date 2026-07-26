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
        "border-t border-portal-divider bg-natural-0 p-4 transition-colors",
        isDragging && "bg-secondary-500/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-secondary-500 bg-secondary-500/5 flex items-center justify-center z-20">
          <p className="text-sm font-medium text-secondary-500">
            أفلت الملفات هنا
          </p>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, i) => {
            const preview = getFilePreview(file);
            return (
              <div
                key={`${file.name}-${i}`}
                className="group relative flex items-center gap-2 rounded-xl border border-portal-card-border bg-badge-gray-bg px-3 py-2 text-xs"
              >
                {preview.type === "image" && preview.url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.url}
                      alt={file.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate max-w-[100px] text-natural-100">
                        {file.name}
                      </p>
                      <p className="text-portal-note-text">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 rounded-lg bg-natural-0">
                      <FileText className="w-4 h-4 text-portal-note-text" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate max-w-[100px] text-natural-100">
                        {file.name}
                      </p>
                      <p className="text-portal-note-text">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 p-0.5 rounded-full text-portal-note-text hover:text-danger-500 hover:bg-danger-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
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
          className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all disabled:opacity-50"
          title="إرفاق ملف"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Emoji button */}
        <button
          type="button"
          onClick={() => toast.info("إضافة رموز تعبيرية قريباً")}
          disabled={disabled}
          className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-all disabled:opacity-50"
          title="إضافة رمز تعبيري"
        >
          <Smile className="w-4 h-4" />
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
            "flex-1 resize-none rounded-xl border border-portal-card-border bg-badge-gray-bg px-4 py-2.5 text-sm text-natural-100",
            "focus:outline-none focus:ring-2 focus:ring-secondary-500/30 focus:border-secondary-500",
            "max-h-[120px]",
            "placeholder:text-portal-note-text",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all",
          )}
          dir="rtl"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className={cn(
            "flex items-center justify-center h-10 w-10 shrink-0 rounded-xl transition-all",
            text.trim() || files.length > 0
              ? "bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm"
              : "bg-badge-gray-bg text-portal-note-text",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          title="إرسال"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
