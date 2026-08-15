export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "hassad-locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
