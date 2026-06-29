"use client";

import { Paperclip } from "lucide-react";
import type { PortalPeriodFile } from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FileAttachmentRow } from "@/components/design-system/FileAttachmentRow";
import { EmptyState } from "./EmptyState";
import { formatDateTz, formatFileSize } from "@/lib/format";

interface FilesTabProps {
  files: PortalPeriodFile[];
  onDownload: (file: PortalPeriodFile) => void;
}

/** Files tab — list of period attachments with download buttons. */
export function FilesTab({ files, onDownload }: FilesTabProps) {
  if (!files || files.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="لا توجد ملفات"
        description="لم يتم رفع أي ملفات لهذه الفترة بعد."
      />
    );
  }

  return (
    <SurfaceCard title="ملفات الفترة" icon={Paperclip}>
      <div className="space-y-3" dir="rtl">
        {files.map((file) => (
          <FileAttachmentRow
            key={file.id}
            filename={file.fileName}
            type={file.fileType}
            size={formatFileSize(file.fileSize)}
            onDownload={() => onDownload(file)}
            action={
              <span className="hidden text-xs text-portal-note-text sm:block">
                {formatDateTz(file.uploadedAt)}
              </span>
            }
          />
        ))}
      </div>
    </SurfaceCard>
  );
}
