"use client";

import { useState } from "react";
import { Download, Trash2, File, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskFile } from "@hassad/shared";
import { downloadTaskFile } from "@/lib/downloadFile";
import { toast } from "sonner";

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))
    return <FileImage className="size-4 text-blue-500" />;
  if (mimeType.startsWith("text/") || mimeType.includes("pdf"))
    return <FileText className="size-4 text-orange-500" />;
  return <File className="size-4 text-muted-foreground" />;
}

interface FileItemProps {
  file: TaskFile;
  taskId: string;
  canDelete: boolean;
  onDelete: (fileId: string) => void;
  isDeleting?: boolean;
}

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

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon mimeType={file.mimeType} />
        <div className="min-w-0">
          <p className="font-medium truncate">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.fileSize)}
            {file.purpose ? ` · ${file.purpose}` : ""} ·{" "}
            {new Date(file.createdAt).toLocaleDateString("ar-SA-u-nu-latn")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleDownload}
          disabled={isDownloading}
          title="تحميل"
        >
          <Download className="size-3.5" />
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            title="حذف"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
