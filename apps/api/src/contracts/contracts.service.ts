import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, ContractStatus as PrismaContractStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientStatus,
  ContractStatus,
  PipelineStage,
  UserRole,
} from "@hassad/shared";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { ContractFiltersDto } from "./dto/contract-filters.dto";
import { SignContractDto } from "./dto/sign-contract.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ContractFiltersDto, user: JwtPayload) {
    const where: Prisma.ContractWhereInput = {};
    const and: Prisma.ContractWhereInput[] = [];

    if (filters.status) where.status = filters.status as PrismaContractStatus;
    if (filters.clientId) where.clientId = filters.clientId;

    if (user.role === UserRole.SALES) {
      and.push({ client: { assignedToId: user.id } });
    }

    if (filters.search) {
      and.push({
        client: { name: { contains: filters.search, mode: "insensitive" } },
      });
    }

    if (and.length > 0) where.AND = and;

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        select: {
          id: true,
          clientId: true,
          services: true,
          startDate: true,
          endDate: true,
          value: true,
          status: true,
          fileUrl: true,
          sentAt: true,
          signedAt: true,
          signedByName: true,
          signedByEmail: true,
          signatureUrl: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      contract.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this contract");
    }

    return contract;
  }

  async create(dto: CreateContractDto, user: JwtPayload) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true, name: true, assignedToId: true },
    });

    if (!client) throw new NotFoundException("Client not found");

    if (user.role === UserRole.SALES && client.assignedToId !== user.id) {
      throw new ForbiddenException("You do not have access to this client");
    }

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          clientId: dto.clientId,
          services: dto.services as Prisma.InputJsonValue,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          value: dto.value,
          fileUrl: dto.fileUrl ?? null,
          status: ContractStatus.DRAFT,
        },
        select: {
          id: true,
          clientId: true,
          status: true,
          value: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          userId: user.id,
          action: "CONTRACT_CREATED",
          details: `Contract created for ${client.name}`,
          metadata: { contractId: contract.id } as Prisma.InputJsonValue,
        },
      });

      return contract;
    });
  }

  async update(id: string, dto: UpdateContractDto, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { client: { select: { assignedToId: true } } },
    });

    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      contract.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this contract");
    }

    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException("Signed contracts cannot be edited");
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(dto.services && {
          services: dto.services as Prisma.InputJsonValue,
        }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl ?? null }),
      },
      select: {
        id: true,
        status: true,
        value: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
      },
    });
  }

  async send(id: string, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      contract.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this contract");
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException("Only draft contracts can be sent");
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: { status: ContractStatus.SENT, sentAt: now },
        select: {
          id: true,
          status: true,
          sentAt: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: contract.clientId,
          userId: user.id,
          action: "CONTRACT_SENT",
          details: `Contract sent to ${contract.client.name}`,
          metadata: { contractId: contract.id } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async sign(id: string, dto: SignContractDto, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      contract.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this contract");
    }

    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException("Contract is already signed");
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.SIGNED,
          signedAt: now,
          signedByName: dto.signedByName,
          signedByEmail: dto.signedByEmail ?? null,
          signatureUrl: dto.signatureUrl ?? null,
        },
        select: {
          id: true,
          status: true,
          signedAt: true,
          signedByName: true,
        },
      });

      await tx.client.update({
        where: { id: contract.clientId },
        data: {
          status: ClientStatus.ACTIVE,
          stage: PipelineStage.CONTRACT_SIGNED,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: contract.clientId,
          userId: user.id,
          action: "CONTRACT_SIGNED",
          details: `Contract signed for ${contract.client.name}`,
          metadata: { contractId: contract.id } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }
}
