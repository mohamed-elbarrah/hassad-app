import { describe, expect, it } from "vitest";
import { renderNotificationMessage } from "../modules/notifications/services/notification-messages";
import { normalizeNotificationLocale } from "../modules/notifications/services/notification-locale";

describe("notification message catalog", () => {
  it("renders task assignment messages without changing user content", () => {
    const result = renderNotificationMessage("task.assigned", {
      taskTitle: "Client's launch plan",
      department: "Marketing",
    });

    expect(result.title).toBe("New task assigned");
    expect(result.body).toBe(
      'Task "Client\'s launch plan" was assigned to you in the Marketing department.',
    );
  });

  it("falls back to English while an Arabic translation is unavailable", () => {
    expect(normalizeNotificationLocale("ar")).toBe("ar");
    expect(normalizeNotificationLocale("fr")).toBe("en");
    expect(renderNotificationMessage("task.approved", { taskTitle: "Launch" }, "ar").title).toBe("تم اعتماد المهمة");
    expect(renderNotificationMessage("admin.inactive_client", { companyName: "Acme" }, "ar").title).toBe("عميل غير نشط");
  });

  it("renders Arabic messages with Latin numeric values", () => {
    const result = renderNotificationMessage("payment.received", {
      invoiceNumber: "INV-12467890",
      amount: 12467890,
    }, "ar");

    expect(result.body).toContain("12467890");
    expect(result.body).not.toContain("١");
    expect(result.body).not.toContain(",");
  });

  it("renders numeric values without grouping separators", () => {
    const result = renderNotificationMessage("invoice.paid", {
      invoiceNumber: "INV-12467890",
      amount: 12467890,
    });

    expect(result.body).toContain("12467890");
    expect(result.body).not.toContain(",");
  });
});
