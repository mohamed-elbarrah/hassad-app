import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProposalStatus, RequestStatus } from "@hassad/shared";
import { randomBytes } from "crypto";

import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RequestsService } from "../../requests/requests.service";
import {
  CrmCreateProposalDto,
  CrmProposalsWorkspaceQueryDto,
  CrmUpdateProposalDto,
} from "../dto/crm-proposals.dto";

type CrmProposalRow = {
  id: string;
  title: string;
  clientName: string;
  requestName: string;
  servicesCount: number;
  servicesLabel: string;
  totalValue: number;
  status: ProposalStatus;
  statusTone: "success" | "warning" | "neutral" | "active" | "attention" | "destructive";
  sentAtLabel: string;
  sentDaysAgo: number;
  responseLabel: string;
  validUntilLabel: string;
  validityDaysLeft: number;
  validityTone: "success" | "warning" | "neutral" | "active" | "attention" | "destructive";
  contractLabel: string;
  contractTone: "success" | "warning" | "neutral" | "active" | "attention" | "destructive";
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function mapStatusTone(status: ProposalStatus): CrmProposalRow["statusTone"] {
  if (status === ProposalStatus.APPROVED) return "success";
  if (status === ProposalStatus.REJECTED) return "destructive";
  if (status === ProposalStatus.REVISION_REQUESTED) return "attention";
  if (status === ProposalStatus.SENT) return "warning";
  return "neutral";
}

function mapValidityTone(daysLeft: number, validUntil: Date | null): CrmProposalRow["validityTone"] {
  if (!validUntil) return "neutral";
  if (daysLeft < 0) return "destructive";
  if (daysLeft <= 7) return "warning";
  return "success";
}

function buildToast(type: "success" | "error" | "info" | "warning" | "loading", title: string, description?: string) {
  return { type, title, description };
}

@Injectable()
export class CrmProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly requestsService: RequestsService,
  ) {}

  async findAll(filters: CrmProposalsWorkspaceQueryDto) {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { contactEmail: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const now = new Date();

    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, companyName: true } },
          request: {
            select: {
              id: true,
              companyName: true,
              services: {
                include: {
                  service: { select: { id: true, name: true } },
                },
              },
            },
          },
          contract: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    const rows: CrmProposalRow[] = items.map((item) => {
      const serviceNames =
        item.request?.services
          ?.map((service) => service.service?.name)
          .filter((value): value is string => Boolean(value)) ?? [];
      const sentAt = item.sentAt ? new Date(item.sentAt) : null;
      const validUntil = sentAt
        ? new Date(sentAt.getTime() + (item.offerValidityDays ?? 30) * 86400000)
        : null;
      const validityDaysLeft = validUntil
        ? Math.ceil((validUntil.getTime() - now.getTime()) / 86400000)
        : 999;

      return {
        id: item.id,
        title: item.title ?? "Proposal",
        clientName: item.client?.companyName ?? item.request?.companyName ?? "—",
        requestName: item.request?.companyName ?? "—",
        servicesCount: serviceNames.length,
        servicesLabel: serviceNames.join(", "),
        totalValue: item.totalPrice ?? 0,
        status: item.status as ProposalStatus,
        statusTone: mapStatusTone(item.status as ProposalStatus),
        sentAtLabel: sentAt
          ? `Sent ${Math.max(0, Math.floor((now.getTime() - sentAt.getTime()) / 86400000))}d ago`
          : "Not sent",
        sentDaysAgo: sentAt ? Math.max(0, Math.floor((now.getTime() - sentAt.getTime()) / 86400000)) : 0,
        responseLabel: String(item.status).replaceAll("_", " "),
        validUntilLabel: validUntil ? `Valid until ${formatDate(validUntil)}` : "Validity not started",
        validityDaysLeft,
        validityTone: mapValidityTone(validityDaysLeft, validUntil),
        contractLabel: item.contract ? "Linked to contract" : "Not created",
        contractTone: item.contract ? "success" : "neutral",
      };
    });

    return { items: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        creator: { select: { id: true, name: true, email: true } },
        request: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
            services: { include: { service: true } },
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    const contract = await this.prisma.contract.findFirst({
      where: { proposalId: id },
      select: { id: true, title: true, status: true },
    });

    return { ...proposal, contract };
  }

  async create(userId: string, dto: CrmCreateProposalDto) {
    if (!dto.requestId) {
      throw new BadRequestException("A request reference is required");
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const proposal = await this.prisma.$transaction(async (tx) => {
      const request = await this.requestsService.resolveRequestContext(
        { requestId: dto.requestId },
        userId,
        tx,
      );

      return tx.proposal.create({
        data: {
          requestId: request.id,
          clientId: request.clientId,
          createdBy: userId,
          title: dto.title,
          serviceDescription: dto.serviceDescription ?? "",
          servicesList: (dto.servicesList ?? []) as any,
          totalPrice: dto.totalPrice ?? 0,
          durationDays: dto.durationDays ?? 0,
          durationUnit: dto.durationUnit ?? "DAYS",
          platforms: dto.platforms ?? [],
          filePath: dto.filePath ?? null,
          contactName: dto.contactName || creator?.name || "",
          contactEmail: dto.contactEmail || creator?.email || "",
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          offerValidityDays: dto.offerValidityDays ?? 30,
          status: ProposalStatus.DRAFT,
        },
      });
    });

    return {
      proposal,
      toast: buildToast("success", "Proposal draft created", "Save your changes or send it when ready."),
    };
  }

  async update(id: string, dto: CrmUpdateProposalDto & { filePath?: string | null }) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });

    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: {
        title: dto.title,
        serviceDescription: dto.serviceDescription,
        servicesList: dto.servicesList as any,
        totalPrice: dto.totalPrice,
        durationDays: dto.durationDays,
        durationUnit: dto.durationUnit,
        platforms: dto.platforms,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        filePath: dto.filePath,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        offerValidityDays: dto.offerValidityDays,
      },
    });

    return {
      proposal: updated,
      toast: buildToast("success", "Proposal updated", "The commercial draft has been saved."),
    };
  }

  async send(id: string, userId?: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      select: { id: true, title: true, requestId: true, createdBy: true },
    });

    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    const token = randomBytes(32).toString("hex");

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.proposal.update({
        where: { id },
        data: {
          status: ProposalStatus.SENT,
          shareLinkToken: token,
          sentAt: new Date(),
        },
      });

      if (proposal.requestId) {
        const request = await this.requestsService.resolveRequestContext(
          { requestId: proposal.requestId },
          userId ?? proposal.createdBy,
          tx,
        );

        await this.requestsService.updateStatus(
          request.id,
          RequestStatus.PROPOSAL_SENT,
          userId ?? proposal.createdBy,
          undefined,
          tx,
        );
      }

      return result;
    });

    const recipientId = await this.prisma.request.findUnique({
      where: { id: proposal.requestId ?? "" },
      select: { client: { select: { userId: true } }, submittedBy: true },
    }).then((request) => request?.client?.userId ?? request?.submittedBy ?? null).catch(() => null);

    if (recipientId) {
      this.notificationsService
        .createNotification({
          entityId: token,
          entityType: "proposal",
          eventType: "PROPOSAL_SENT",
          userId: recipientId,
          title: "New proposal is ready",
          body: `A new proposal titled "${proposal.title}" was sent for review.`,
        })
        .catch(() => undefined);
    }

    return {
      proposal: updated,
      toast: buildToast("success", "Proposal sent", "The proposal link has been generated and shared."),
    };
  }
}
