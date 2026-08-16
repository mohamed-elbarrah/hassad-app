import {
  normalizeLocale,
  type SupportedLocale,
} from "@hassad/shared";

export type NotificationLocale = SupportedLocale;

export function normalizeNotificationLocale(value: unknown): NotificationLocale {
  return normalizeLocale(value);
}
