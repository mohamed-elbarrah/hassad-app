import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { TaskAccessPolicyService } from "./task-access-policy.service";

function service(options?: {
  assignedTo?: string | null;
  projectManagerId?: string | null;
  departmentName?: string;
  archivedAt?: Date | null;
  previousAssigneeIds?: string[];
}) {
  const task = {
    assignedTo: options?.assignedTo ?? "current",
    archivedAt: options?.archivedAt ?? null,
    department: { name: options?.departmentName ?? "DESIGN" },
    project: { projectManagerId: options?.projectManagerId ?? "pm" },
    assignmentHistory: (options?.previousAssigneeIds ?? []).map((id) => ({
      id,
    })),
  };
  return new TaskAccessPolicyService({
    task: { findUnique: vi.fn().mockResolvedValue(task) },
    taskFile: { findFirst: vi.fn().mockResolvedValue({ id: "file" }) },
    project: {
      findUnique: vi.fn().mockResolvedValue({ id: "project" }),
      findFirst: vi.fn().mockResolvedValue({ id: "project" }),
    },
  } as never);
}

describe("TaskAccessPolicyService", () => {
  it("allows administrators and project owners full access", async () => {
    const policy = service();
    await expect(
      policy.authorize("task", { id: "other", role: "ADMIN" }, "mutation"),
    ).resolves.toEqual({
      isFormerAssignee: false,
      canViewAllAssignmentHistory: true,
    });
  });

  it("allows only the project manager and current eligible assignee to mutate", async () => {
    const policy = service();
    await expect(
      policy.authorize("task", { id: "pm", role: "PM" }, "mutation"),
    ).resolves.toEqual({
      isFormerAssignee: false,
      canViewAllAssignmentHistory: true,
    });
    await expect(
      policy.authorize("task", { id: "current", role: "TEAM" }, "mutation"),
    ).resolves.toEqual({
      isFormerAssignee: false,
      canViewAllAssignmentHistory: false,
    });
    await expect(
      policy.authorize("task", { id: "other", role: "TEAM" }, "detail"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows former assignees to read but not mutate", async () => {
    const policy = service({ previousAssigneeIds: ["former"] });
    await expect(
      policy.authorize("task", { id: "former", role: "TEAM" }, "comments"),
    ).resolves.toEqual({
      isFormerAssignee: true,
      canViewAllAssignmentHistory: false,
    });
    await expect(
      policy.authorize("task", { id: "former", role: "TEAM" }, "mutation"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows former assignees to download task files", async () => {
    const policy = service({ previousAssigneeIds: ["former"] });
    await expect(
      policy.authorizeDownload("task", "file", {
        id: "former",
        role: "TEAM",
      }),
    ).resolves.toBeUndefined();
  });

  it("limits project task reads to current and former task assignments", async () => {
    const policy = service();
    const scope = await policy.getProjectTaskReadScope("project", {
      id: "former",
      role: "TEAM",
    });

    expect(scope.canViewAllTasks).toBe(false);
    expect(scope.taskWhere).toMatchObject({
      projectId: "project",
      OR: [
        { assignedTo: "former" },
        {
          assignmentHistory: {
            some: {
              OR: [
                { previousAssigneeId: "former" },
                { newAssigneeId: "former" },
              ],
            },
          },
        },
      ],
    });
    expect(scope.assignmentHistoryWhere).toMatchObject({
      OR: [{ previousAssigneeId: "former" }, { newAssigneeId: "former" }],
    });
  });

  it("denies project task reads to unrelated users", async () => {
    const policy = new TaskAccessPolicyService({
      project: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as never);
    await expect(
      policy.getProjectTaskReadScope("project", {
        id: "unrelated",
        role: "TEAM",
      }),
    ).rejects.toMatchObject({ response: { code: "PROJECT_NOT_FOUND" } });
  });

  it("keeps former assignee read access for archived tasks", async () => {
    const policy = service({
      assignedTo: "new",
      archivedAt: new Date(),
      previousAssigneeIds: ["former"],
    });
    await expect(
      policy.authorize("task", { id: "former", role: "TEAM" }, "detail"),
    ).resolves.toEqual({
      isFormerAssignee: true,
      canViewAllAssignmentHistory: false,
    });
    await expect(
      policy.authorize("task", { id: "new", role: "TEAM" }, "mutation"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("scopes marketing assignees to marketing tasks", async () => {
    const policy = service({
      assignedTo: "current",
      departmentName: "DESIGN",
    });
    await expect(
      policy.authorize("task", { id: "current", role: "MARKETING" }, "detail"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
