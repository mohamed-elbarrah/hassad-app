import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, HandoverClientDto } from '../dto/client.dto';
import { ClientStatus, ProjectStatus, TaskPriority } from '@hassad/shared';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        ...dto,
        status: ClientStatus.ACTIVE,
      },
    });

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId: client.id,
        userId,
        eventType: 'CLIENT_CREATED',
        description: 'Client created directly (no lead conversion)',
      },
    });

    return client;
  }

  async findAll(filters: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { manager: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        manager: true,
        contracts: true,
        projects: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, userId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId: id,
        userId,
        eventType: 'CLIENT_UPDATED',
        description: 'Client record updated',
      },
    });

    return client;
  }

  async getActivity(id: string) {
    return this.prisma.clientHistoryLog.findMany({
      where: { clientId: id },
      include: {
        user: true,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async handover(id: string, userId: string, dto: HandoverClientDto) {
    const client = await this.findOne(id);

    const project = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          clientId: id,
          projectManagerId: dto.managerId,
          name: dto.projectName,
          status: ProjectStatus.PLANNING,
          priority: TaskPriority.NORMAL,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: id,
          userId,
          eventType: 'CLIENT_HANDOVER',
          description: `Client handed over to PM. Project "${dto.projectName}" created.`,
          metadata: { projectId: project.id },
        },
      });

      return project;
    });

    return { client, project };
  }
}
