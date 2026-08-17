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

  const candidates = value.split(",").flatMap((entry, index) => {
    const [tagPart, ...parameters] = entry.trim().split(";");
    const tag = tagPart?.trim().toLowerCase();
    if (!tag) return [];

    const qualityParameter = parameters.find((parameter) =>
      /^q\s*=\s*/i.test(parameter.trim()),
    );
    const quality = qualityParameter
      ? Number(qualityParameter.trim().replace(/^q\s*=\s*/i, ""))
      : 1;

    if (
      !Number.isFinite(quality) ||
      quality < 0 ||
      quality > 1 ||
      quality === 0
    ) {
      return [];
    }

    const primary = tag.split("-")[0];
    const locale = normalizeLocale(primary);
    return locale === primary ? [{ locale, quality, index }] : [];
  });

  candidates.sort(
    (left, right) => right.quality - left.quality || left.index - right.index,
  );
  return candidates[0]?.locale ?? DEFAULT_LOCALE;
}

export function resolveRequestLocale(
  explicitLocale: unknown,
  acceptLanguage: unknown,
): BackendLocale {
  return explicitLocale !== undefined
    ? resolveBackendLocale(explicitLocale)
    : resolveBackendLocale(acceptLanguage);
}

export function runWithBackendLocale<T>(
  locale: BackendLocale,
  callback: () => T,
): T {
  return storage.run(locale, callback);
}

export function getCurrentBackendLocale(): BackendLocale | undefined {
  return storage.getStore();
}
