import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminTasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { project: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.assigneeId) where.assignedTo = query.assigneeId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.department) where.departmentId = query.department;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.overdueOnly === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ["DONE", "REVISION"] };
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: { select: { name: true } },
          assignee: { select: { id: true, name: true } },
          department: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        projectName: t.project?.name ?? "—",
        assigneeId: t.assignedTo ?? null,
        assigneeName: t.assignee?.name ?? "—",
        department: t.department?.name ?? null,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        isOverdue:
          t.dueDate &&
          t.dueDate < new Date() &&
          !["DONE", "REVISION"].includes(t.status),
        revisionCount: t.revisionCount,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        department: { select: { name: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        files: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async reassign(taskId: string, assigneeId: string) {
    const [task, user] = await Promise.all([
      this.prisma.task.findUnique({ where: { id: taskId } }),
      this.prisma.user.findUnique({ where: { id: assigneeId } }),
    ]);
    if (!task) throw new NotFoundException("Task not found");
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id: taskId },
        data: { assignedTo: assigneeId },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.tasks.reassign",
          entity: "task",
          entityId: taskId,
          after: { previousAssignee: task.assignedTo, newAssignee: assigneeId },
        },
      }),
    ]);
    return { success: true };
  }

  async forceTransition(taskId: string, status: any, reason: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");

    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id: taskId }, data: { status } }),
      this.prisma.taskStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: status,
          changedBy: "admin",
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.tasks.force-transition",
          entity: "task",
          entityId: taskId,
          after: { previousStatus: task.status, newStatus: status, reason },
        },
      }),
    ]);
    return { success: true };
  }
}
