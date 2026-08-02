"use client";

import { Download, FileText, Paperclip } from "lucide-react";
import type { PortalPeriodFile } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTz, formatFileSize } from "@/lib/format";
import { EmptyState } from "./EmptyState";

export function FilesTab({
  files,
  onDownload,
}: {
  files: PortalPeriodFile[];
  onDownload: (file: PortalPeriodFile) => void;
}) {
  if (!files?.length)
    return (
      <EmptyState
        icon={Paperclip}
        title="لا توجد ملفات"
        description="لم يتم رفع أي ملفات لهذه الفترة بعد."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip />
          ملفات الفترة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {files.map((file, index) => (
          <div key={file.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {file.fileType} · {formatFileSize(file.fileSize)} ·{" "}
                    {formatDateTz(file.uploadedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download />
                تحميل
              </Button>
            </div>
            {index < files.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
