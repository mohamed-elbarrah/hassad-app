import { normalizeLocale, type SupportedLocale } from "@hassad/shared";
import {
  getCurrentBackendLocale,
  resolveBackendLocale,
} from "../../../common/localization/request-locale";

export type NotificationLocale = SupportedLocale;

export function normalizeNotificationLocale(
  value: unknown,
): NotificationLocale {
  return typeof value === "string"
    ? resolveBackendLocale(value)
    : normalizeLocale(value);
}

export function getRequestNotificationLocale(): NotificationLocale | undefined {
  return getCurrentBackendLocale();
}
