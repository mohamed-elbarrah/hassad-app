import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { UserRole } from "@hassad/shared";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";
import { ProjectFiltersDto } from "./dto/project-filters.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── findAll ────────────────────────────────────────────────────────────────

  async findAll(filters: ProjectFiltersDto, user: JwtPayload) {
    const where: Prisma.ProjectWhereInput = {};

    // PM can only see projects they manage
    if (user.role === UserRole.PM) {
      where.managerId = user.id;
    }

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          clientId: true,
          client: { select: { id: true, name: true } },
          contractId: true,
          managerId: true,
          manager: { select: { id: true, name: true } },
          status: true,
          progress: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── findOne ────────────────────────────────────────────────────────────────

  async findOne(id: string, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        contract: { select: { id: true, status: true, value: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dept: true,
            dueDate: true,
            assignedTo: true,
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);

    // PM can only view their own projects
    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return project;
  }

  // ─── create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto, user: JwtPayload) {
    // If PM is creating, enforce they can only assign themselves as manager
    const managerId = user.role === UserRole.PM ? user.id : dto.managerId;

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        clientId: dto.clientId,
        contractId: dto.contractId ?? null,
        managerId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: {
        client: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });
  }

  // ─── update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProjectDto, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.contractId !== undefined && { contractId: dto.contractId }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
      },
    });
  }

  // ─── updateStatus ────────────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    dto: UpdateProjectStatusDto,
    user: JwtPayload,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.prisma.project.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ─── remove ─────────────────────────────────────────────────────────────────

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);

    await this.prisma.project.delete({ where: { id } });
  }
}
