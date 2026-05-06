// apps/web/lib/format.ts
// Shared currency, date, and locale formatting utilities.

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
    return new Intl.DateTimeFormat(locale || DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatDateTime(
  date: string | Date | undefined | null,
  locale?: string,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale || DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatRelativeTime(
  dateString: string | undefined | null,
): string {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  const years = Math.floor(months / 12);
  return `منذ ${years} سنة`;
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
