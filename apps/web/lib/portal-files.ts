import { getApiBaseUrl } from "@/lib/utils";

export type PortalFileKind =
  | "image"
  | "video"
  | "pdf"
  | "document"
  | "archive"
  | "other";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "avi"]);
const DOCUMENT_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z"]);

export function buildPortalFileUrl(filePath: string) {
  if (!filePath) {
    return "";
  }

  if (filePath.startsWith("http")) {
    return filePath;
  }

  const apiBase = getApiBaseUrl().replace(/\/v1$/, "");

  if (!apiBase) {
    return filePath;
  }

  return filePath.startsWith("/") ? `${apiBase}${filePath}` : `${apiBase}/${filePath}`;
}

export function getPortalFileExtension(filePath: string) {
  const normalized = filePath.split("?")[0].split("#")[0];
  const segments = normalized.split(".");

  if (segments.length < 2) {
    return "";
  }

  return segments.at(-1)?.toLowerCase() ?? "";
}

export function getPortalFileKind(filePath: string): PortalFileKind {
  const extension = getPortalFileExtension(filePath);

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return "document";
  }

  if (ARCHIVE_EXTENSIONS.has(extension)) {
    return "archive";
  }

  return "other";
}

export function getPortalFileName(filePath: string) {
  const normalized = filePath.split("?")[0].split("#")[0];
  const fileName = normalized.split("/").at(-1) ?? filePath;

  return decodeURIComponent(fileName);
}

export function getPortalFileKindLabel(filePath: string) {
  const kind = getPortalFileKind(filePath);

  switch (kind) {
    case "image":
      return "صورة";
    case "video":
      return "فيديو";
    case "pdf":
      return "PDF";
    case "document":
      return "مستند";
    case "archive":
      return "أرشيف";
    default:
      return "ملف";
  }
}