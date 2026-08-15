export const SUPPORTED_CURRENCIES = ["SAR", "USD", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "SAR";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function resolveCurrency(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

export function currencyLabel(currency: CurrencyCode, locale: "en" | "ar") {
  const labels: Record<CurrencyCode, { en: string; ar: string }> = {
    SAR: { en: "SAR", ar: "ر.س" },
    USD: { en: "USD", ar: "USD" },
    EUR: { en: "EUR", ar: "EUR" },
    GBP: { en: "GBP", ar: "GBP" },
  };
  return labels[currency][locale];
}
