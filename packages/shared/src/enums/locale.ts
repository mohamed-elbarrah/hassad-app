export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return value === "en" || value === "ar";
}

export function normalizeLocale(value: unknown): SupportedLocale {
  return isSupportedLocale(value) ? value : "en";
}
