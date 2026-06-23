"use client";

import { useCallback, useState } from "react";
import { X, FileText, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, getApiBaseUrl } from "@/lib/utils";
import { FileDropzone } from "@/components/shared/FileDropzone";

interface UploadedFile {
  key: string;
  originalName: string;
  mimeType: string;
  size?: number;
  preview?: string;
}

interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  uploadedFiles?: UploadedFile[];
  onRemoveFile?: (fileKey: string) => void;
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "application/pdf",
];

const MAX_SIZE_MB = 10;
const MAX_FILES = 5;

export function FileUploadZone({
  onFilesUploaded,
  maxFiles = MAX_FILES,
  maxSizeMB = MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  uploadedFiles = [],
  onRemoveFile,
}: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFilesChange = useCallback(
    async (newFiles: File[]) => {
      if (!newFiles.length) return;

      setIsUploading(true);
      setPendingFiles(newFiles);

      try {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));

        const baseUrl = getApiBaseUrl();
        const response = await fetch(
          `${baseUrl}/portal/upload-intake-files`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("فشل رفع الملفات");
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const uploaded: UploadedFile[] = data.data.map((item: any) => ({
            key: item.key,
            originalName: item.originalName,
            mimeType: item.mimeType,
            size: item.size,
            preview: item.mimeType.startsWith("image/")
              ? item.url
              : undefined,
          }));

          onFilesUploaded(uploaded);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "فشل رفع الملفات";
        toast.error(message);
      } finally {
        setIsUploading(false);
        setPendingFiles([]);
      }
    },
    [onFilesUploaded]
  );

  const handleRemoveFile = useCallback(
    (fileKey: string) => {
      if (onRemoveFile) {
        onRemoveFile(fileKey);
      }
    },
    [onRemoveFile]
  );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="relative">
        <FileDropzone
          files={pendingFiles}
          onFilesChange={handleFilesChange}
          maxFiles={maxFiles - uploadedFiles.length}
          maxSizeMB={maxSizeMB}
          acceptedTypes={acceptedTypes}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl z-10">
            <div className="flex items-center gap-2 text-secondary-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">جاري الرفع...</span>
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {uploadedFiles.map((file) => (
            <div
              key={file.key}
              className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.originalName}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                  {file.mimeType.startsWith("image/") ? (
                    <Image className="w-6 h-6 text-neutral-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-natural-100 truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-neutral-500">
                  {file.size
                    ? `${(file.size / 1024).toFixed(0)} كيلوبايت`
                    : ""}
                </p>
              </div>

              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.key)}
                  className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-danger-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
