import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { TaskDepartment } from "@hassad/shared";
import { AdminTasksService } from "./admin-tasks.service";

function createService({
  assignedTo = null,
  projectManagerId = "pm-1",
  createdBy = "creator-1",
}: {
  assignedTo?: string | null;
  projectManagerId?: string | null;
  createdBy?: string;
} = {}) {
  const task = {
    id: "task-1",
    title: "Design task",
    projectId: "project-1",
    assignedTo,
    createdBy,
    departmentId: "department-1",
    department: { name: TaskDepartment.DESIGN },
    project: { projectManagerId, isArchived: false },
    assignee: assignedTo ? { id: assignedTo, name: "Previous" } : null,
  };
  const tx = {
    task: {
      findUnique: vi.fn().mockResolvedValue(task),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    taskAssignmentHistory: {
      create: vi.fn().mockResolvedValue({ id: "history-1" }),
    },
    ledger: { create: vi.fn().mockResolvedValue({ id: "ledger-1" }) },
    user: { findUnique: vi.fn().mockResolvedValue({ name: "Administrator" }) },
  };
  const notificationPayloads: Array<Record<string, unknown>> = [];
  const prisma = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const actionLog = { record: vi.fn().mockResolvedValue({ id: "action-1" }) };
  const projectGroupChatService = {
    syncParticipantsForTaskReassignment: vi
      .fn()
      .mockResolvedValue(assignedTo ? [assignedTo] : []),
    publishParticipantRemovals: vi.fn().mockResolvedValue(undefined),
  };
  const notificationsService = {
    createTaskReassignmentNotifications: vi.fn(async (_client, params) => {
      const recipients = new Map<string, string>();
      if (params.previousAssignee)
        recipients.set(params.previousAssignee.id, "previous_assignee");
      if (!recipients.has(params.newAssignee.id))
        recipients.set(params.newAssignee.id, "new_assignee");
      if (params.projectManagerId && !recipients.has(params.projectManagerId))
        recipients.set(params.projectManagerId, "project_manager");
      if (!recipients.has(params.taskCreatorId))
        recipients.set(params.taskCreatorId, "task_creator");
      const payloads = [...recipients].map(([userId, recipientRole]) => ({
        userId,
        metadata: { reason: params.reason, recipientRole },
      }));
      notificationPayloads.push(...payloads);
      return payloads;
    }),
    publishPersistedNotification: vi.fn().mockResolvedValue(undefined),
  };
  const tasksService = {
    resolveAssignableUser: vi.fn().mockResolvedValue({
      id: "new-1",
      name: "New employee",
    }),
  };

  return {
    service: new AdminTasksService(
      prisma as never,
      actionLog as never,
      projectGroupChatService as never,
      notificationsService as never,
      tasksService as never,
    ),
    tx,
    prisma,
    actionLog,
    projectGroupChatService,
    notificationsService,
    tasksService,
    notificationPayloads,
  };
}

describe("AdminTasksService.reassign", () => {
  it("assigns an unassigned task and atomically records the reason and notifications", async () => {
    const context = createService();
    await expect(
      context.service.reassign("task-1", "new-1", "admin-1", "Workload change"),
    ).resolves.toEqual({ code: "TASK_REASSIGNED" });

    expect(context.tx.task.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", assignedTo: null },
      data: { assignedTo: "new-1" },
    });
    expect(context.tx.taskAssignmentHistory.create).toHaveBeenCalledWith({
      data: {
        taskId: "task-1",
        previousAssigneeId: null,
        newAssigneeId: "new-1",
        changedBy: "admin-1",
        reason: "Workload change",
      },
    });
    expect(context.actionLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Workload change" }),
      context.tx,
    );
    expect(
      context.notificationPayloads.map((payload) => payload.userId).sort(),
    ).toEqual(["creator-1", "new-1", "pm-1"]);
    const creatorNotification = context.notificationPayloads.find(
      (payload) => payload.userId === "creator-1",
    );
    expect(creatorNotification?.metadata).toHaveProperty(
      "reason",
      "Workload change",
    );
    expect(
      context.projectGroupChatService.syncParticipantsForTaskReassignment,
    ).toHaveBeenCalledWith("project-1", null, context.tx);
  });

  it("notifies all distinct transfer participants and exposes the reason to them", async () => {
    const context = createService({ assignedTo: "old-1" });
    await context.service.reassign(
      "task-1",
      "new-1",
      "admin-1",
      "Department coverage",
    );

    expect(
      context.notificationPayloads.map((payload) => payload.userId).sort(),
    ).toEqual(["creator-1", "new-1", "old-1", "pm-1"]);
    for (const payload of context.notificationPayloads) {
      const metadata = payload.metadata as Record<string, unknown>;
      expect(metadata.reason).toBe("Department coverage");
    }
    expect(
      context.projectGroupChatService.publishParticipantRemovals,
    ).toHaveBeenCalledWith("project-1", ["old-1"]);
  });

  it("rejects assigning a task to its existing assignee", async () => {
    const context = createService({ assignedTo: "new-1" });
    await expect(
      context.service.reassign("task-1", "new-1", "admin-1", "No change"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(context.tx.task.updateMany).not.toHaveBeenCalled();
    expect(context.tx.taskAssignmentHistory.create).not.toHaveBeenCalled();
    expect(
      context.notificationsService.createTaskReassignmentNotifications,
    ).not.toHaveBeenCalled();
  });
});
