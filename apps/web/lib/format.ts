// apps/web/lib/format.ts
// Shared currency, date, and locale formatting utilities.

import { PLATFORM_LABELS } from "./utils/campaign-constants";

export const DEFAULT_CURRENCY = "SAR";
export const DEFAULT_LOCALE = "ar-SA-u-nu-latn";

const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: "ر.س",
  DZD: "دج",
  USD: "$",
  EUR: "€",
};

const CURRENCY_LOCALES: Record<string, string> = {
  SAR: "ar-SA-u-nu-latn",
  DZD: "ar-DZ",
  USD: "en-US",
  EUR: "en-EU",
};

export function getCurrencySymbol(currency?: string): string {
  return (
    CURRENCY_SYMBOLS[currency || DEFAULT_CURRENCY] ||
    CURRENCY_SYMBOLS[DEFAULT_CURRENCY]
  );
}

export function formatCurrency(
  amount: number | undefined | null,
  currency?: string,
): string {
  if (amount == null) return "—";
  const cur = currency || DEFAULT_CURRENCY;
  const symbol = getCurrencySymbol(cur);
  const locale = CURRENCY_LOCALES[cur] || DEFAULT_LOCALE;
  const formatted = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export function formatDate(
  date: string | Date | undefined | null,
  locale?: string,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale || "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      numberingSystem: "latn",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatShortDate(
  date: string | Date | undefined | null,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/**
 * Arabic-locale date formatter used by portal queue pages where
 * the human-readable form is preferred over ISO digits — e.g.
 * "1 أبريل 2026". Returns the requested `monthStyle` ("long" for
 * "أبريل", "short" for "أبر").
 */
export function formatShortDateLong(
  date: string | Date | undefined | null,
  monthStyle: "long" | "short" = "long",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return d.toLocaleDateString("ar-SA-u-nu-latn", {
      day: "numeric",
      month: monthStyle,
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

/**
 * Same as {@link formatShortDateLong} but returns `null` for empty
 * input. Use this when callers need to distinguish "no date
 * provided" from a rendered "—" placeholder (e.g. conditional
 * rendering in modals).
 */
export function formatPortalDate(
  date: string | Date | undefined | null,
): string | null {
  if (date == null) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString("ar-SA-u-nu-latn", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * True if the invoice is in a state where the client can pay it
 * (outstanding balance + not cancelled + not fully paid).
 */
export function isInvoicePayable(
  status?: string,
  remaining?: number,
): boolean {
  if (status === undefined) return false;
  if (status === "CANCELLED" || status === "PAID") return false;
  if (typeof remaining === "number" && remaining <= 0) return false;
  return (
    status === "DUE" ||
    status === "SENT" ||
    status === "PARTIAL" ||
    status === "LATE" ||
    status === "PENDING"
  );
}

export function formatDateTime(
  date: string | Date | undefined | null,
  locale?: string,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale || "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      numberingSystem: "latn",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatRelativeTime(
  iso: string | null | undefined,
): string {
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

export function formatNumber(
  n: number | undefined | null,
  locale?: string,
): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat(locale || DEFAULT_LOCALE).format(n);
  } catch {
    return String(n);
  }
}

/**
 * Re-export the platform label map so callers don't import from
 * a separate `campaign-constants` module just to render a name.
 */
export { PLATFORM_LABELS as platformLabels } from "./utils/campaign-constants";

/**
 * Display label for a campaign platform — falls back to the raw
 * value if unknown. Pure helper, no DOM coupling.
 */
export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

/** Budget progress 0..1 — clamped, NaN-safe. */
export function budgetProgress(spent: number, total: number): number {
  if (!total || total <= 0) return 0;
  const ratio = spent / total;
  if (Number.isNaN(ratio)) return 0;
  return Math.max(0, Math.min(1, ratio));
}

/** Contract-type display labels (Arabic). */
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

/** Display label for a contract type — falls back to the raw value. */
export function contractTypeLabel(type: string): string {
  return CONTRACT_TYPE_LABELS[type] ?? type;
}

/**
 * Human-readable file size: "1.2 MB". Guards against non-finite
 * or negative inputs — callers occasionally pass through
 * untrusted data from APIs.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Calculate days until a target date from today.
 * Returns positive number for future dates, negative for past dates.
 */
export function daysUntil(date: string | Date | undefined | null): number | null {
  if (!date) return null;
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  // Reset time to midnight for accurate day calculation
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
