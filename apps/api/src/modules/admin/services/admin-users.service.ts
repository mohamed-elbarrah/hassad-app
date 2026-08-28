import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../../auth/auth.service";
import { randomInt } from "node:crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { UserRole } from "@hassad/shared";
import {
  QueryUsersDto,
  BulkUserActionDto,
  AssignPermissionsDto,
  CreateAdminUserDto,
  UpdateUserDto,
  UserDetailResponse,
} from "../dto/admin-users.dto";

const BCRYPT_ROUNDS = 12;
const IMPERSONATION_EXPIRY_MINUTES = 15;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly actionLog: AdminActionLogService,
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
    if (query.roles) {
      const roleNames = query.roles.split(",").map((r) => r.trim()).filter(Boolean);
      const roles = await this.prisma.role.findMany({
        where: { name: { in: roleNames } },
      });
      const excludedRole = query.excludeRole
        ? await this.prisma.role.findFirst({ where: { name: query.excludeRole } })
        : null;
      const roleIds = roles
        .map((role) => role.id)
        .filter((roleId) => roleId !== excludedRole?.id);
      where.roleId = { in: roleIds };
    } else if (query.excludeRole) {
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
          assignedTasks: {
            where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
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
      throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    }

    return this.toResponse(user);
  }

  async getOverview(userId: string) {
    const profile = await this.findOne(userId);
    const role = profile.role;

    const [requests, proposals, contracts, projects, tasks, campaigns, invoices, securityEvents, disputes, activeSessions, workload] = await Promise.all([
      this.prisma.request.count({ where: { assignedSalesId: userId, status: { in: ["SUBMITTED", "QUALIFYING"] } } }),
      this.prisma.proposal.count({ where: { createdBy: userId } }),
      this.prisma.contract.count({ where: { createdBy: userId } }),
      this.prisma.project.count({ where: { projectManagerId: userId } }),
      this.prisma.task.count({ where: { assignedTo: userId } }),
      this.prisma.campaign.count({ where: { createdBy: userId } }),
      this.prisma.invoice.count({ where: { createdBy: userId } }),
      this.prisma.securityEvent.count({ where: { userId } }),
      this.prisma.disputeTicket.count({ where: { pmId: userId, status: { not: "CLOSED" } } }),
      this.prisma.session.count({ where: { userId, revokedAt: null, expiresAt: { gte: new Date() } } }),
      this.prisma.staffWorkload.findUnique({ where: { userId }, select: { avgQualityScore: true } }),
    ]);

    const activeTasks = await this.prisma.task.count({
      where: { assignedTo: userId, status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
    });
    const completedTasks = await this.prisma.task.count({ where: { assignedTo: userId, status: "DONE" } });
    const activeCampaigns = await this.prisma.campaign.count({ where: { createdBy: userId, status: "ACTIVE", isArchived: false } });
    const activeProjects = await this.prisma.project.count({ where: { projectManagerId: userId, status: { in: ["ACTIVE", "PLANNING"] } } });

    const roleMetrics: Record<string, Array<{ key: string; value: number; format: "number" }>> = {
      SALES: [
        { key: "ACTIVE_REQUESTS", value: requests, format: "number" },
        { key: "PROPOSALS_CREATED", value: proposals, format: "number" },
        { key: "CONTRACTS_CREATED", value: contracts, format: "number" },
        { key: "ACTIVE_TASKS", value: activeTasks, format: "number" },
      ],
      PM: [
        { key: "MANAGED_PROJECTS", value: projects, format: "number" },
        { key: "ACTIVE_PROJECTS", value: activeProjects, format: "number" },
        { key: "ACTIVE_TASKS", value: activeTasks, format: "number" },
        { key: "OPEN_DISPUTES", value: disputes, format: "number" },
      ],
      TEAM: [
        { key: "ASSIGNED_TASKS", value: tasks, format: "number" },
        { key: "ACTIVE_TASKS", value: activeTasks, format: "number" },
        { key: "COMPLETED_TASKS", value: completedTasks, format: "number" },
        { key: "QUALITY_SCORE", value: workload?.avgQualityScore ?? 0, format: "number" },
      ],
      MARKETING: [
        { key: "CAMPAIGNS_CREATED", value: campaigns, format: "number" },
        { key: "ACTIVE_CAMPAIGNS", value: activeCampaigns, format: "number" },
        { key: "MARKETING_TASKS", value: tasks, format: "number" },
        { key: "COMPLETED_TASKS", value: completedTasks, format: "number" },
      ],
      ACCOUNTANT: [
        { key: "INVOICES_CREATED", value: invoices, format: "number" },
        { key: "ACTIVE_TASKS", value: activeTasks, format: "number" },
        { key: "COMPLETED_TASKS", value: completedTasks, format: "number" },
        { key: "SECURITY_EVENTS", value: securityEvents, format: "number" },
      ],
      ADMIN: [
        { key: "MANAGED_USERS", value: await this.prisma.user.count(), format: "number" },
        { key: "ACTIVE_TASKS", value: activeTasks, format: "number" },
        { key: "SECURITY_EVENTS", value: securityEvents, format: "number" },
        { key: "ACTIVE_SESSIONS", value: activeSessions, format: "number" },
      ],
    };

    return {
      profile,
      kpis: roleMetrics[role] ?? roleMetrics.TEAM,
      performance: {
        sectionCode: `${role}_PERFORMANCE`,
        metrics: roleMetrics[role] ?? roleMetrics.TEAM,
      },
      work: await this.getWork(userId),
    };
  }

  async getPermissions(userId: string, adminId: string) {
    const [user, actor, permissions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, permissions: { select: { permissionId: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: adminId },
        include: {
          role: { include: { permissions: { select: { permissionId: true } } } },
          permissions: { select: { permissionId: true } },
        },
      }),
      this.prisma.permission.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    if (!actor) throw new ForbiddenException({ code: "PERMISSION_DENIED", details: {} });

    if (!actor.role) {
      throw new ForbiddenException({ code: "PERMISSION_DENIED", details: {} });
    }

    const canAssignPermissionIds =
      actor.role.name === "ADMIN"
        ? permissions.map(({ id }) => id)
        : [
            ...actor.role.permissions.map(({ permissionId }) => permissionId),
            ...actor.permissions.map(({ permissionId }) => permissionId),
          ];

    return {
      permissions,
      assignedPermissionIds: user.permissions.map(({ permissionId }) => permissionId),
      canAssignPermissionIds: [...new Set(canAssignPermissionIds)],
    };
  }

  async getActivity(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

  async getWorkspace(userId: string) {
    const [detail, performance, activity, work] = await Promise.all([
      this.findOne(userId),
      this.getPerformance(userId),
      this.getActivity(userId),
      this.getWork(userId),
    ]);
    return { detail, performance, activity, work };
  }

  async getPerformance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const [workload, tasksCompleted] = await Promise.all([
      this.prisma.staffWorkload.findUnique({ where: { userId } }),
      this.prisma.task.count({ where: { assignedTo: userId, status: "DONE" } }),
    ]);

    return {
      activeTasksCount: workload?.activeTasksCount ?? 0,
      workloadStatus: workload?.workloadStatus ?? "AVAILABLE",
      avgCompletionSpeedDays: workload?.avgCompletionSpeedDays ?? 0,
      avgQualityScore: workload?.avgQualityScore ?? 0,
      tasksCompleted,
    };
  }

  async getWork(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const [projects, tasks, disputes, campaigns] = await Promise.all([
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
      this.prisma.campaign.findMany({
        where: { createdBy: userId },
        select: {
          id: true,
          name: true,
          platform: true,
          status: true,
          startDate: true,
          endDate: true,
          client: { select: { companyName: true } },
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
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
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate?.toISOString() ?? null,
        clientName: campaign.client.companyName,
        projectName: campaign.project?.name ?? null,
      })),
    };
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException({ code: "EMAIL_ALREADY_IN_USE", details: {} });
    }

    const role = await this.prisma.role.findFirst({
      where: { name: dto.role },
    });
    if (!role) {
      throw new BadRequestException({ code: "ROLE_NOT_FOUND", details: { role: dto.role } });
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

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing)
        throw new BadRequestException({ code: "EMAIL_ALREADY_IN_USE", details: {} });
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phoneWhatsapp !== undefined) data.phoneWhatsapp = dto.phoneWhatsapp;
    if (dto.role !== undefined) {
      const role = await this.prisma.role.findFirst({
        where: { name: dto.role },
      });
      if (!role) {
        throw new BadRequestException({ code: "ROLE_NOT_FOUND", details: { role: dto.role } });
      }
      data.roleId = role.id;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        departments: { include: { department: true } },
      },
    });

    if (dto.department !== undefined || dto.role === UserRole.TEAM) {
      await this.prisma.userDepartment.deleteMany({ where: { userId: id } });
      if (dto.department) {
        const department = await this.prisma.department.findFirst({
          where: { name: dto.department },
        });
        if (department) {
          await this.prisma.userDepartment.create({
            data: { userId: id, departmentId: department.id },
          });
        }
      }
    }

    const refreshed = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        departments: { include: { department: true } },
      },
    });

    await this.prisma.ledger.create({
      data: {
        action: "admin.users.update",
        entity: "user",
        entityId: id,
        userId: user.id,
        before: { name: user.name, email: user.email },
        after: {
          name: dto.name,
          email: dto.email,
          phoneWhatsapp: dto.phoneWhatsapp,
          role: dto.role,
          department: dto.department,
        },
      },
    });

    return this.toResponse(refreshed ?? updated);
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
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

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
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
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
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
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
      throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    }

    if (!target.isActive) {
      throw new ForbiddenException({ code: "ACCOUNT_INACTIVE", details: {} });
    }
    if (
      target.suspendedAt &&
      (!target.suspendedUntil || target.suspendedUntil > new Date())
    ) {
      throw new ForbiddenException({ code: "ACCOUNT_SUSPENDED", details: {} });
    }

    // Cannot impersonate another admin
    if (target.role.name === "ADMIN") {
      throw new ForbiddenException({ code: "ADMIN_IMPERSONATION_NOT_ALLOWED", details: {} });
    }

    // Cannot impersonate self
    if (adminId === targetUserId) {
      throw new BadRequestException({ code: "SELF_IMPERSONATION_NOT_ALLOWED", details: {} });
    }

    // Impersonation is a normal sid-backed session, so it can be revoked and
    // carries its audit metadata through every authenticated request.
    const expiresAt = new Date(
      Date.now() + IMPERSONATION_EXPIRY_MINUTES * 60 * 1000,
    );
    const { accessToken, refreshToken } = await this.authService.createSessionTokens(
      {
        id: targetUserId,
        name: target.name,
        email: target.email,
        role: target.role.name as UserRole,
        impersonator: adminId,
        impersonatorName: admin.name,
        reason,
        type: "impersonation",
      },
      ip,
      userAgent,
      false,
      IMPERSONATION_EXPIRY_MINUTES * 60,
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

    return { accessToken, refreshToken, expiresAt };
  }

  async revokeSessions(userId: string, adminId: string): Promise<{ revokedCount: number }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0) {
      await this.prisma.$transaction([
        this.prisma.securityEvent.create({
          data: {
            userId,
            type: "SESSION_REVOKED",
            metadata: { triggeredBy: adminId, count: result.count },
          },
        }),
        this.prisma.ledger.create({
          data: {
            action: "admin.users.revoke-sessions",
            entity: "user",
            entityId: userId,
            userId: adminId,
            after: { revokedCount: result.count },
          },
        }),
      ]);
    }

    return { revokedCount: result.count };
  }

  async setPermissions(
    userId: string,
    dto: AssignPermissionsDto,
    adminId: string,
  ): Promise<{ permissionIds: string[] }> {
    if (userId === adminId) {
      throw new ForbiddenException({
        code: "SELF_PERMISSION_ESCALATION_NOT_ALLOWED",
        details: {},
      });
    }

    const [user, actor] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, permissions: { select: { permissionId: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: adminId },
        include: {
          role: { include: { permissions: { select: { permissionId: true } } } },
          permissions: { select: { permissionId: true } },
        },
      }),
    ]);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    if (!actor || !actor.role) throw new ForbiddenException({ code: "PERMISSION_DENIED", details: {} });

    const validPermissionIds = new Set(
      (
        await this.prisma.permission.findMany({
          where: { id: { in: dto.permissionIds } },
          select: { id: true },
        })
      ).map(({ id }) => id),
    );
    if (dto.permissionIds.some((permissionId) => !validPermissionIds.has(permissionId))) {
      throw new BadRequestException({
        code: "INVALID_PERMISSION_ID",
        details: {},
      });
    }

    const actorPermissionIds = new Set(
      actor.role.name === "ADMIN"
        ? (
            await this.prisma.permission.findMany({ select: { id: true } })
          ).map(({ id }) => id)
        : [
            ...actor.role.permissions.map(({ permissionId }) => permissionId),
            ...actor.permissions.map(({ permissionId }) => permissionId),
          ],
    );
    const existingPermissionIds = new Set(
      user.permissions.map(({ permissionId }) => permissionId),
    );
    const unauthorizedChanges = [
      ...dto.permissionIds.filter(
        (permissionId) =>
          !actorPermissionIds.has(permissionId) &&
          !existingPermissionIds.has(permissionId),
      ),
      ...[...existingPermissionIds].filter(
        (permissionId) =>
          !actorPermissionIds.has(permissionId) &&
          !dto.permissionIds.includes(permissionId),
      ),
    ];
    if (unauthorizedChanges.length > 0) {
      throw new ForbiddenException({
        code: "PERMISSION_ASSIGNMENT_NOT_ALLOWED",
        details: {},
      });
    }

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

      // Force re-authentication so removed permissions are not retained in stale sessions.
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Audit log
      await tx.ledger.create({
        data: {
          action: "admin.users.set-permissions",
          entity: "user",
          entityId: userId,
          userId: adminId,
          before: { permissionIds: [...existingPermissionIds] },
          after: { permissionIds: dto.permissionIds },
        },
      });
    });

    return { permissionIds: dto.permissionIds };
  }

  async suspend(
    userId: string,
    reason: string,
    adminId: string,
    suspendedUntil?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    if (
      user.suspendedAt &&
      (!user.suspendedUntil || user.suspendedUntil > new Date())
    )
      throw new BadRequestException({ code: "USER_ALREADY_SUSPENDED", details: {} });

    const before = { isActive: user.isActive, suspendedAt: user.suspendedAt };
    const after = { reason, suspendedUntil: suspendedUntil ?? null };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          suspendedAt: new Date(),
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
          suspendReason: reason,
          suspendedById: adminId,
        },
      }),
      this.prisma.securityEvent.create({
        data: {
          userId,
          type: "ACCOUNT_LOCKED",
          metadata: { reason, triggeredBy: adminId },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.users.suspend",
          entity: "user",
          entityId: userId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "user",
      targetId: userId,
      actionType: "admin.users.suspend",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { userId, status: "SUSPENDED" };
  }

  async reactivate(userId: string, reason: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });
    if (!user.suspendedAt) throw new BadRequestException({ code: "USER_NOT_SUSPENDED", details: {} });

    const before = {
      suspendedAt: user.suspendedAt,
      suspendReason: user.suspendReason,
    };
    const after = { reason };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          suspendedAt: null,
          suspendedUntil: null,
          suspendReason: null,
          suspendedById: null,
        },
      }),
      this.prisma.securityEvent.create({
        data: {
          userId,
          type: "ACCOUNT_UNLOCKED",
          metadata: { reason, triggeredBy: adminId },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.users.reactivate",
          entity: "user",
          entityId: userId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "user",
      targetId: userId,
      actionType: "admin.users.reactivate",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { userId, status: "ACTIVE" };
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
      password += chars.charAt(randomInt(chars.length));
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
