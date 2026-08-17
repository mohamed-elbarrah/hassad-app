import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import {
  UserRole,
  TaskDepartment,
  RequestStatus,
  ProjectStatus,
} from "@hassad/shared";
import {
  badRequest,
  conflict,
  notFound,
} from "../../../common/errors/domain-errors";

const BCRYPT_ROUNDS = 12;

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  excludeRole?: UserRole;
  department?: TaskDepartment;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async resolveRoleId(
    roleName: UserRole,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const role = await db.role.findFirst({
      where: { name: roleName },
    });
    if (!role) {
      throw badRequest("USER_ROLE_NOT_FOUND", `Role "${roleName}" not found`, {
        role: roleName,
      });
    }
    return role.id;
  }

  private async resolveDepartmentId(
    deptName: TaskDepartment,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const dept = await db.department.findFirst({
      where: { name: deptName },
    });
    if (!dept) {
      throw badRequest(
        "USER_DEPARTMENT_NOT_FOUND",
        `Department "${deptName}" not found`,
        { department: deptName },
      );
    }
    return dept.id;
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }

  private prismaErrorTarget(error: unknown): string[] {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return [];
    const target = error.meta?.target;
    return Array.isArray(target) ? target.map(String) : [];
  }

  private throwMutationPrismaError(
    error: unknown,
    email: string | undefined,
    userId: string | undefined,
  ): never {
    if (this.isPrismaError(error, "P2002")) {
      const target = this.prismaErrorTarget(error);
      if (target.includes("email")) {
        throw conflict(
          "USER_EMAIL_ALREADY_EXISTS",
          "A user with this email already exists",
          { email },
        );
      }
      if (target.includes("user_id") && target.includes("department_id")) {
        throw conflict(
          "USER_DEPARTMENT_ALREADY_ASSIGNED",
          "This department is already assigned to the user",
          { userId },
        );
      }
      throw conflict("USER_MUTATION_CONFLICT", "The user could not be saved");
    }
    if (this.isPrismaError(error, "P2003")) {
      throw notFound(
        "USER_REFERENCE_NOT_FOUND",
        "A user role or department reference is no longer available",
        { userId },
      );
    }
    if (userId && this.isPrismaError(error, "P2025")) {
      throw notFound("USER_NOT_FOUND", `User with ID ${userId} not found`, {
        userId,
      });
    }
    throw error;
  }

  /** Normalise a raw Prisma user row into a safe API shape. */
  private normalise(user: any) {
    // role may be a full object (when included) or a string id
    const roleName =
      user.role && typeof user.role === "object"
        ? (user.role.name as string)
        : (user.roleId as string);

    // department: first entry in departments relation (if loaded)
    const deptEntry =
      user.departments && user.departments.length > 0
        ? user.departments[0]
        : null;
    const department = deptEntry?.department?.name ?? null;

    // workload counts (only present when included by findAll)
    const activeRequestsCount = user.assignedRequests?.length ?? 0;
    const activeProjectsCount = user.managedProjects?.length ?? 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      isActive: user.isActive,
      phoneWhatsapp: user.phoneWhatsapp,
      avatarUrl: user.avatarUrl,
      department,
      activeRequestsCount,
      activeProjectsCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const roleId = await this.resolveRoleId(dto.role, tx);
        const deptId = dto.department
          ? await this.resolveDepartmentId(dto.department, tx)
          : undefined;
        const existingUser = await tx.user.findUnique({
          where: { email: dto.email },
          select: { id: true },
        });

        if (existingUser) {
          throw conflict(
            "USER_EMAIL_ALREADY_EXISTS",
            "A user with this email already exists",
            { email: dto.email },
          );
        }

        const user = await tx.user.create({
          data: {
            name: dto.name,
            email: dto.email,
            passwordHash,
            roleId,
          },
          include: {
            role: true,
            departments: { include: { department: true } },
          },
        });

        if (deptId) {
          await tx.userDepartment.create({
            data: { userId: user.id, departmentId: deptId },
          });
          const updated = await tx.user.findUnique({
            where: { id: user.id },
            include: {
              role: true,
              departments: { include: { department: true } },
            },
          });
          return this.normalise(updated);
        }

        return this.normalise(user);
      });
    } catch (error) {
      this.throwMutationPrismaError(error, dto.email, undefined);
    }
  }

  async findAll(filters: UserListFilters = {}) {
    const {
      search,
      role,
      excludeRole,
      department,
      page = 1,
      limit = 20,
    } = filters;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw badRequest(
        "USER_PAGINATION_INVALID",
        "Page must be at least 1 and limit must be between 1 and 100",
        { page, limit },
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = { name: role };
    } else if (excludeRole) {
      where.role = { name: { not: excludeRole } };
    }

    if (department) {
      where.departments = {
        some: { department: { name: department } },
      };
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          role: true,
          departments: { include: { department: true } },
          assignedRequests: {
            where: {
              status: {
                notIn: [RequestStatus.PROJECT_CREATED, RequestStatus.CANCELLED],
              },
            },
            select: { id: true },
          },
          managedProjects: {
            where: {
              status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] },
            },
            select: { id: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rawItems.map((u) => this.normalise(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        departments: { include: { department: true } },
        permissions: { include: { permission: true } },
      },
    });

    if (!user) {
      throw notFound("USER_NOT_FOUND", `User with ID ${id} not found`, {
        userId: id,
      });
    }

    return this.normalise(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          throw notFound("USER_NOT_FOUND", `User with ID ${id} not found`, {
            userId: id,
          });
        }

        if (dto.email !== undefined && dto.email !== existingUser.email) {
          const emailOwner = await tx.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
          });
          if (emailOwner && emailOwner.id !== id) {
            throw conflict(
              "USER_EMAIL_ALREADY_EXISTS",
              "A user with this email already exists",
              { email: dto.email },
            );
          }
        }

        const roleId = dto.role
          ? await this.resolveRoleId(dto.role, tx)
          : undefined;
        const deptId =
          dto.department !== undefined && dto.department !== null
            ? await this.resolveDepartmentId(dto.department, tx)
            : undefined;
        const data: any = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.isActive !== undefined) data.isActive = dto.isActive;
        if (dto.phoneWhatsapp !== undefined)
          data.phoneWhatsapp = dto.phoneWhatsapp;
        if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
        if (dto.password) {
          data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        }
        if (roleId) data.roleId = roleId;

        const user = await tx.user.update({
          where: { id },
          data,
          include: {
            role: true,
            departments: { include: { department: true } },
          },
        });

        if (dto.department !== undefined) {
          await tx.userDepartment.deleteMany({ where: { userId: id } });
          if (deptId) {
            await tx.userDepartment.create({
              data: { userId: id, departmentId: deptId },
            });
          }

          const updated = await tx.user.findUnique({
            where: { id },
            include: {
              role: true,
              departments: { include: { department: true } },
            },
          });
          return this.normalise(updated);
        }

        return this.normalise(user);
      });
    } catch (error) {
      this.throwMutationPrismaError(error, dto.email, id);
    }
  }

  async deactivate(id: string) {
    await this.assertExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { role: true, departments: { include: { department: true } } },
    });
    return this.normalise(user);
  }

  async reactivate(id: string) {
    await this.assertExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: { role: true, departments: { include: { department: true } } },
    });
    return this.normalise(user);
  }

  async remove(id: string) {
    return this.deactivate(id);
  }

  private async assertExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      throw notFound("USER_NOT_FOUND", `User with ID ${id} not found`, {
        userId: id,
      });
    }
  }

  // ── Admin stats ───────────────────────────────────────────────────────────────

  async getAdminStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeClients,
      activeProjects,
      overdueTasks,
      monthlyRevenue,
      unpaidInvoicesCount,
      satisfactionResult,
    ] = await Promise.all([
      this.prisma.client.count({ where: { status: "ACTIVE" } }),
      this.prisma.project.count({
        where: { status: { in: ["ACTIVE", "PLANNING"] } },
      }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: { status: { in: ["DUE", "SENT"] } },
      }),
      this.prisma.satisfactionRating.aggregate({
        _avg: { score: true },
      }),
    ]);

    return {
      activeClients,
      activeProjects,
      overdueTasks,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      unpaidInvoicesCount,
      satisfactionRate: satisfactionResult._avg.score
        ? Math.round(satisfactionResult._avg.score * 20)
        : null,
    };
  }
}
