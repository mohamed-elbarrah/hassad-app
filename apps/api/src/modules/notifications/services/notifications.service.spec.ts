import { describe, expect, it, vi } from "vitest";
import { NotificationsService } from "./notifications.service";

function createService() {
  let eventId = 0;
  let notificationId = 0;
  const tx = {
    notificationEvent: {
      create: vi.fn(async () => ({ id: `event-${++eventId}` })),
    },
    notification: {
      create: vi.fn(
        async ({ data }: { data: { eventId: string; userId: string } }) => ({
          id: `notification-${++notificationId}`,
          userId: data.userId,
          isRead: false,
          sentAt: new Date("2026-01-01T00:00:00.000Z"),
        }),
      ),
    },
  };
  const service = new NotificationsService({} as never, {} as never);
  return { service, tx };
}

describe("NotificationsService task reassignment notifications", () => {
  it("notifies each distinct transfer participant and includes the reason", async () => {
    const { service, tx } = createService();
    const payloads = await service.createTaskReassignmentNotifications(
      tx as never,
      {
        taskId: "task-1",
        projectId: "project-1",
        taskTitle: "Design task",
        previousAssignee: { id: "old", name: "Old employee" },
        newAssignee: { id: "new", name: "New employee" },
        projectManagerId: "pm",
        taskCreatorId: "creator",
        actorId: "admin",
        actorName: "Administrator",
        reason: "Workload rebalance",
      },
    );

    expect(payloads.map(({ userId }) => userId)).toEqual([
      "old",
      "new",
      "pm",
      "creator",
    ]);
    expect(
      payloads.map(
        ({ metadata }) => (metadata as Record<string, unknown>).reason,
      ),
    ).toEqual(Array(4).fill("Workload rebalance"));
    expect(tx.notificationEvent.create).toHaveBeenCalledTimes(4);
    expect(tx.notification.create).toHaveBeenCalledTimes(4);
  });

  it("omits the previous assignee for unassigned tasks and deduplicates overlapping roles", async () => {
    const { service, tx } = createService();
    const payloads = await service.createTaskReassignmentNotifications(
      tx as never,
      {
        taskId: "task-1",
        projectId: "project-1",
        taskTitle: "Design task",
        previousAssignee: null,
        newAssignee: { id: "new", name: "New employee" },
        projectManagerId: "creator",
        taskCreatorId: "creator",
        actorId: "admin",
      },
    );

    expect(payloads).toHaveLength(2);
    expect(payloads.map(({ userId }) => userId)).toEqual(["new", "creator"]);
    expect(
      (payloads[1].metadata as Record<string, unknown>).recipientRole,
    ).toBe("project_manager");
    expect(tx.notification.create).toHaveBeenCalledTimes(2);
  });
});
