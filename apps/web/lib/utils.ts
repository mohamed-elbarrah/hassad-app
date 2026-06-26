import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 * The only Tailwind-aware utility — kept here because it's small and used
 * everywhere. Larger formatters live in `./format` and the portal project
 * detail helpers live in `@/components/portal/project-detail/helpers`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

/**
 * Return `url` only if it's a safe http(s) URL. Otherwise return `null`.
 * Used by anchor renderers (`<a href>`) to neutralize any value that may have
 * pre-dated server-side validation (e.g. legacy rows, imports).
 *
 * Does NOT try to be a full URL parser — only blocks the dangerous protocols
 * we know attackers use: `javascript:`, `data:`, `vbscript:`, `file:`.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Reject any protocol that isn't http/https — includes javascript:, data:,
  // vbscript:, file:, mailto:, tel:, sms:, and relative URLs.
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}
