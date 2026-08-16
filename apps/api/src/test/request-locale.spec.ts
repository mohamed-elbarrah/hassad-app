import { describe, expect, it } from "vitest";
import {
  getCurrentBackendLocale,
  resolveBackendLocale,
  runWithBackendLocale,
} from "../common/localization/request-locale";
import { getRequestNotificationLocale } from "../modules/notifications/services/notification-locale";

describe("backend locale contract", () => {
  it("defaults unsupported or missing locales to English", () => {
    expect(resolveBackendLocale(undefined)).toBe("en");
    expect(resolveBackendLocale("fr-FR,fr;q=0.9")).toBe("en");
  });

  it("resolves supported Accept-Language primary tags", () => {
    expect(resolveBackendLocale("ar-SA,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(resolveBackendLocale("en-US,en;q=0.9,ar;q=0.8")).toBe("en");
  });

  it("exposes the request locale to backend-generated notification code", () => {
    runWithBackendLocale("ar", () => {
      expect(getCurrentBackendLocale()).toBe("ar");
      expect(getRequestNotificationLocale()).toBe("ar");
    });
  });
});
