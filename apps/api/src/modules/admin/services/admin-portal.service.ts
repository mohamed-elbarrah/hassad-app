import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class AdminPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalClients,
      activeClients,
      pendingApprovals,
      pendingRevisions,
      unsubmittedIntakeForms,
      snoozedItems,
      activeTokens,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({
        where: { user: { lastLoginAt: { gte: thirtyDaysAgo } } },
      }),
      this.prisma.deliverable.count({
        where: { status: "IN_REVIEW" },
      }),
      this.prisma.clientRevisionRequest.count({
        where: { status: "TODO" },
      }),
      this.prisma.portalIntakeForm.count({
        where: { isSubmitted: false },
      }),
      this.prisma.clientSnoozedItem.count(),
      this.prisma.client.count({
        where: { portalAccessToken: { not: null } },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      idleClients: totalClients - activeClients,
      pendingApprovals,
      pendingRevisions,
      unsubmittedIntakeForms,
      snoozedItemsCount: snoozedItems,
      activeTokens,
    };
  }

  async findClients(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: "insensitive" } },
        { businessName: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.hasPortalAccess === "true") where.portalAccessToken = { not: null };
    if (query.hasPortalAccess === "false") where.portalAccessToken = null;

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { lastLoginAt: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        companyName: c.companyName,
        contactName: c.businessName,
        status: c.status,
        hasPortalAccess: !!c.portalAccessToken,
        lastLoginAt: c.user?.lastLoginAt?.toISOString() ?? null,
        intakeCompleted: c.intakeCompleted,
        pendingApprovalsCount: 0,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async regeneratePortalToken(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException("Client not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        portalAccessToken: token,
        portalTokenExpiresAt: expiresAt,
      },
    });

    return { token, expiresAt: expiresAt.toISOString() };
  }
}
