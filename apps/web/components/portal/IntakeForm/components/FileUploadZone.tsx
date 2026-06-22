"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, File, X, Image, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn, getApiBaseUrl } from "@/lib/utils";

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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `نوع الملف غير مدعوم. الأنواع المدعومة: ${acceptedTypes
          .map((t) => t.split("/")[1])
          .join(", ")}`;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        return `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB}ميجابايت`;
      }

      if (uploadedFiles.length >= maxFiles) {
        return `الحد الأقصى للملفات هو ${maxFiles}`;
      }

      return null;
    },
    [acceptedTypes, maxSizeMB, maxFiles, uploadedFiles.length]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err));
        return;
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        const formData = new FormData();
        validFiles.forEach((file) => formData.append("files", file));

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/portal/upload-intake-files`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("فشل رفع الملفات");
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const uploadedFiles: UploadedFile[] = data.data.map((item: any) => ({
            key: item.key,
            originalName: item.originalName,
            mimeType: item.mimeType,
            size: item.size,
            preview: item.mimeType.startsWith("image/") ? item.url : undefined,
          }));

          onFilesUploaded(uploadedFiles);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "فشل رفع الملفات";
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, onFilesUploaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer",
          "hover:border-secondary-400 hover:bg-secondary-50/30",
          isDragging
            ? "border-secondary-500 bg-secondary-50/50"
            : "border-neutral-300 bg-neutral-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {isUploading ? (
            <div className="w-12 h-12 rounded-full border-4 border-secondary-200 border-t-secondary-500 animate-spin" />
          ) : (
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                isDragging
                  ? "bg-secondary-100 text-secondary-600"
                  : "bg-neutral-200 text-neutral-500"
              )}
            >
              <Upload className="w-8 h-8" />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-natural-100">
              {isUploading
                ? "جاري الرفع..."
                : isDragging
                ? "أفلت الملفات هنا"
                : "اسحب وأفلت الملفات هنا"}
            </p>
            <p className="text-xs text-neutral-500">
              أو انقر لاختيار الملفات (PNG, JPG, SVG, PDF - الحد الأقصى{" "}
              {maxSizeMB}ميجابايت)
            </p>
          </div>

          <p className="text-xs text-neutral-400">
            الحد الأقصى: {maxFiles} ملفات
          </p>
        </div>
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
                  {file.size ? `${(file.size / 1024).toFixed(0)} كيلوبايت` : ""}
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
