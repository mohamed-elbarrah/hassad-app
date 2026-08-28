/** Canonical, frontend-only currency presentation utilities. */

export const DEFAULT_CURRENCY = "SAR" as const;
export const DEFAULT_LOCALE = "ar-SA-u-nu-latn";

/** Metadata used for supported currency presentation; API DTOs remain separate. */
export const CURRENCY_METADATA = {
  SAR: { symbol: "ر.س", locale: DEFAULT_LOCALE },
  DZD: { symbol: "دج", locale: "ar-DZ" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "en-EU" },
} as const;

export type SupportedCurrency = keyof typeof CURRENCY_METADATA;

/**
 * The small presentation shape shared by currency-aware UI. It intentionally
 * contains no exchange-rate information: formatting presents an amount in
 * the units it already has and never converts it implicitly.
 */
export interface CurrencyPresentation {
  code: string;
  symbol: string;
}

/** A currency code, or the narrow code-bearing shape used by API records. */
export type CurrencyReference = string | Pick<CurrencyPresentation, "code">;

function currencyCode(currency?: CurrencyReference | null): string {
  return typeof currency === "string"
    ? currency
    : currency?.code ?? DEFAULT_CURRENCY;
}

export function resolveCurrencyCode(currency?: CurrencyReference | null): string {
  return currencyCode(currency) || DEFAULT_CURRENCY;
}

export function getCurrencyMetadata(currency?: CurrencyReference | null) {
  const code = resolveCurrencyCode(currency).toUpperCase();
  return (
    CURRENCY_METADATA[code as SupportedCurrency] ?? {
      // Keep an API-provided currency identifiable instead of labeling it SAR.
      // The default locale is only a numeric formatting fallback.
      symbol: code,
      locale: DEFAULT_LOCALE,
    }
  );
}

export function getCurrencySymbol(currency?: CurrencyReference | null): string {
  return getCurrencyMetadata(currency).symbol;
}

/**
 * Formats an amount without converting it. The input must already be
 * denominated in the requested currency; exchange rates are never implicit.
 * Nullish and non-finite values use the documented empty presentation.
 */
export function formatCurrencyAmount(
  amount: number | undefined | null,
  currency?: CurrencyReference | null,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat(getCurrencyMetadata(currency).locale, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return "—";
  }
}

/** Formats an already-denominated amount with its supported currency symbol. */
export function formatCurrency(
  amount: number | undefined | null,
  currency?: CurrencyReference | null,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `${formatCurrencyAmount(amount, currency)} ${getCurrencySymbol(currency)}`;
}

export function formatNumber(
  value: number | undefined | null,
  locale: string = DEFAULT_LOCALE,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return "—";
  }
}
