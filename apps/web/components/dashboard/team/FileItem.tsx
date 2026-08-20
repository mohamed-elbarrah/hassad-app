"use client";

import { useState } from "react";
import { Download, Trash2, File, FileImage, FileText } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { downloadTaskFile } from "@/lib/downloadFile";
import { formatFileSize, formatShortDate } from "@/lib/format";
import { toast } from "sonner";
import type { TaskFile } from "@hassad/shared";
import { FilePurpose } from "@hassad/shared";

// ── Helpers ─────────────────────────────────────────────────────────────────

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-5 text-action-blue" />;
  if (mimeType.startsWith("text/") || mimeType.includes("pdf"))
    return <FileText className="size-5 text-alert-500" />;
  return <File className="size-5 text-neutral-400" />;
}

const FILE_PURPOSE_LABELS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "تسليم نهائي",
  [FilePurpose.REFERENCE]: "مرجع",
  [FilePurpose.INTERNAL_DRAFT]: "مسودة داخلية",
};

const FILE_PURPOSE_COLORS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  [FilePurpose.REFERENCE]: "bg-blue-50 text-blue-700 border-blue-200",
  [FilePurpose.INTERNAL_DRAFT]: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface FileItemProps {
  file: TaskFile;
  taskId: string;
  canDelete: boolean;
  onDelete: (fileId: string) => void;
  isDeleting?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FileItem({
  file,
  taskId,
  canDelete,
  onDelete,
  isDeleting = false,
}: FileItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadTaskFile(taskId, file.id, file.fileName);
    } catch {
      toast.error("فشل تحميل الملف");
    } finally {
      setIsDownloading(false);
    }
  }

  const purpose = file.purpose as FilePurpose | undefined;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-portal-card-border hover:shadow-sm transition-all">
      <FileIcon mimeType={file.mimeType} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-natural-100">
          {file.fileName}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-neutral-400">
            {formatFileSize(file.fileSize)}
          </span>
          <span className="text-xs text-neutral-300">•</span>
          <span className="text-xs text-neutral-400">
            {formatShortDate(file.createdAt)}
          </span>
          {purpose && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${FILE_PURPOSE_COLORS[purpose]}`}
            >
              {FILE_PURPOSE_LABELS[purpose]}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ActionButton
          variant="ghost"
          size="sm"
          className="size-8"
          onClick={handleDownload}
          disabled={isDownloading}
          title="تحميل"
          icon={<Download className="size-4" />}
        >
          {","}
        </ActionButton>

        {canDelete && (
          <ActionButton
            variant="ghost"
            size="sm"
            className="size-8 text-danger-500 hover:text-danger-600"
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            title="حذف"
            icon={<Trash2 className="size-4" />}
          >
            {","}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
