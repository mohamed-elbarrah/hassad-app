import { AsyncLocalStorage } from "async_hooks";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@hassad/shared";

export type BackendLocale = SupportedLocale;

const storage = new AsyncLocalStorage<BackendLocale>();

/**
 * Backend locale contract:
 * - English is the default/fallback locale for backend-generated text.
 * - Only supported BCP-47 primary language values are accepted today: en, ar.
 * - Unsupported or missing values resolve to English.
 */
export function resolveBackendLocale(value: unknown): BackendLocale {
  if (typeof value !== "string") return DEFAULT_LOCALE;

  const candidates = value
    .split(",")
    .map((entry) => entry.trim().split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const primary = candidate.split("-")[0];
    const locale = normalizeLocale(primary);
    if (locale === primary) return locale;
  }

  return DEFAULT_LOCALE;
}

export function runWithBackendLocale<T>(locale: BackendLocale, callback: () => T): T {
  return storage.run(locale, callback);
}

export function getCurrentBackendLocale(): BackendLocale | undefined {
  return storage.getStore();
}
