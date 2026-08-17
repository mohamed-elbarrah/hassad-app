"use client";
import type { ReactNode } from "react";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileAttachmentRowProps {
  filename: string;
  size?: string;
  type?: string;
  action?: ReactNode;
  onDownload?: () => void;
  className?: string;
}

export function FileAttachmentRow({
  filename,
  size,
  type,
  action,
  onDownload,
  className,
}: FileAttachmentRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-neutral-200 bg-natural-0 p-3",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500/10">
        <FileText className="h-5 w-5 text-action-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-natural-100 truncate">
          {filename}
        </p>
        <p className="text-xs text-neutral-300">
          {[type, size].filter(Boolean).join(" · ")}
        </p>
      </div>
      {onDownload && (
        <button
          onClick={onDownload}
          className="text-neutral-300 hover:text-secondary-500 transition-colors"
        >
          <Download className="h-4 w-4" />
        </button>
      )}
      {action}
    </div>
  );
}
