"use client";

import { useCallback, useId, useRef, useState, useEffect } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";

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
  const uploadId = useId();
  const urlMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `نوع الملف غير مدعوم. الأنواع المدعومة: ${acceptedTypes
          .map((type) => type.split("/")[1])
          .join(", ")}`;
      }
      if (file.size / (1024 * 1024) > maxSizeMB) {
        return `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت`;
      }
      return null;
    },
    [acceptedTypes, maxSizeMB],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) toast.error(error);
        else validFiles.push(file);
      }
      if (!validFiles.length) return;

      const combined = [...files, ...validFiles].slice(0, maxFiles);
      if (combined.length !== files.length + validFiles.length) {
        toast.error(`الحد الأقصى للملفات هو ${maxFiles}`);
      }
      onFilesChange(combined);
    },
    [files, maxFiles, onFilesChange, validateFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(event.dataTransfer.files));
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(event.target.files ?? []));
      event.target.value = "";
    },
    [addFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      const file = files[index];
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      const url = urlMapRef.current.get(key);
      if (url) {
        URL.revokeObjectURL(url);
        urlMapRef.current.delete(key);
      }
      onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    },
    [files, onFilesChange],
  );

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <label
        htmlFor={uploadId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          "hover:border-primary hover:bg-muted/50",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/20",
          files.length >= maxFiles && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          id={uploadId}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="sr-only"
          disabled={files.length >= maxFiles}
        />
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Upload className="size-7" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">
          {isDragging ? "أفلت الملفات هنا" : "اسحب وأفلت الملفات هنا"}
        </span>
        <span className="text-xs text-muted-foreground">
          أو انقر لاختيار الملفات — الحد الأقصى {maxFiles} ملفات، {maxSizeMB}
          ميجابايت لكل ملف
        </span>
      </label>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((file, index) => {
            const key = `${file.name}-${file.size}-${file.lastModified}`;
            const isImage = file.type.startsWith("image/");
            if (isImage && !urlMapRef.current.has(key)) {
              urlMapRef.current.set(key, URL.createObjectURL(file));
            }

            return (
              <div
                key={`${key}-${index}`}
                className="flex min-w-0 items-center gap-3 rounded-md border bg-muted/20 p-2.5"
              >
                {isImage ? (
                  <img
                    src={urlMapRef.current.get(key)}
                    alt={file.name}
                    className="size-10 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  aria-label={`حذف ${file.name}`}
                >
                  <Trash2 data-icon="inline-start" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
