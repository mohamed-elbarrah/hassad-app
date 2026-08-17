import { describe, expect, afterAll, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../modules/core/services/users.service";
import { RolesService } from "../modules/core/services/roles.service";
import { getApp, closeApp } from "./helpers/setup";
import { getPrisma } from "./helpers/prisma";
import { loginAs } from "./steps/auth.steps";
import { UserRole, TaskDepartment } from "@hassad/shared";

function expectErrorEnvelope(
  response: request.Response,
  status: number,
  code: string,
  details: unknown = null,
) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({
    success: false,
    data: null,
    error: {
      code,
      message: expect.any(String),
      details,
    },
  });
}

function expectSuccessEnvelope(
  response: request.Response,
  status: number,
  data: unknown,
) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({
    success: true,
    data,
    error: null,
  });
}

const CORE_PERMISSION_NAMES = [
  "users.create",
  "users.read",
  "users.update",
  "users.delete",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.assign_permissions",
  "permissions.read",
  "departments.read",
  "departments.create",
  "departments.assign",
];

const CORE_PERMISSION_MIGRATION_PATH = resolve(
  __dirname,
  "../../prisma/migrations/20260817000000_seed_core_permissions/migration.sql",
);

const CORE_PERMISSION_MIGRATION_STATEMENTS = readFileSync(
  CORE_PERMISSION_MIGRATION_PATH,
  "utf8",
)
  .replace(/--.*$/gm, "")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

async function runCorePermissionMigration() {
  const prisma = getPrisma();
  for (const statement of CORE_PERMISSION_MIGRATION_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function readCorePermissionState(
  unrelatedPermissionId: string,
  teamRoleId: string,
  employeeId: string,
) {
  const prisma = getPrisma();
  const [
    corePermissionCount,
    adminCoreAssignmentCount,
    nonAdminRoleCount,
    nonAdminUserCount,
    unrelatedRoleAssignmentCount,
    unrelatedUserAssignmentCount,
  ] = await Promise.all([
    prisma.permission.count({
      where: { name: { in: CORE_PERMISSION_NAMES } },
    }),
    prisma.rolePermission.count({
      where: {
        role: { name: UserRole.ADMIN },
        permission: { name: { in: CORE_PERMISSION_NAMES } },
      },
    }),
    prisma.rolePermission.count({
      where: {
        role: { name: { not: UserRole.ADMIN } },
        permission: { name: { in: CORE_PERMISSION_NAMES } },
      },
    }),
    prisma.userPermission.count({
      where: {
        user: { role: { name: { not: UserRole.ADMIN } } },
        permission: { name: { in: CORE_PERMISSION_NAMES } },
      },
    }),
    prisma.rolePermission.count({
      where: { roleId: teamRoleId, permissionId: unrelatedPermissionId },
    }),
    prisma.userPermission.count({
      where: { userId: employeeId, permissionId: unrelatedPermissionId },
    }),
  ]);

  return {
    corePermissionCount,
    adminCoreAssignmentCount,
    nonAdminRoleCount,
    nonAdminUserCount,
    unrelatedRoleAssignmentCount,
    unrelatedUserAssignmentCount,
  };
}

async function installFailingDepartmentAssignmentTrigger() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION core_test_fail_department_assignment()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'core test forced department assignment failure';
    END;
    $$;
  `);
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS core_test_fail_department_assignment_trigger
    ON user_departments;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER core_test_fail_department_assignment_trigger
    BEFORE INSERT ON user_departments
    FOR EACH ROW EXECUTE FUNCTION core_test_fail_department_assignment();
  `);
}

async function removeFailingDepartmentAssignmentTrigger() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS core_test_fail_department_assignment_trigger
    ON user_departments;
  `);
  await prisma.$executeRawUnsafe(
    "DROP FUNCTION IF EXISTS core_test_fail_department_assignment();",
  );
}

async function installFailingRolePermissionTrigger() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION core_test_fail_role_permission_assignment()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RAISE EXCEPTION 'core test forced role permission assignment failure';
    END;
    $$;
  `);
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS core_test_fail_role_permission_assignment_trigger
    ON role_permissions;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER core_test_fail_role_permission_assignment_trigger
    BEFORE INSERT ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION core_test_fail_role_permission_assignment();
  `);
}

async function removeFailingRolePermissionTrigger() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS core_test_fail_role_permission_assignment_trigger
    ON role_permissions;
  `);
  await prisma.$executeRawUnsafe(
    "DROP FUNCTION IF EXISTS core_test_fail_role_permission_assignment();",
  );
}

function expectValidationFailed(response: request.Response) {
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    success: false,
    data: null,
    error: {
      code: "VALIDATION_FAILED",
      message: expect.any(String),
      details: expect.any(Array),
    },
  });
}

function makeTransactionalPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    role: {
      findFirst: vi.fn().mockResolvedValue({ id: "role-1", name: "TEAM" }),
      findUnique: vi.fn().mockResolvedValue({ id: "role-1", name: "TEAM" }),
    },
    department: {
      findFirst: vi
        .fn()
        .mockResolvedValue({ id: "department-1", name: "DESIGN" }),
    },
    permission: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: "permission-1" }, { id: "permission-2" }]),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hash",
        roleId: "role-1",
        isActive: true,
        phoneWhatsapp: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { name: "TEAM" },
        departments: [],
      }),
      update: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        roleId: "role-1",
        isActive: true,
        phoneWhatsapp: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { name: "TEAM" },
        departments: [],
      }),
    },
    userDepartment: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: "user-department-1" }),
    },
    rolePermission: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };

  const prisma = {
    ...tx,
    ...overrides,
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  return { prisma: prisma as unknown as PrismaService, tx };
}

describe("Core hardening", () => {
  let app: INestApplication;

  afterAll(async () => {
    await closeApp();
  });

  test("returns a stable not-found envelope for an unknown user", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");

    const response = await request(app.getHttpServer())
      .get("/v1/users/00000000-0000-0000-0000-000000000000")
      .auth(admin.accessToken, { type: "bearer" });

    expectErrorEnvelope(response, 404, "USER_NOT_FOUND", {
      userId: "00000000-0000-0000-0000-000000000000",
    });
  });

  test("rejects duplicate user emails with a conflict code", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");

    const response = await request(app.getHttpServer())
      .post("/v1/users")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        name: "Duplicate User",
        email: "admin@hassad.com",
        password: "password123",
        role: UserRole.TEAM,
      });

    expectErrorEnvelope(response, 409, "USER_EMAIL_ALREADY_EXISTS", {
      email: "admin@hassad.com",
    });
  });

  test("rejects invalid user pagination deterministically", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");

    const response = await request(app.getHttpServer())
      .get("/v1/users?page=0&limit=101")
      .auth(admin.accessToken, { type: "bearer" });

    expectErrorEnvelope(response, 400, "USER_PAGINATION_INVALID", {
      page: 0,
      limit: 101,
    });
  });

  test("installs Core permissions and grants them only to ADMIN", async () => {
    const prisma = getPrisma();
    const permissions = await prisma.permission.findMany({
      where: { name: { in: CORE_PERMISSION_NAMES } },
      select: { name: true },
    });
    expect(permissions.map((permission) => permission.name).sort()).toEqual(
      [...CORE_PERMISSION_NAMES].sort(),
    );

    const admin = await prisma.role.findUniqueOrThrow({
      where: { name: UserRole.ADMIN },
      select: {
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });
    expect(
      admin.permissions
        .map((rolePermission) => rolePermission.permission.name)
        .filter((name) => CORE_PERMISSION_NAMES.includes(name))
        .sort(),
    ).toEqual([...CORE_PERMISSION_NAMES].sort());

    const nonAdminAssignments = await prisma.rolePermission.findMany({
      where: {
        role: { name: { not: UserRole.ADMIN } },
        permission: { name: { in: CORE_PERMISSION_NAMES } },
      },
    });
    expect(nonAdminAssignments).toHaveLength(0);
  });

  test("reapplies the Core permission migration without changing unrelated assignments", async () => {
    const prisma = getPrisma();
    const team = await prisma.role.findUniqueOrThrow({
      where: { name: UserRole.TEAM },
      select: { id: true },
    });
    const employee = await prisma.user.findUniqueOrThrow({
      where: { email: "employee@hassad.com" },
      select: { id: true },
    });
    const corePermission = await prisma.permission.findUniqueOrThrow({
      where: { name: "users.read" },
      select: { id: true },
    });
    const unrelatedPermission = await prisma.permission.create({
      data: { name: `core-migration-unrelated-${Date.now()}` },
      select: { id: true },
    });

    await prisma.rolePermission.create({
      data: { roleId: team.id, permissionId: corePermission.id },
    });
    await prisma.userPermission.create({
      data: { userId: employee.id, permissionId: corePermission.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: team.id, permissionId: unrelatedPermission.id },
    });
    await prisma.userPermission.create({
      data: { userId: employee.id, permissionId: unrelatedPermission.id },
    });

    try {
      await runCorePermissionMigration();
      const firstRun = await readCorePermissionState(
        unrelatedPermission.id,
        team.id,
        employee.id,
      );

      await runCorePermissionMigration();
      const secondRun = await readCorePermissionState(
        unrelatedPermission.id,
        team.id,
        employee.id,
      );

      expect(firstRun).toEqual({
        corePermissionCount: CORE_PERMISSION_NAMES.length,
        adminCoreAssignmentCount: CORE_PERMISSION_NAMES.length,
        nonAdminRoleCount: 0,
        nonAdminUserCount: 0,
        unrelatedRoleAssignmentCount: 1,
        unrelatedUserAssignmentCount: 1,
      });
      expect(secondRun).toEqual(firstRun);
    } finally {
      await prisma.userPermission.deleteMany({
        where: { permissionId: unrelatedPermission.id },
      });
      await prisma.rolePermission.deleteMany({
        where: { permissionId: unrelatedPermission.id },
      });
      await prisma.permission.delete({
        where: { id: unrelatedPermission.id },
      });
    }
  });

  test("preserves non-admin allow and deny RBAC behavior", async () => {
    app = await getApp();
    const employee = await loginAs(app, "employee@hassad.com", "password123");

    const allowed = await request(app.getHttpServer())
      .get("/v1/notifications/my")
      .auth(employee.accessToken, { type: "bearer" });
    expectSuccessEnvelope(allowed, 200, {
      data: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 20,
      unreadCount: expect.any(Number),
    });

    const denied = await request(app.getHttpServer())
      .get("/v1/users")
      .auth(employee.accessToken, { type: "bearer" });
    expectErrorEnvelope(denied, 403, "PERMISSION_MISSING", {
      requiredPermissions: ["users.read"],
    });
  });

  test("validates department IDs on both assignment routes", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const employee = await getPrisma().user.findUniqueOrThrow({
      where: { email: "employee@hassad.com" },
      select: { id: true },
    });

    const missing = await request(app.getHttpServer())
      .post(`/v1/departments/users/${employee.id}`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({});
    expectValidationFailed(missing);

    const invalid = await request(app.getHttpServer())
      .post(`/v1/users/${employee.id}/departments`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ departmentId: "not-a-uuid" });
    expectValidationFailed(invalid);
  });

  test("rejects whitespace-only Core names", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");

    const user = await request(app.getHttpServer())
      .post("/v1/users")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        name: "   ",
        email: `whitespace-user-${Date.now()}@example.com`,
        password: "password123",
        role: UserRole.TEAM,
      });
    expectValidationFailed(user);

    const role = await request(app.getHttpServer())
      .post("/v1/roles")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: "   " });
    expectValidationFailed(role);

    const department = await request(app.getHttpServer())
      .post("/v1/departments")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: "   " });
    expectValidationFailed(department);

    const adminUser = await getPrisma().user.findUniqueOrThrow({
      where: { email: "admin@hassad.com" },
      select: { id: true },
    });
    const update = await request(app.getHttpServer())
      .patch(`/v1/users/${adminUser.id}`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: "   " });
    expectValidationFailed(update);
  });

  test("forbids a non-admin from updating another profile", async () => {
    app = await getApp();
    const prisma = getPrisma();
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@hassad.com" },
      select: { id: true },
    });
    const employee = await loginAs(app, "employee@hassad.com", "password123");

    const response = await request(app.getHttpServer())
      .patch(`/v1/users/${adminUser.id}`)
      .auth(employee.accessToken, { type: "bearer" })
      .send({ name: "Should Not Change" });

    expectErrorEnvelope(response, 403, "USER_PROFILE_UPDATE_FORBIDDEN");
  });

  test("forbids restricted fields in a self profile update", async () => {
    app = await getApp();
    const prisma = getPrisma();
    const employeeUser = await prisma.user.findUniqueOrThrow({
      where: { email: "employee@hassad.com" },
      select: { id: true },
    });
    const employee = await loginAs(app, "employee@hassad.com", "password123");

    const response = await request(app.getHttpServer())
      .patch(`/v1/users/${employeeUser.id}`)
      .auth(employee.accessToken, { type: "bearer" })
      .send({ role: UserRole.PM });

    expectErrorEnvelope(response, 403, "USER_PROFILE_FIELDS_FORBIDDEN");
  });

  test("returns HTTP codes for missing role and department references", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: UserRole.TEAM },
      select: { id: true },
    });
    const department = await prisma.department.findUniqueOrThrow({
      where: { name: TaskDepartment.DESIGN },
      select: { id: true },
    });

    await prisma.role.update({
      where: { id: role.id },
      data: { name: "TEAM_CORE_REVIEW_GAP" },
    });
    try {
      const missingRole = await request(app.getHttpServer())
        .post("/v1/users")
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          name: "Missing Role HTTP",
          email: "missing-role-http@example.com",
          password: "password123",
          role: UserRole.TEAM,
        });
      expectErrorEnvelope(missingRole, 400, "USER_ROLE_NOT_FOUND", {
        role: UserRole.TEAM,
      });
    } finally {
      await prisma.role.update({
        where: { id: role.id },
        data: { name: UserRole.TEAM },
      });
    }

    await prisma.department.update({
      where: { id: department.id },
      data: { name: "DESIGN_CORE_REVIEW_GAP" },
    });
    try {
      const missingDepartment = await request(app.getHttpServer())
        .post("/v1/users")
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          name: "Missing Department HTTP",
          email: "missing-department-http@example.com",
          password: "password123",
          role: UserRole.TEAM,
          department: TaskDepartment.DESIGN,
        });
      expectErrorEnvelope(missingDepartment, 400, "USER_DEPARTMENT_NOT_FOUND", {
        department: TaskDepartment.DESIGN,
      });
    } finally {
      await prisma.department.update({
        where: { id: department.id },
        data: { name: TaskDepartment.DESIGN },
      });
    }
  });

  test("soft-deletes users without removing their database row", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const email = `soft-delete-${Date.now()}@example.com`;
    const created = await request(app.getHttpServer())
      .post("/v1/users")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        name: "Soft Delete User",
        email,
        password: "password123",
        role: UserRole.TEAM,
      });

    const deleted = await request(app.getHttpServer())
      .delete(`/v1/users/${created.body.data.id}`)
      .auth(admin.accessToken, { type: "bearer" });

    expectSuccessEnvelope(
      deleted,
      200,
      expect.objectContaining({
        id: created.body.data.id,
        isActive: false,
      }),
    );
    const row = await getPrisma().user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });
    expect(row).toEqual({ id: created.body.data.id, isActive: false });
  });

  test("replaces role permissions through the Core endpoint", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const roleName = `CORE_PERMISSION_TEST_${Date.now()}`;
    const createdRole = await request(app.getHttpServer())
      .post("/v1/roles")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: roleName });
    expect(createdRole.status).toBe(201);
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
      select: { id: true },
    });
    const permissions = await prisma.permission.findMany({
      take: 2,
      orderBy: { name: "asc" },
      select: { id: true },
    });

    const response = await request(app.getHttpServer())
      .post(`/v1/roles/${role.id}/permissions`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ permissionIds: permissions.map((permission) => permission.id) });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { count: permissions.length },
      error: null,
    });
    await expect(
      prisma.rolePermission.findMany({
        where: { roleId: role.id },
        orderBy: { permissionId: "asc" },
        select: { permissionId: true },
      }),
    ).resolves.toEqual(
      permissions
        .map((permission) => ({ permissionId: permission.id }))
        .sort((left, right) =>
          left.permissionId.localeCompare(right.permissionId),
        ),
    );
  });

  test("normalizes role, department, and assignment Prisma errors", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const employee = await prisma.user.findUniqueOrThrow({
      where: { email: "employee@hassad.com" },
      select: { id: true },
    });
    const design = await prisma.department.findUniqueOrThrow({
      where: { name: TaskDepartment.DESIGN },
      select: { id: true },
    });
    const team = await prisma.role.findUniqueOrThrow({
      where: { name: UserRole.TEAM },
      select: { id: true },
    });

    const duplicateRole = await request(app.getHttpServer())
      .post("/v1/roles")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: UserRole.ADMIN });
    expectErrorEnvelope(duplicateRole, 409, "ROLE_NAME_ALREADY_EXISTS", {
      name: UserRole.ADMIN,
    });

    const missingRole = await request(app.getHttpServer())
      .patch("/v1/roles/00000000-0000-0000-0000-000000000000")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: "Missing Role" });
    expectErrorEnvelope(missingRole, 404, "ROLE_NOT_FOUND", {
      roleId: "00000000-0000-0000-0000-000000000000",
    });

    const duplicateDepartment = await request(app.getHttpServer())
      .post("/v1/departments")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: TaskDepartment.DESIGN });
    expectErrorEnvelope(
      duplicateDepartment,
      409,
      "DEPARTMENT_NAME_ALREADY_EXISTS",
      { name: TaskDepartment.DESIGN },
    );

    const duplicateAssignment = await request(app.getHttpServer())
      .post(`/v1/departments/users/${employee.id}`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ departmentId: design.id });
    expectErrorEnvelope(
      duplicateAssignment,
      409,
      "USER_DEPARTMENT_ALREADY_ASSIGNED",
      { userId: employee.id, departmentId: design.id },
    );

    const missingPermission = await request(app.getHttpServer())
      .post(`/v1/roles/${team.id}/permissions`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ permissionIds: ["00000000-0000-0000-0000-000000000000"] });
    expectErrorEnvelope(missingPermission, 404, "PERMISSION_NOT_FOUND", {
      permissionId: "00000000-0000-0000-0000-000000000000",
    });
  });

  test("allows department descriptions to be omitted", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const response = await request(app.getHttpServer())
      .post("/v1/departments")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ name: `CORE_OPTIONAL_DESCRIPTION_${Date.now()}` });

    expectSuccessEnvelope(
      response,
      201,
      expect.objectContaining({
        name: expect.stringContaining("CORE_OPTIONAL_DESCRIPTION_"),
        description: null,
      }),
    );
  });

  test("rolls back persisted user creation when department assignment fails", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const email = `rollback-user-${Date.now()}@example.com`;

    await installFailingDepartmentAssignmentTrigger();
    try {
      const response = await request(app.getHttpServer())
        .post("/v1/users")
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          name: "Rollback User",
          email,
          password: "password123",
          role: UserRole.TEAM,
          department: TaskDepartment.DESIGN,
        });
      expectErrorEnvelope(response, 500, "INTERNAL_ERROR");
    } finally {
      await removeFailingDepartmentAssignmentTrigger();
    }

    await expect(
      getPrisma().user.findUnique({ where: { email } }),
    ).resolves.toBeNull();
  });

  test("rolls back persisted user and department changes on assignment failure", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const employee = await prisma.user.findUniqueOrThrow({
      where: { email: "employee@hassad.com" },
      include: { departments: { include: { department: true } } },
    });
    const beforeDepartments = employee.departments.map(
      (entry) => entry.department.name,
    );

    await installFailingDepartmentAssignmentTrigger();
    try {
      const response = await request(app.getHttpServer())
        .patch(`/v1/users/${employee.id}`)
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          name: "Persisted Rollback Must Restore This",
          department: TaskDepartment.DESIGN,
        });
      expectErrorEnvelope(response, 500, "INTERNAL_ERROR");
    } finally {
      await removeFailingDepartmentAssignmentTrigger();
    }

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: employee.id },
      include: { departments: { include: { department: true } } },
    });
    expect(after.name).toBe(employee.name);
    expect(after.departments.map((entry) => entry.department.name)).toEqual(
      beforeDepartments,
    );
  });

  test("reports missing role and department without mutating users", async () => {
    const roleFixture = makeTransactionalPrisma();
    roleFixture.tx.role.findFirst.mockResolvedValueOnce(null);
    const roleService = new UsersService(roleFixture.prisma);

    await expect(
      roleService.create({
        name: "Missing Role",
        email: "missing-role@example.com",
        password: "password123",
        role: UserRole.TEAM,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "USER_ROLE_NOT_FOUND" }),
    });
    expect(roleFixture.tx.user.create).not.toHaveBeenCalled();

    const departmentFixture = makeTransactionalPrisma();
    departmentFixture.tx.department.findFirst.mockResolvedValueOnce(null);
    const departmentService = new UsersService(departmentFixture.prisma);

    await expect(
      departmentService.create({
        name: "Missing Department",
        email: "missing-department@example.com",
        password: "password123",
        role: UserRole.TEAM,
        department: TaskDepartment.DESIGN,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "USER_DEPARTMENT_NOT_FOUND" }),
    });
    expect(departmentFixture.tx.user.create).not.toHaveBeenCalled();
  });

  test("replaces role permissions transactionally and rejects duplicate inputs", async () => {
    const { prisma, tx } = makeTransactionalPrisma();
    const service = new RolesService(prisma);

    await expect(
      service.assignPermissions("role-1", {
        permissionIds: ["permission-1", "permission-1"],
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "ROLE_PERMISSION_DUPLICATE",
      }),
    });
    expect(tx.rolePermission.deleteMany).not.toHaveBeenCalled();

    await service.assignPermissions("role-1", {
      permissionIds: ["permission-1", "permission-2"],
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: "role-1" },
    });
    expect(tx.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: "role-1", permissionId: "permission-1" },
        { roleId: "role-1", permissionId: "permission-2" },
      ],
    });
  });

  test("rejects a missing permission before replacing role permissions", async () => {
    const { prisma, tx } = makeTransactionalPrisma();
    tx.permission.findMany.mockResolvedValueOnce([]);
    const service = new RolesService(prisma);

    await expect(
      service.assignPermissions("role-1", { permissionIds: ["missing"] }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "PERMISSION_NOT_FOUND" }),
    });
    expect(tx.rolePermission.deleteMany).not.toHaveBeenCalled();
  });

  test("rolls back persisted role permissions when replacement fails", async () => {
    app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: UserRole.TEAM },
      select: { id: true },
    });
    const before = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      orderBy: [{ roleId: "asc" }, { permissionId: "asc" }],
      select: { roleId: true, permissionId: true },
    });
    const permissions = await prisma.permission.findMany({
      take: 2,
      orderBy: { name: "asc" },
      select: { id: true },
    });

    await installFailingRolePermissionTrigger();
    try {
      const response = await request(app.getHttpServer())
        .post(`/v1/roles/${role.id}/permissions`)
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          permissionIds: permissions.map((permission) => permission.id),
        });
      expectErrorEnvelope(response, 500, "INTERNAL_ERROR");
    } finally {
      await removeFailingRolePermissionTrigger();
    }

    await expect(
      prisma.rolePermission.findMany({
        where: { roleId: role.id },
        orderBy: [{ roleId: "asc" }, { permissionId: "asc" }],
        select: { roleId: true, permissionId: true },
      }),
    ).resolves.toEqual(before);
  });
});
