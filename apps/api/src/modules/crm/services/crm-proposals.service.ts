import { Injectable } from "@nestjs/common";

import { ProposalStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";

import { CrmProposalsWorkspaceQueryDto } from "../dto/crm-proposals.dto";

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

@Injectable()
export class CrmProposalsService {
  constructor(private readonly prisma: PrismaService) {}

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
          lead: { select: { id: true, companyName: true } },
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
        clientName: item.client?.companyName ?? item.lead?.companyName ?? "—",
        requestName: item.request?.companyName ?? item.lead?.companyName ?? "—",
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
}
