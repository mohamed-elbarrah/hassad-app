import { describe, expect, it, vi } from "vitest";
import {
  notificationMessageKeys,
  renderNotificationMessage,
} from "../modules/notifications/services/notification-messages";
import { normalizeNotificationLocale } from "../modules/notifications/services/notification-locale";
import { runWithBackendLocale } from "../common/localization/request-locale";
import { NotificationsService } from "../modules/notifications/services/notifications.service";

const numericCases = [
  ["invoice.created", { amount: 12467890 }, "12467890"],
  [
    "invoice.paid",
    { invoiceNumber: "INV-12467890", amount: 12467890 },
    "12467890",
  ],
  [
    "invoice.payment_reminder",
    { invoiceTitle: "Q1", dayLabel: "tomorrow", amount: 12467890 },
    "12467890",
  ],
  [
    "invoice.scheduled_created",
    { label: "Q1", amount: 12467890, contractTitle: "Growth" },
    "12467890",
  ],
  [
    "invoice.due_reminder",
    { invoiceNumber: "INV-1", amount: 12467890 },
    "12467890",
  ],
  [
    "payment.received",
    { invoiceNumber: "INV-1", amount: 12467890 },
    "12467890",
  ],
  [
    "project.period_invoice_issued",
    { periodNumber: 12, amount: 12467890 },
    "12467890",
  ],
  [
    "contract.expiring",
    { contractTitle: "Growth", companyName: "Acme", days: 12467890 },
    "12467890",
  ],
  [
    "contract.renewal_urgent",
    { contractTitle: "Growth", companyName: "Acme", days: 12467890 },
    "12467890",
  ],
  [
    "contract.auto_canceled",
    { contractTitle: "Growth", graceDays: 12467890 },
    "12467890",
  ],
  [
    "project.periods_generated",
    { periodCount: 12467890, projectName: "Growth" },
    "12467890",
  ],
  [
    "admin.high_workload",
    { activeTasks: 12467890, averageTasks: 3 },
    "12467890",
  ],
  ["admin.system_failures", { webhooks: 12467890, gateways: 3 }, "12467890"],
  ["admin.unassigned_requests", { count: 12467890 }, "12467890"],
] as const;

function createNotificationService(companyLanguage: unknown) {
  const service = new NotificationsService(
    {
      companySetting: {
        findUnique: vi.fn().mockResolvedValue({ value: companyLanguage }),
      },
    } as any,
    {} as any,
  );

  vi.spyOn(service, "createNotification").mockResolvedValue({} as any);
  return service;
}

describe("notification message catalog", () => {
  it("renders every typed notification key in both locales", () => {
    for (const locale of ["en", "ar"] as const) {
      for (const key of notificationMessageKeys) {
        const result = renderNotificationMessage(key, {}, locale);

        expect(result.title).toEqual(expect.any(String));
        expect(result.body).toEqual(expect.any(String));
      }
    }
  });

  it.each(["en", "ar"] as const)(
    "renders task assignment messages without changing user content in %s",
    (locale) => {
      const result = renderNotificationMessage(
        "task.assigned",
        {
          taskTitle: "خطة إطلاق 👩🏽‍💻 / Client's launch plan",
          department: "Marketing & R&D",
        },
        locale,
      );

      expect(result.body).toContain("خطة إطلاق 👩🏽‍💻 / Client's launch plan");
      expect(result.body).toContain("Marketing & R&D");
    },
  );

  it("falls back to English while an Arabic translation is unavailable", () => {
    expect(normalizeNotificationLocale("ar")).toBe("ar");
    expect(normalizeNotificationLocale("fr")).toBe("en");
    expect(
      renderNotificationMessage(
        "campaign.status_changed",
        { campaignName: "Launch", status: "ACTIVE" },
        "ar",
      ),
    ).toEqual(
      renderNotificationMessage(
        "campaign.status_changed",
        { campaignName: "Launch", status: "ACTIVE" },
        "en",
      ),
    );
  });

  it.each(["en", "ar"] as const)(
    "renders numeric values as ungrouped Latin digits in %s",
    (locale) => {
      for (const [key, params, expectedNumber] of numericCases) {
        const result = renderNotificationMessage(key, params, locale);

        expect(result.body).toContain(expectedNumber);
        expect(result.body).not.toMatch(/[٠-٩]/u);
        expect(result.body).not.toContain("12,467,890");
      }
    },
  );

  it("renders the Arabic invoice payment amount as plain Latin digits", () => {
    const result = renderNotificationMessage(
      "invoice.paid",
      { invoiceNumber: "INV-1", amount: 12467890 },
      "ar",
    );

    expect(result.body).toContain("12467890");
    expect(result.body).not.toContain("12,467,890");
  });

  it("renders the snooze reminder category and preserves the company name", () => {
    const params = {
      itemType: "DELIVERABLE_APPROVAL",
      companyName: "شركة النور / Al Noor",
    };

    expect(renderNotificationMessage("snooze.expired", params, "en")).toEqual({
      title: "Snooze expired: deliverable approval",
      body: 'The deliverable approval item for "شركة النور / Al Noor" is ready for review again.',
    });
    expect(renderNotificationMessage("snooze.expired", params, "ar")).toEqual({
      title: "انتهى التأجيل: اعتماد التسليم",
      body: 'أصبح عنصر اعتماد التسليم الخاص بـ "شركة النور / Al Noor" جاهزًا للمراجعة مرة أخرى.',
    });
  });

  it.each(["en", "ar"] as const)(
    "renders dispute ticket numbers as ungrouped Latin digits in %s",
    (locale) => {
      const result = renderNotificationMessage(
        "dispute.new_ticket",
        { ticketNumber: 12467890 },
        locale,
      );

      expect(result.body).toContain("12467890");
      expect(result.body).not.toMatch(/[٠-٩]/u);
      expect(result.body).not.toContain("12,467,890");
    },
  );
});

describe("notification locale precedence", () => {
  it("uses explicit locale before request locale and company language", async () => {
    const service = createNotificationService("en");

    await runWithBackendLocale("en", () =>
      service.createLocalizedNotification({
        entityId: "entity",
        entityType: "test",
        eventType: "test",
        userId: "user",
        messageKey: "task.approved",
        messageParams: { taskTitle: "Launch" },
        locale: "ar",
      }),
    );

    expect(service.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: "تم اعتماد المهمة" }),
    );
  });

  it("uses request locale before company language", async () => {
    const service = createNotificationService("en");

    await runWithBackendLocale("ar", () =>
      service.createLocalizedNotification({
        entityId: "entity",
        entityType: "test",
        eventType: "test",
        userId: "user",
        messageKey: "task.approved",
        messageParams: { taskTitle: "Launch" },
      }),
    );

    expect(service.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: "تم اعتماد المهمة" }),
    );
  });

  it("uses company language before the English fallback", async () => {
    const service = createNotificationService("ar");

    await service.createLocalizedNotification({
      entityId: "entity",
      entityType: "test",
      eventType: "test",
      userId: "user",
      messageKey: "task.approved",
      messageParams: { taskTitle: "Launch" },
    });

    expect(service.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: "تم اعتماد المهمة" }),
    );
  });
});
