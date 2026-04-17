import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@hassad/shared";
import { TaskPriority } from "@hassad/shared";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── findAllByProject ────────────────────────────────────────────────────────

  async findAllByProject(projectId: string, user: JwtPayload) {
    // Verify the project exists and the caller has access to it
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, managerId: true },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dept: true,
        dueDate: true,
        description: true,
        assignedTo: true,
        assignee: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // ─── findOne ────────────────────────────────────────────────────────────────

  async findOne(id: string, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, managerId: true } },
      },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    // PM can only view tasks in their own projects
    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    // EMPLOYEE can only view tasks assigned to them
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    return task;
  }

  // ─── create ─────────────────────────────────────────────────────────────────

  async create(projectId: string, dto: CreateTaskDto, user: JwtPayload) {
    // Verify project exists and caller has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, managerId: true },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        projectId,
        assignedTo: dto.assignedTo,
        dept: dto.dept,
        priority: dto.priority ?? TaskPriority.NORMAL,
        dueDate: new Date(dto.dueDate),
        description: dto.description ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  // ─── update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTaskDto, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
        ...(dto.dept !== undefined && { dept: dto.dept }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // ─── updateStatus ────────────────────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    // PM can update status of tasks in their own projects
    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    // EMPLOYEE can only update status of tasks assigned to them
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only update status of your own tasks",
      );
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ─── remove ─────────────────────────────────────────────────────────────────

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    await this.prisma.task.delete({ where: { id } });
  }
}
