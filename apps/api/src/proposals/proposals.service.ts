import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, ProposalStatus as PrismaProposalStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PipelineStage, ProposalStatus, UserRole } from "@hassad/shared";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { ProposalFiltersDto } from "./dto/proposal-filters.dto";
import { ProposalResponseDto } from "./dto/proposal-response.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";
import { randomBytes } from "crypto";

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProposalFiltersDto, user: JwtPayload) {
    const where: Prisma.ProposalWhereInput = {};
    const and: Prisma.ProposalWhereInput[] = [];

    if (filters.status) where.status = filters.status as PrismaProposalStatus;
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
      this.prisma.proposal.findMany({
        where,
        select: {
          id: true,
          clientId: true,
          services: true,
          price: true,
          startDate: true,
          status: true,
          shareToken: true,
          sentAt: true,
          approvedAt: true,
          revisionNotes: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: JwtPayload) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      proposal.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this proposal");
    }

    return proposal;
  }

  async create(dto: CreateProposalDto, user: JwtPayload) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true, name: true, assignedToId: true },
    });

    if (!client) throw new NotFoundException("Client not found");

    if (user.role === UserRole.SALES && client.assignedToId !== user.id) {
      throw new ForbiddenException("You do not have access to this client");
    }

    return this.prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          clientId: dto.clientId,
          services: dto.services as Prisma.InputJsonValue,
          price: dto.price,
          startDate: new Date(dto.startDate),
          notes: dto.notes ?? null,
          status: ProposalStatus.DRAFT,
        },
        select: {
          id: true,
          clientId: true,
          status: true,
          price: true,
          startDate: true,
          createdAt: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          userId: user.id,
          action: "PROPOSAL_CREATED",
          details: `Proposal created for ${client.name}`,
          metadata: { proposalId: proposal.id } as Prisma.InputJsonValue,
        },
      });

      return proposal;
    });
  }

  async update(id: string, dto: UpdateProposalDto, user: JwtPayload) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { client: { select: { assignedToId: true } } },
    });

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      proposal.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this proposal");
    }

    if (
      proposal.status !== ProposalStatus.DRAFT &&
      proposal.status !== ProposalStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        "Only draft or revision-requested proposals can be edited",
      );
    }

    return this.prisma.proposal.update({
      where: { id },
      data: {
        ...(dto.services && {
          services: dto.services as Prisma.InputJsonValue,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
      },
      select: {
        id: true,
        clientId: true,
        status: true,
        price: true,
        startDate: true,
        updatedAt: true,
      },
    });
  }

  async send(id: string, user: JwtPayload) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === UserRole.SALES &&
      proposal.client.assignedToId !== user.id
    ) {
      throw new ForbiddenException("You do not have access to this proposal");
    }

    if (
      proposal.status !== ProposalStatus.DRAFT &&
      proposal.status !== ProposalStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        "Only draft or revised proposals can be sent",
      );
    }

    const shareToken = proposal.shareToken ?? randomBytes(16).toString("hex");
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id },
        data: {
          status: ProposalStatus.SENT,
          shareToken,
          sentAt: now,
        },
        select: {
          id: true,
          status: true,
          shareToken: true,
          sentAt: true,
        },
      });

      await tx.client.update({
        where: { id: proposal.clientId },
        data: { stage: PipelineStage.PROPOSAL },
      });

      await tx.clientActivity.create({
        data: {
          clientId: proposal.clientId,
          userId: user.id,
          action: "PROPOSAL_SENT",
          details: `Proposal sent to ${proposal.client.name}`,
          metadata: { proposalId: proposal.id } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async getByShareToken(token: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        clientId: true,
        services: true,
        price: true,
        startDate: true,
        notes: true,
        status: true,
        sentAt: true,
        client: { select: { id: true, name: true } },
      },
    });

    if (!proposal) throw new NotFoundException("Proposal not found");

    return proposal;
  }

  async approveByShareToken(token: string, dto: ProposalResponseDto) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        clientId: true,
        status: true,
        client: { select: { assignedToId: true } },
      },
    });

    if (!proposal) throw new NotFoundException("Proposal not found");

    if (
      proposal.status !== ProposalStatus.SENT &&
      proposal.status !== ProposalStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        "Proposal cannot be approved at this stage",
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id: proposal.id },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: now,
          revisionNotes: dto.notes ?? null,
        },
        select: {
          id: true,
          status: true,
          approvedAt: true,
        },
      });

      await tx.client.update({
        where: { id: proposal.clientId },
        data: { stage: PipelineStage.APPROVAL },
      });

      await tx.clientActivity.create({
        data: {
          clientId: proposal.clientId,
          userId: proposal.client.assignedToId,
          action: "PROPOSAL_APPROVED",
          details: "Proposal approved by client",
          metadata: {
            proposalId: proposal.id,
            byClient: true,
          } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async requestRevisionByShareToken(token: string, dto: ProposalResponseDto) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        clientId: true,
        status: true,
        client: { select: { assignedToId: true } },
      },
    });

    if (!proposal) throw new NotFoundException("Proposal not found");

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException(
        "Proposal cannot be moved to revision at this stage",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id: proposal.id },
        data: {
          status: ProposalStatus.REVISION_REQUESTED,
          revisionNotes: dto.notes ?? null,
        },
        select: {
          id: true,
          status: true,
          revisionNotes: true,
        },
      });

      await tx.clientActivity.create({
        data: {
          clientId: proposal.clientId,
          userId: proposal.client.assignedToId,
          action: "PROPOSAL_REVISION_REQUESTED",
          details: "Client requested proposal revision",
          metadata: {
            proposalId: proposal.id,
            byClient: true,
          } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }
}
