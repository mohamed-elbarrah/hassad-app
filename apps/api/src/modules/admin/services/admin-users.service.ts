import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserRole } from "@hassad/shared";
import {
  QueryUsersDto,
  BulkUserActionDto,
  AssignPermissionsDto,
  CreateAdminUserDto,
  UserDetailResponse,
} from "../dto/admin-users.dto";

const BCRYPT_ROUNDS = 12;
const IMPERSONATION_EXPIRY_MINUTES = 15;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Queries ─────────────────────────────────────────────────────────────────

  async findAll(query: QueryUsersDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.role) {
      const role = await this.prisma.role.findFirst({
        where: { name: query.role },
      });
      if (role) where.roleId = role.id;
    }
    if (query.excludeRole) {
      const excludeRole = await this.prisma.role.findFirst({
        where: { name: query.excludeRole },
      });
      if (excludeRole) where.roleId = { not: excludeRole.id };
    }
    if (query.status === "active") where.isActive = true;
    if (query.status === "inactive") where.isActive = false;
    if (query.department) {
      const dept = await this.prisma.department.findFirst({
        where: { name: query.department },
      });
      if (dept) {
        where.departments = { some: { departmentId: dept.id } };
      }
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          departments: { include: { department: true } },
          assignedRequests: {
            where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
          },
          managedProjects: {
            where: { status: { in: ["ACTIVE", "PLANNING"] } },
          },
          sessions: {
            where: { revokedAt: null, expiresAt: { gte: new Date() } },
          },
          _count: { select: { securityEvents: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.toResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserDetailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        departments: { include: { department: true } },
        permissions: { include: { permission: true } },
        assignedRequests: {
          where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
        },
        assignedTasks: {
          where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
        },
        managedProjects: {
          where: { status: { in: ["ACTIVE", "PLANNING"] } },
        },
        sessions: {
          where: { revokedAt: null, expiresAt: { gte: new Date() } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toResponse(user);
  }

  async getActivity(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.ledger.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPerformance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("المستخدم غير موجود");

    const workload = await this.prisma.staffWorkload.findUnique({
      where: { userId },
    });

    return {
      activeTasksCount: workload?.activeTasksCount ?? 0,
      workloadStatus: workload?.workloadStatus ?? "AVAILABLE",
      avgCompletionSpeedDays: workload?.avgCompletionSpeedDays ?? 0,
      avgQualityScore: workload?.avgQualityScore ?? 0,
    };
  }

  async getWork(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("المستخدم غير موجود");

    const [projects, tasks, disputes] = await Promise.all([
      this.prisma.project.findMany({
        where: { projectManagerId: userId },
        select: {
          id: true,
          name: true,
          status: true,
          client: { select: { companyName: true } },
        },
      }),
      this.prisma.task.findMany({
        where: { assignedTo: userId },
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { name: true } },
        },
      }),
      this.prisma.disputeTicket.findMany({
        where: { reviewedBy: userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
      }),
    ]);

    return {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        clientName: p.client?.companyName ?? "—",
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectName: t.project?.name ?? "—",
      })),
      disputes: disputes.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        priority: d.priority,
      })),
    };
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException("البريد الإلكتروني مستخدم بالفعل");
    }

    const role = await this.prisma.role.findFirst({
      where: { name: dto.role },
    });
    if (!role) {
      throw new BadRequestException("الدور غير موجود");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: role.id,
        phoneWhatsapp: dto.phoneWhatsapp ?? null,
        isActive: true,
      },
    });

    if (dto.department) {
      const dept = await this.prisma.department.findFirst({
        where: { name: dto.department },
      });
      if (dept) {
        await this.prisma.userDepartment.create({
          data: { userId: user.id, departmentId: dept.id },
        });
      }
    }

    await this.prisma.ledger.create({
      data: {
        action: "admin.users.create",
        entity: "user",
        entityId: user.id,
        after: { role: dto.role, department: dto.department },
      },
    });

    return { id: user.id, name: user.name, email: user.email, role: dto.role };
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  async bulkAction(dto: BulkUserActionDto) {
    const results = await this.prisma.$transaction(async (tx) => {
      const failed: string[] = [];
      let affected = 0;

      for (const userId of dto.userIds) {
        try {
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            failed.push(userId);
            continue;
          }

          switch (dto.action) {
            case "activate":
              await tx.user.update({
                where: { id: userId },
                data: { isActive: true },
              });
              break;

            case "deactivate":
              if (user.roleId === (await this.getAdminRoleId(tx))) {
                failed.push(userId);
                continue;
              }
              await tx.user.update({
                where: { id: userId },
                data: { isActive: false },
              });
              break;

            case "changeRole":
              if (!dto.value) {
                failed.push(userId);
                continue;
              }
              const newRole = await tx.role.findFirst({
                where: { name: dto.value as UserRole },
              });
              if (!newRole) {
                failed.push(userId);
                continue;
              }
              await tx.user.update({
                where: { id: userId },
                data: { roleId: newRole.id },
              });
              await tx.securityEvent.create({
                data: {
                  userId,
                  type: "ROLE_CHANGED",
                  metadata: { newRole: dto.value },
                },
              });
              break;

            case "reassignDepartment":
              if (!dto.value) {
                failed.push(userId);
                continue;
              }
              // Remove existing department assignments
              await tx.userDepartment.deleteMany({
                where: { userId },
              });
              // Assign new department
              const dept = await tx.department.findFirst({
                where: { name: dto.value },
              });
              if (dept) {
                await tx.userDepartment.create({
                  data: { userId, departmentId: dept.id },
                });
              }
              break;

            case "export":
              // Export is handled client-side; just validate users exist
              affected++;
              continue;
          }

          // Write audit log for each affected user
          await tx.ledger.create({
            data: {
              action: `admin.users.${dto.action}`,
              entity: "user",
              entityId: userId,
              after: { action: dto.action, value: dto.value },
            },
          });

          affected++;
        } catch {
          failed.push(userId);
        }
      }

      return { affected, failed };
    });

    return results;
  }

  async resetPassword(userId: string): Promise<{ temporaryPassword: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // Generate a secure random password
    const temporaryPassword = this.generatePassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      }),
      this.prisma.securityEvent.create({
        data: {
          userId,
          type: "PASSWORD_RESET",
          metadata: { triggeredBy: "admin" },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.users.reset-password",
          entity: "user",
          entityId: userId,
        },
      }),
    ]);

    return { temporaryPassword };
  }

  async impersonate(
    adminId: string,
    targetUserId: string,
    reason: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: adminId },
        include: { role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        include: { role: true },
      }),
    ]);

    if (!admin || !target) {
      throw new NotFoundException("User not found");
    }

    // Cannot impersonate another admin
    if (target.role.name === "ADMIN") {
      throw new ForbiddenException("Cannot impersonate another admin user");
    }

    // Cannot impersonate self
    if (adminId === targetUserId) {
      throw new BadRequestException("Cannot impersonate yourself");
    }

    // Create short-lived JWT with impersonation flag
    const expiresAt = new Date(
      Date.now() + IMPERSONATION_EXPIRY_MINUTES * 60 * 1000,
    );

    const token = this.jwtService.sign(
      {
        sub: targetUserId,
        id: targetUserId,
        name: target.name,
        email: target.email,
        role: target.role.name,
        impersonator: adminId,
        impersonatorName: admin.name,
        reason,
        type: "impersonation",
      },
      { expiresIn: `${IMPERSONATION_EXPIRY_MINUTES}m` },
    );

    // Write security event + audit log
    await this.prisma.$transaction([
      this.prisma.securityEvent.create({
        data: {
          userId: targetUserId,
          type: "IMPERSONATION",
          ip,
          userAgent,
          metadata: {
            impersonatorId: adminId,
            impersonatorName: admin.name,
            reason,
          },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.users.impersonate",
          entity: "user",
          entityId: targetUserId,
          userId: adminId,
          after: { impersonatedUser: targetUserId, reason },
        },
      }),
    ]);

    return { token, expiresAt: expiresAt.toISOString() };
  }

  async revokeSessions(userId: string): Promise<{ revokedCount: number }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    await this.prisma.$transaction([
      this.prisma.securityEvent.create({
        data: {
          userId,
          type: "SESSION_REVOKED",
          metadata: { triggeredBy: "admin", count: result.count },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.users.revoke-sessions",
          entity: "user",
          entityId: userId,
          after: { revokedCount: result.count },
        },
      }),
    ]);

    return { revokedCount: result.count };
  }

  async setPermissions(
    userId: string,
    dto: AssignPermissionsDto,
  ): Promise<{ permissionIds: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.$transaction(async (tx) => {
      // Remove all existing per-user permission grants
      await tx.userPermission.deleteMany({ where: { userId } });

      // Add new grants
      if (dto.permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            userId,
            permissionId,
          })),
        });
      }

      // Audit log
      await tx.ledger.create({
        data: {
          action: "admin.users.set-permissions",
          entity: "user",
          entityId: userId,
          after: { permissionIds: dto.permissionIds },
        },
      });
    });

    return { permissionIds: dto.permissionIds };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async getAdminRoleId(tx?: any): Promise<string> {
    const client = tx || this.prisma;
    const role = await client.role.findFirst({ where: { name: "ADMIN" } });
    return role?.id ?? "";
  }

  private generatePassword(): string {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private toResponse(user: any): UserDetailResponse {
    const roleName =
      user.role && typeof user.role === "object" ? user.role.name : user.roleId;

    const deptEntry =
      user.departments && user.departments.length > 0
        ? user.departments[0]
        : null;

    const activeSessions =
      user.sessions?.filter(
        (s: any) => !s.revokedAt && new Date(s.expiresAt) > new Date(),
      ).length ?? 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      isActive: user.isActive,
      department: deptEntry?.department?.name ?? null,
      phoneWhatsapp: user.phoneWhatsapp ?? null,
      avatarUrl: user.avatarUrl ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      activeRequestsCount: user.assignedRequests?.length ?? 0,
      activeTasksCount: user.assignedTasks?.length ?? 0,
      activeProjectsCount: user.managedProjects?.length ?? 0,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
