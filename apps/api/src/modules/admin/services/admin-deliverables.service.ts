import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminDeliverablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: {
    projectId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.deliverable.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { name: true } },
          approver: { select: { id: true, name: true } },
        },
      }),
      this.prisma.deliverable.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRevisionRequests(query: {
    deliverableId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (query.deliverableId) where.deliverableId = query.deliverableId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.clientRevisionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          deliverable: { select: { title: true } },
          client: { select: { companyName: true } },
        },
      }),
      this.prisma.clientRevisionRequest.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
