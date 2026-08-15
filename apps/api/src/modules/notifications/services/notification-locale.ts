export type NotificationLocale = "en" | "ar";

export function normalizeNotificationLocale(value: unknown): NotificationLocale {
  return value === "ar" ? "ar" : "en";
}
