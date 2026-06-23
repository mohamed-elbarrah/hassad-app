"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function FileDropzone({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
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
        return `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت`;
      }
      return null;
    },
    [acceptedTypes, maxSizeMB]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
        } else {
          validFiles.push(file);
        }
      }
      if (!validFiles.length) return;

      const combined = [...files, ...validFiles].slice(0, maxFiles);
      if (combined.length !== files.length + validFiles.length) {
        toast.error(`الحد الأقصى للملفات هو ${maxFiles}`);
      }
      onFilesChange(combined);
    },
    [files, maxFiles, onFilesChange, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      addFiles(selected);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <div className="space-y-3" dir="rtl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer",
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
          disabled={files.length >= maxFiles}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              isDragging
                ? "bg-secondary-100 text-secondary-600"
                : "bg-neutral-200 text-neutral-500"
            )}
          >
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-medium text-natural-100">
            {isDragging ? "أفلت الملفات هنا" : "اسحب وأفلت الملفات هنا"}
          </p>
          <p className="text-xs text-neutral-500">
            أو انقر لاختيار الملفات — الحد الأقصى {maxFiles} ملفات، {maxSizeMB}
            ميجابايت لكل ملف
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 p-2.5 bg-white border border-neutral-200 rounded-xl"
            >
              {isImage(file) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-neutral-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-natural-100 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-danger-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
