import { Injectable, NotFoundException } from "@nestjs/common";
import { ContractStatus } from "@hassad/shared";
import { PrismaService } from "../../prisma/prisma.service";

const SIGNED_CONTRACT_STATUSES = [
  ContractStatus.SIGNED,
  ContractStatus.ACTIVE,
  ContractStatus.ON_HOLD,
  ContractStatus.COMPLETED,
  ContractStatus.EXPIRED,
];

@Injectable()
export class SalesClientInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async getByClientId(id: string) {
    const [client, signedContractValue] = await Promise.all([
      this.prisma.client.findUnique({
        where: { id },
        select: {
          id: true,
          companyName: true,
          businessName: true,
          businessType: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          portalAccessToken: true,
          intakeCompleted: true,
          totalProjects: true,
          activeProjects: true,
          completedProjects: true,
          totalContractValue: true,
          totalInvoiced: true,
          totalPaid: true,
          avgSatisfactionScore: true,
          manager: { select: { id: true, name: true } },
          profile: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneWhatsapp: true,
              avatarUrl: true,
              lastLoginAt: true,
              lastSeenAt: true,
            },
          },
          requests: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { source: true },
          },
          _count: {
            select: {
              contracts: true,
              projects: true,
              invoices: true,
              payments: true,
              proposals: true,
              requests: true,
            },
          },
        },
      }),
      this.prisma.contract.aggregate({
        where: { clientId: id, status: { in: SIGNED_CONTRACT_STATUSES } },
        _sum: { totalValue: true },
      }),
    ]);

    if (!client) {
      throw new NotFoundException({ code: "CLIENT_NOT_FOUND", details: { id } });
    }

    const { portalAccessToken, requests, _count, user, ...clientData } = client;

    return {
      ...clientData,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneWhatsapp: user.phoneWhatsapp,
            avatarUrl: user.avatarUrl,
          }
        : null,
      source: requests[0]?.source ?? null,
      hasPortalAccess: Boolean(portalAccessToken),
      lastLoginAt: user?.lastLoginAt?.toISOString() ?? null,
      lastSeenAt: user?.lastSeenAt?.toISOString() ?? null,
      signedContractValue: signedContractValue._sum.totalValue ?? 0,
      counters: _count,
    };
  }
}
