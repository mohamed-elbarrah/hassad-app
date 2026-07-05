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
    if (query.hasPortalAccess === "true")
      where.portalAccessToken = { not: null };
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

  async getIntakeForms(query: {
    clientId?: string;
    isSubmitted?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.isSubmitted === "true") where.isSubmitted = true;
    if (query.isSubmitted === "false") where.isSubmitted = false;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.portalIntakeForm.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: {
              companyName: true,
              businessName: true,
            },
          },
        },
      }),
      this.prisma.portalIntakeForm.count({ where }),
    ]);

    return {
      items: items.map((f) => ({
        id: f.id,
        clientId: f.clientId,
        companyName:
          (f.client as any)?.companyName ?? (f.client as any)?.businessName ?? "—",
        token: f.token,
        currentStep: f.currentStep,
        isSubmitted: f.isSubmitted,
        submittedAt: f.submittedAt?.toISOString() ?? null,
        createdAt: f.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async regeneratePortalToken(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
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
