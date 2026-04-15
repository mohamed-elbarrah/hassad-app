import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PipelineStage as PrismaPipelineStage } from '@prisma/client';
import { UserRole, PipelineStage, PIPELINE_STAGE_ORDER } from '@hassad/shared';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientFiltersDto } from './dto/client-filters.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── findAll ────────────────────────────────────────────────────────────────

  async findAll(filters: ClientFiltersDto, user: JwtPayload) {
    const where: Prisma.ClientWhereInput = {};

    // SALES users can only see clients assigned to them
    if (user.role === UserRole.SALES) {
      where.assignedToId = user.id;
    }

    if (filters.status) where.status = filters.status;
    if (filters.stage) where.stage = filters.stage as PrismaPipelineStage;
    if (filters.search) {
      where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          source: true,
          status: true,
          stage: true,
          assignedToId: true,
          assignedTo: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── findOne ────────────────────────────────────────────────────────────────

  async findOne(id: string, user: JwtPayload) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        contracts: { select: { id: true, status: true, value: true } },
        projects: { select: { id: true, status: true, progress: true } },
      },
    });

    if (!client) throw new NotFoundException(`Client ${id} not found`);

    // SALES users may only view their own assigned clients
    if (user.role === UserRole.SALES && client.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have access to this client');
    }

    return client;
  }

  // ─── create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateClientDto, user: JwtPayload) {
    // For ADMIN: allow explicit assignedToId override (not in DTO — server-assigned)
    // For SALES: always self-assign
    const assignedToId = user.id;

    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: dto.name,
          email: dto.email ?? null,
          phone: dto.phone,
          businessType: dto.businessType,
          source: dto.source,
          status: 'LEAD',
          stage: 'NEW_LEAD',
          assignedToId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          source: true,
          status: true,
          stage: true,
          assignedToId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          userId: user.id,
          action: 'CLIENT_CREATED',
          details: `Client "${client.name}" created by user ${user.id}`,
        },
      });

      return client;
    });
  }

  // ─── update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateClientDto, user: JwtPayload) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Client ${id} not found`);

    // SALES can only update clients assigned to them
    if (user.role === UserRole.SALES && existing.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have access to this client');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.client.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.businessType !== undefined && { businessType: dto.businessType }),
          ...(dto.source !== undefined && { source: dto.source }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.stage !== undefined && { stage: dto.stage as PrismaPipelineStage }),
          ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          source: true,
          status: true,
          stage: true,
          assignedToId: true,
          updatedAt: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: id,
          userId: user.id,
          action: 'CLIENT_UPDATED',
          details: `Client updated by user ${user.id}`,
        },
      });

      return updated;
    });
  }

  // ─── updateStage ────────────────────────────────────────────────────────────

  /**
   * Transitions a client to a new pipeline stage.
   * Enforces forward-only progression through the defined 9-stage order.
   * ADMIN can skip stages; SALES can only advance one step at a time.
   */
  async updateStage(id: string, dto: UpdateStageDto, user: JwtPayload) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException(`Client ${id} not found`);

    if (user.role === UserRole.SALES && client.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have access to this client');
    }

    const currentIndex = PIPELINE_STAGE_ORDER.indexOf(client.stage as PipelineStage);
    const targetIndex = PIPELINE_STAGE_ORDER.indexOf(dto.stage);

    if (targetIndex === -1) {
      throw new BadRequestException(`Invalid pipeline stage: ${dto.stage}`);
    }

    // SALES may only advance forward (no backward movement)
    if (user.role === UserRole.SALES && targetIndex <= currentIndex) {
      throw new BadRequestException(
        'Sales users can only advance a client to a later pipeline stage',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.client.update({
        where: { id },
        data: { stage: dto.stage as PrismaPipelineStage },
        select: { id: true, stage: true, status: true, updatedAt: true },
      });

      await tx.clientActivity.create({
        data: {
          clientId: id,
          userId: user.id,
          action: 'STAGE_UPDATED',
          details: `Stage changed from ${client.stage} to ${dto.stage}`,
        },
      });

      return updated;
    });
  }
}
