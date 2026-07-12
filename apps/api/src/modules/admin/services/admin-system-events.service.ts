import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminSystemEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    eventType: string;
    source: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.systemEventLog.create({
      data: {
        eventType: data.eventType as any,
        source: data.source,
        message: data.message,
        metadata: data.metadata ?? {},
        status: "OPEN",
      },
    });
  }

  async findAll(filters: {
    eventType?: string;
    status?: string;
    source?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.systemEventLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          resolver: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.systemEventLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats() {
    const [
      totalEvents,
      openCount,
      byType,
      recentFailures,
    ] = await Promise.all([
      this.prisma.systemEventLog.count(),
      this.prisma.systemEventLog.count({ where: { status: "OPEN" } }),
      this.prisma.systemEventLog.groupBy({
        by: ["eventType"],
        _count: { id: true },
        where: { status: "OPEN" },
      }),
      this.prisma.systemEventLog.findMany({
        where: {
          OR: [
            { status: "OPEN" },
            { status: "ACKNOWLEDGED" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          eventType: true,
          source: true,
          message: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalEvents,
      openCount,
      acknowledgedCount: 0,
      resolvedCount: 0,
      byType: byType.map((t) => ({
        eventType: t.eventType,
        count: t._count.id,
      })),
      recentFailures,
    };
  }

  async resolve(id: string, resolvedBy: string) {
    const event = await this.prisma.systemEventLog.findUnique({
      where: { id },
    });
    if (!event) throw new Error("System event not found");

    return this.prisma.systemEventLog.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }
}
