import { describe, expect, it, vi } from "vitest";
import { SnoozeReminderScheduler } from "../modules/portal/services/snooze-reminder.scheduler";

describe("SnoozeReminderScheduler", () => {
  it("passes the item type and unchanged client content to the typed notification", async () => {
    const snoozedUntil = new Date("2026-08-17T12:00:00.000Z");
    const row = {
      id: "snooze-1",
      itemType: "DELIVERABLE_APPROVAL",
      itemId: "deliverable-1",
      snoozedUntil,
      client: {
        id: "client-1",
        userId: "user-1",
        companyName: "شركة النور / Al Noor",
      },
    };
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([]);
    const update = vi.fn().mockResolvedValue(undefined);
    const createLocalizedNotification = vi.fn().mockResolvedValue(undefined);
    const scheduler = new SnoozeReminderScheduler(
      { clientSnoozedItem: { findMany, update } } as any,
      { createLocalizedNotification } as any,
    );

    await scheduler.handleExpiredSnoozes();

    expect(createLocalizedNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: row.itemId,
        entityType: "ACTION_ITEM_DELIVERABLE_APPROVAL",
        eventType: "ACTION_ITEM_SNOOZE_EXPIRED",
        userId: row.client.userId,
        messageKey: "snooze.expired",
        messageParams: {
          itemType: row.itemType,
          companyName: row.client.companyName,
        },
        metadata: {
          itemType: row.itemType,
          itemId: row.itemId,
          actionUrl: "/portal/deliverables/deliverable-1",
          snoozedUntil: snoozedUntil.toISOString(),
        },
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: row.id },
      data: { reminderSentAt: expect.any(Date) },
    });
  });

  it("leaves the reminder retryable when notification delivery fails", async () => {
    const row = {
      id: "snooze-1",
      itemType: "INVOICE_PAYMENT",
      itemId: "invoice-1",
      snoozedUntil: new Date("2026-08-17T12:00:00.000Z"),
      client: {
        id: "client-1",
        userId: "user-1",
        companyName: "Al Noor",
      },
    };
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([]);
    const update = vi.fn().mockResolvedValue(undefined);
    const createLocalizedNotification = vi
      .fn()
      .mockRejectedValue(new Error("notification unavailable"));
    const scheduler = new SnoozeReminderScheduler(
      { clientSnoozedItem: { findMany, update } } as any,
      { createLocalizedNotification } as any,
    );

    await scheduler.handleExpiredSnoozes();

    expect(createLocalizedNotification).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});
