import { FileArchive, FileText, PlayCircle } from "lucide-react";

import {
  buildPortalFileUrl,
  getPortalFileExtension,
  getPortalFileKind,
  getPortalFileKindLabel,
  getPortalFileName,
} from "@/lib/portal-files";
import { cn } from "@/lib/utils";

interface PortalFilePreviewProps {
  filePath: string;
  title: string;
  className?: string;
}

export function PortalFilePreview({
  filePath,
  title,
  className,
}: PortalFilePreviewProps) {
  const fileUrl = buildPortalFileUrl(filePath);
  const fileKind = getPortalFileKind(filePath);
  const extension = getPortalFileExtension(filePath).toUpperCase() || getPortalFileKindLabel(filePath);
  const fileName = getPortalFileName(filePath);

  if (fileKind === "image") {
    return (
      <div className={cn("group relative h-40 overflow-hidden rounded-[24px] bg-portal-bg", className)}>
        <img
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          src={fileUrl}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-3 pb-3 pt-8 text-white">
          <p className="truncate text-sm font-medium">{fileName}</p>
        </div>
      </div>
    );
  }

  if (fileKind === "video") {
    return (
      <div className={cn("group relative h-40 overflow-hidden rounded-[24px] bg-[#10172f]", className)}>
        <video className="h-full w-full object-cover opacity-75" muted playsInline preload="metadata" src={fileUrl} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-secondary-500 shadow-sm">
            <PlayCircle className="h-6 w-6" />
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-white">
          <p className="truncate text-sm font-medium">{fileName}</p>
        </div>
      </div>
    );
  }

  const Icon =
    fileKind === "pdf"
      ? FileText
      : fileKind === "document"
        ? FileText
        : fileKind === "archive"
          ? FileArchive
          : FileText;

  return (
    <div
      className={cn(
        "flex h-40 flex-col justify-between rounded-[24px] border-[1.5px] border-portal-card-border bg-portal-bg p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-natural-0 px-3 py-1 text-xs font-semibold text-portal-icon">
          {extension}
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-natural-0 text-portal-icon">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="space-y-1 text-right">
        <p className="line-clamp-2 text-sm font-medium leading-6 text-natural-100">
          {title}
        </p>
        <p className="truncate text-xs leading-5 text-portal-note-text">{fileName}</p>
      </div>
    </div>
  );
}