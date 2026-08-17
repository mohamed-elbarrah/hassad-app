import { describe, expect, it } from "vitest";
import {
  getCurrentBackendLocale,
  resolveRequestLocale,
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

  it("selects the highest-quality supported language", () => {
    expect(resolveBackendLocale("en;q=0.4, ar-EG;q=0.8")).toBe("ar");
    expect(resolveBackendLocale("en;q=0, ar;q=0.5")).toBe("ar");
    expect(resolveBackendLocale("ar;q=invalid, en;q=0.5")).toBe("en");
  });

  it("gives an explicit locale precedence over Accept-Language", () => {
    expect(resolveRequestLocale("ar-EG", "en-US")).toBe("ar");
    expect(resolveRequestLocale("fr-FR", "ar-SA")).toBe("en");
    expect(resolveRequestLocale(undefined, "ar-SA")).toBe("ar");
  });

  it("exposes the request locale to backend-generated notification code", () => {
    runWithBackendLocale("ar", () => {
      expect(getCurrentBackendLocale()).toBe("ar");
      expect(getRequestNotificationLocale()).toBe("ar");
    });
  });

  it("preserves isolated locales across concurrent awaited handlers", async () => {
    const [arabic, english] = await Promise.all([
      runWithBackendLocale("ar", async () => {
        await Promise.resolve();
        return getCurrentBackendLocale();
      }),
      runWithBackendLocale("en", async () => {
        await Promise.resolve();
        return getCurrentBackendLocale();
      }),
    ]);

    expect(arabic).toBe("ar");
    expect(english).toBe("en");
    expect(getCurrentBackendLocale()).toBeUndefined();
  });
});
