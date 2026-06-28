// apps/web/lib/format.ts
// Shared currency, date, and locale formatting utilities.

const DEFAULT_CURRENCY = "SAR";
const DEFAULT_LOCALE = "ar-SA-u-nu-latn";

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

function getCurrencySymbol(currency?: string): string {
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

/** Budget progress 0..1 — clamped, NaN-safe. */
export function budgetProgress(spent: number, total: number): number {
  if (!total || total <= 0) return 0;
  const ratio = spent / total;
  if (Number.isNaN(ratio)) return 0;
  return Math.max(0, Math.min(1, ratio));
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
 * Compact number formatting for axis labels and dense tables:
 * 999 → "999", 1,200 → "1.2K", 12,000 → "12K", 3,400,000 → "3.4M".
 * Trailing ".0" is trimmed ("1.0K" → "1K"). Below 1,000 falls back
 * to Arabic-locale grouping.
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${v}M`;
  }
  if (n >= 1_000) {
    const v = (n / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${v}K`;
  }
  return n.toLocaleString("ar-SA-u-nu-latn");
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

// ── Timezone-Safe Formatters ──────────────────────────────────────────────────
//
// The Intl-based formatters above interpret date strings in the user's local
// timezone, which can shift the displayed day by ±1 when the user is in a
// timezone west/east of UTC. For dates that represent *calendar dates* (a
// period start, an invoice due date, a meeting day), this is wrong.
//
// The functions below parse the calendar date embedded in an ISO YYYY-MM-DD
// string and never invoke the Date timezone machinery. Use them for any
// date that came from the backend as a date-only ISO string.

const ARABIC_MONTHS_SHORT = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** Parse a YYYY-MM-DD (or full ISO) string into its calendar date components
 *  WITHOUT timezone shift. Falls back to `new Date(...)` for non-ISO inputs.
 *  Returns `{ year, month (0-11), day }`. */
function parseCalendarDate(input: string | Date): {
  year: number;
  month: number;
  day: number;
} {
  if (typeof input === "string") {
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (isoMatch) {
      return {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]) - 1,
        day: Number(isoMatch[3]),
      };
    }
  }
  const d = new Date(input);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** Short Arabic date: "12 يونيو" — timezone-safe. */
export function formatShortDateTz(dateStr: string | Date): string {
  const { day, month } = parseCalendarDate(dateStr);
  return `${day} ${ARABIC_MONTHS_SHORT[month]}`;
}

/** Full Arabic date: "12 يونيو 2026" — timezone-safe. */
export function formatDateTz(dateStr: string | Date): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  return `${day} ${ARABIC_MONTHS_SHORT[month]} ${year}`;
}

/** Date + time: "12 يونيو 2026 - 11:00 ص" — calendar date is timezone-safe,
 *  the time portion uses the user's local time (which IS timezone-sensitive
 *  and meaningful). */
export function formatDateTimeTz(dateStr: string | Date): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString("ar-SA-u-nu-latn", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} ${ARABIC_MONTHS_SHORT[month]} ${year} - ${time}`;
}

/** Whole days from now until `endDate` (can be negative). Compares the
 *  end-of-day timestamp of the calendar date against now so the result is
 *  consistent regardless of the user's timezone. */
export function getDaysRemaining(endDate: string | Date): number {
  const { year, month, day } = parseCalendarDate(endDate);
  // Build a UTC timestamp for the END of that calendar day (23:59:59.999)
  // so a period ending today still has ≥0 days remaining until midnight.
  const end = Date.UTC(year, month, day, 23, 59, 59, 999);
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}
