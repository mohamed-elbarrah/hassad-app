import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { TaskDepartment, UserRole } from "@hassad/shared";
import { TasksService } from "./tasks.service";

function createService(user: {
  id: string;
  name: string;
  isActive: boolean;
  role: { name: string };
  departments: Array<{ departmentId: string }>;
}) {
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue(user) },
    department: {
      findUnique: vi.fn().mockResolvedValue({ name: "MARKETING" }),
    },
  };
  return new TasksService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe("TasksService.resolveAssignableUser", () => {
  it("accepts an active Team employee in the task department", async () => {
    const service = createService({
      id: "employee",
      name: "Team employee",
      isActive: true,
      role: { name: UserRole.TEAM },
      departments: [{ departmentId: "design-department" }],
    });

    await expect(
      service.resolveAssignableUser(
        "employee",
        "design-department",
        TaskDepartment.DESIGN,
      ),
    ).resolves.toMatchObject({ id: "employee" });
  });

  it("rejects inactive employees", async () => {
    const service = createService({
      id: "employee",
      name: "Inactive employee",
      isActive: false,
      role: { name: UserRole.TEAM },
      departments: [{ departmentId: "design-department" }],
    });

    await expect(
      service.resolveAssignableUser(
        "employee",
        "design-department",
        TaskDepartment.DESIGN,
      ),
    ).rejects.toMatchObject({ response: { code: "TASK_ASSIGNEE_INACTIVE" } });
  });

  it("rejects Team users outside the task department", async () => {
    const service = createService({
      id: "employee",
      name: "Other team",
      isActive: true,
      role: { name: UserRole.TEAM },
      departments: [{ departmentId: "content-department" }],
    });

    await expect(
      service.resolveAssignableUser(
        "employee",
        "design-department",
        TaskDepartment.DESIGN,
      ),
    ).rejects.toMatchObject({
      response: { code: "TASK_ASSIGNEE_DEPARTMENT_MISMATCH" },
    });
  });

  it("accepts Marketing role only for Marketing tasks", async () => {
    const service = createService({
      id: "marketer",
      name: "Marketer",
      isActive: true,
      role: { name: UserRole.MARKETING },
      departments: [],
    });

    await expect(
      service.resolveAssignableUser(
        "marketer",
        "marketing-department",
        TaskDepartment.MARKETING,
      ),
    ).resolves.toMatchObject({ id: "marketer" });
    await expect(
      service.resolveAssignableUser(
        "marketer",
        "design-department",
        TaskDepartment.DESIGN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
