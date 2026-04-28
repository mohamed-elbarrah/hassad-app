import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { UserRole, TaskDepartment } from '@hassad/shared';

const BCRYPT_ROUNDS = 12;

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  department?: TaskDepartment;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async resolveRoleId(roleName: UserRole): Promise<string> {
    const role = await this.prisma.role.findFirst({
      where: { name: roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role "${roleName}" not found`);
    }
    return role.id;
  }

  private async resolveDepartmentId(
    deptName: TaskDepartment,
  ): Promise<string> {
    const dept = await this.prisma.department.findFirst({
      where: { name: deptName },
    });
    if (!dept) {
      throw new BadRequestException(`Department "${deptName}" not found`);
    }
    return dept.id;
  }

  /** Normalise a raw Prisma user row into a safe API shape. */
  private normalise(user: any) {
    // role may be a full object (when included) or a string id
    const roleName =
      user.role && typeof user.role === 'object'
        ? (user.role.name as string)
        : (user.roleId as string);

    // department: first entry in departments relation (if loaded)
    const deptEntry =
      user.departments && user.departments.length > 0
        ? user.departments[0]
        : null;
    const department = deptEntry?.department?.name ?? null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      isActive: user.isActive,
      department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const roleId = await this.resolveRoleId(dto.role);

    const user = await this.prisma.user.create({
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

    // Assign department if provided
    if (dto.department) {
      const deptId = await this.resolveDepartmentId(dto.department);
      await this.prisma.userDepartment.create({
        data: { userId: user.id, departmentId: deptId },
      });
      // Re-fetch to get department in response
      const updated = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { role: true, departments: { include: { department: true } } },
      });
      return this.normalise(updated);
    }

    return this.normalise(user);
  }

  async findAll(filters: UserListFilters = {}) {
    const { search, role, department, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
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
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          departments: { include: { department: true } },
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
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.normalise(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    if (dto.role) {
      data.roleId = await this.resolveRoleId(dto.role);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        departments: { include: { department: true } },
      },
    });

    // Handle department update
    if (dto.department !== undefined) {
      // Remove all existing dept assignments
      await this.prisma.userDepartment.deleteMany({ where: { userId: id } });

      if (dto.department !== null) {
        const deptId = await this.resolveDepartmentId(dto.department);
        await this.prisma.userDepartment.create({
          data: { userId: id, departmentId: deptId },
        });
      }

      const updated = await this.prisma.user.findUnique({
        where: { id },
        include: { role: true, departments: { include: { department: true } } },
      });
      return this.normalise(updated);
    }

    return this.normalise(user);
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { role: true, departments: { include: { department: true } } },
    });
    return this.normalise(user);
  }

  async reactivate(id: string) {
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
    ] = await Promise.all([
      this.prisma.client.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count({
        where: { status: { in: ['ACTIVE', 'PLANNING'] } },
      }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: { status: { in: ['DUE', 'SENT'] } },
      }),
    ]);

    return {
      activeClients,
      activeProjects,
      overdueTasks,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      unpaidInvoicesCount,
      satisfactionRate: 92,
    };
  }
}
