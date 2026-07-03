import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProjectStatus } from "@hassad/shared";

@Injectable()
export class AdminProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { client: { companyName: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.pmId) where.projectManagerId = query.pmId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.overdueOnly === "true") {
      where.tasks = {
        some: {
          dueDate: { lt: new Date() },
          status: { notIn: ["DONE", "REVISION"] },
        },
      };
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          manager: { select: { id: true, name: true } },
          tasks: {
            where: { dueDate: { lt: new Date() }, status: { notIn: ["DONE", "REVISION"] } },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p: any) => ({
        id: p.id,
        name: p.name,
        clientName: p.client?.companyName ?? "—",
        pmId: p.manager?.id ?? null,
        pmName: p.manager?.name ?? "—",
        status: p.status,
        completionPercentage: p.completionPercentage,
        overdueTasksCount: p.tasks?.length ?? 0,
        priority: p.priority,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.endDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        manager: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true, assignedTo: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        files: { select: { id: true, fileName: true, filePath: true, uploadedBy: true, uploadedAt: true } },
        meetings: { select: { id: true, title: true, scheduledAt: true, notes: true, createdBy: true } },
        periods: { select: { id: true, periodNumber: true, startDate: true, endDate: true, status: true, completionPercentage: true } },
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async reassignPm(projectId: string, pmUserId: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findUnique({ where: { id: pmUserId } }),
    ]);
    if (!project) throw new NotFoundException("Project not found");
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { projectManagerId: pmUserId },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.projects.reassign-pm",
          entity: "project",
          entityId: projectId,
          after: { previousPmId: project.projectManagerId, newPmId: pmUserId },
        },
      }),
    ]);
    return { success: true };
  }

  async archive(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Project not found");

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { isArchived: true, archivedAt: new Date() },
      }),
      this.prisma.ledger.create({
        data: { action: "admin.projects.archive", entity: "project", entityId: projectId },
      }),
    ]);
    return { success: true };
  }

  async forceStatus(projectId: string, status: ProjectStatus, reason: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Project not found");

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { status },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.projects.force-status",
          entity: "project",
          entityId: projectId,
          after: { previousStatus: project.status, newStatus: status, reason },
        },
      }),
    ]);
    return { success: true };
  }
}
