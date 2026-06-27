import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BusinessType, ClientStatus } from "@hassad/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { DirectConversationService } from "../chat/services/direct-conversation.service";
import { SalesAssignmentService } from "./sales-assignment.service";

type DbClient = Prisma.TransactionClient | PrismaService;

interface UpsertCanonicalClientParams {
  /**
   * The `User.id` that owns this client. Personal identity (name,
   * email, phone) lives on `User` — callers must write personal
   * identity via `PATCH /v1/users/:id` before/after calling this
   * service. This service is responsible for business fields only.
   */
  userId?: string | null;
  leadId?: string | null;
  companyName: string;
  businessName: string;
  businessType: any;
  preferredManagerId?: string | null;
  status?: ClientStatus;
}

@Injectable()
export class CanonicalClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly directConversationService: DirectConversationService,
    private readonly salesAssignmentService: SalesAssignmentService,
  ) {}

  private async findExistingClient(
    db: DbClient,
    params: UpsertCanonicalClientParams,
  ) {
    // Personal identity is no longer used to find/merge clients.
    // Clients are identified by their linked `User` (via `userId`)
    // or by a previous `Lead` (via `leadId`).
    const identityFilters: Prisma.ClientWhereInput[] = [];

    if (params.userId) {
      identityFilters.push({ userId: params.userId });
    }

    if (params.leadId) {
      identityFilters.push({ leadId: params.leadId });
    }

    let existingClient = identityFilters.length
      ? await db.client.findFirst({
          where: { OR: identityFilters },
          select: {
            id: true,
            userId: true,
            leadId: true,
            accountManager: true,
            companyName: true,
            businessName: true,
            businessType: true,
            status: true,
          },
        })
      : null;

    if (!existingClient) {
      // Fallback: match by business identity (company name) when no
      // user/lead link exists. This preserves the old "match by
      // company name" behavior for cases where a client was created
      // before a user was linked.
      existingClient = await db.client.findFirst({
        where: {
          companyName: params.companyName,
          businessName: params.businessName,
        },
        select: {
          id: true,
          userId: true,
          leadId: true,
          accountManager: true,
          companyName: true,
          businessName: true,
          businessType: true,
          status: true,
        },
      });
    }

    return existingClient;
  }

  private getNextStatus(currentStatus: any, desiredStatus?: any) {
    if (!desiredStatus || desiredStatus === currentStatus) {
      return null;
    }

    if (currentStatus === ClientStatus.ACTIVE) {
      return null;
    }

    if (
      currentStatus === ClientStatus.STOPPED &&
      desiredStatus === ClientStatus.LEAD
    ) {
      return null;
    }

    return desiredStatus;
  }

  async upsertCanonicalClient(
    db: DbClient,
    params: UpsertCanonicalClientParams,
  ) {
    const existingClient = await this.findExistingClient(db, params);

    const assignment = existingClient?.accountManager
      ? null
      : await this.salesAssignmentService.findBestSales(
          [params.preferredManagerId],
          existingClient?.id,
          db,
        );

    const accountManagerId =
      existingClient?.accountManager ?? assignment?.salesId ?? null;

    if (
      existingClient?.userId &&
      params.userId &&
      existingClient.userId !== params.userId
    ) {
      throw new ConflictException(
        "A client profile with this identity is already linked to another user",
      );
    }

    if (existingClient) {
      const updateData: Prisma.ClientUncheckedUpdateInput = {};

      if (!existingClient.userId && params.userId) {
        updateData.userId = params.userId;
      }

      if (!existingClient.leadId && params.leadId) {
        updateData.leadId = params.leadId;
      }

      if (!existingClient.accountManager && accountManagerId) {
        updateData.accountManager = accountManagerId;
      }

      if (
        existingClient.companyName === existingClient.businessName &&
        existingClient.companyName !== params.companyName
      ) {
        updateData.companyName = params.companyName;
      }

      if (
        (!existingClient.businessName ||
          existingClient.businessName === existingClient.companyName) &&
        existingClient.businessName !== params.businessName
      ) {
        updateData.businessName = params.businessName;
      }

      if (
        existingClient.businessType === BusinessType.OTHER &&
        params.businessType !== BusinessType.OTHER
      ) {
        updateData.businessType = params.businessType;
      }

      const nextStatus = this.getNextStatus(
        existingClient.status,
        params.status,
      );

      if (nextStatus) {
        updateData.status = nextStatus;
      }

      const client = Object.keys(updateData).length
        ? await db.client.update({
            where: { id: existingClient.id },
            data: updateData,
          })
        : await db.client.findUnique({ where: { id: existingClient.id } });

      if (!client) {
        throw new ConflictException("Unable to resolve canonical client");
      }

      if (client.accountManager && client.userId) {
        this.directConversationService
          .getOrCreate(client.userId, client.accountManager, db, {
            clientId: client.id,
          })
          .catch(() => undefined);
      }

      return { client, created: false };
    }

    const client = await db.client.create({
      data: {
        userId: params.userId ?? undefined,
        leadId: params.leadId ?? undefined,
        companyName: params.companyName,
        businessName: params.businessName,
        businessType: params.businessType,
        accountManager: accountManagerId ?? undefined,
        status: params.status ?? ClientStatus.LEAD,
      },
    });

    if (accountManagerId && client.userId) {
      this.directConversationService
        .getOrCreate(client.userId, accountManagerId, db, { clientId: client.id })
        .catch(() => undefined);
    }

    return { client, created: true };
  }
}