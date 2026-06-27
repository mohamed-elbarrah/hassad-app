/**
 * Locale-aware Arabic date formatter used across the portal deliverables
 * feature. Returns `null` for empty input so callers can render an
 * em-dash placeholder when desired.
 */
export function formatPortalDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Compact "12 KB / 1.4 MB" file size formatter. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Arabic relative-time formatter. Bounded to days/months/years so we
 * never leak English relative-time strings into the UI. Used in row
 * meta and zero-files nudge copy.
 */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `قبل ${diffH} ساعة`;

  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `قبل ${diffD} يوم`;
  if (diffD < 365) return `قبل ${Math.round(diffD / 30)} شهر`;
  return `قبل ${Math.round(diffD / 365)} سنة`;
}
