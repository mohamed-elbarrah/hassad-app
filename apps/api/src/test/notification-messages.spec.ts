import { describe, expect, it } from "vitest";
import { renderNotificationMessage } from "../modules/notifications/services/notification-messages";

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

  it("renders numeric values without grouping separators", () => {
    const result = renderNotificationMessage("invoice.paid", {
      invoiceNumber: "INV-12467890",
      amount: 12467890,
    });

    expect(result.body).toContain("12467890");
    expect(result.body).not.toContain(",");
  });
});
