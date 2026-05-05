import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BusinessType, ClientStatus, UserRole } from "@hassad/shared";
import { PrismaService } from "../../prisma/prisma.service";

type DbClient = Prisma.TransactionClient | PrismaService;

const PLACEHOLDER_PHONE = "00000000000";

interface UpsertCanonicalClientParams {
  userId?: string | null;
  leadId?: string | null;
  email?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  businessName: string;
  businessType: any;
  preferredManagerId?: string | null;
  status?: ClientStatus;
}

@Injectable()
export class CanonicalClientService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(email?: string | null) {
    const normalized = email?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  private hasUsablePhone(phoneWhatsapp: string) {
    return !!phoneWhatsapp && phoneWhatsapp !== PLACEHOLDER_PHONE;
  }

  private async resolveAccountManager(
    db: DbClient,
    preferredIds: Array<string | null | undefined>,
  ) {
    const uniquePreferredIds = [
      ...new Set(preferredIds.filter(Boolean)),
    ] as string[];

    if (uniquePreferredIds.length > 0) {
      const preferredUsers = await db.user.findMany({
        where: {
          id: { in: uniquePreferredIds },
          isActive: true,
          role: { name: { in: [UserRole.SALES, UserRole.ADMIN] } },
        },
        select: { id: true },
      });

      if (preferredUsers.length > 0) {
        return preferredUsers[0].id;
      }
    }

    const salesUser = await db.user.findFirst({
      where: { isActive: true, role: { name: UserRole.SALES } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (salesUser) {
      return salesUser.id;
    }

    const adminUser = await db.user.findFirst({
      where: { isActive: true, role: { name: UserRole.ADMIN } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return adminUser?.id ?? null;
  }

  private async findExistingClient(
    db: DbClient,
    params: UpsertCanonicalClientParams,
  ) {
    const normalizedEmail = this.normalizeEmail(params.email);
    const identityFilters: Prisma.ClientWhereInput[] = [];

    if (params.userId) {
      identityFilters.push({ userId: params.userId });
    }

    if (params.leadId) {
      identityFilters.push({ leadId: params.leadId });
    }

    if (normalizedEmail) {
      identityFilters.push({
        email: { equals: normalizedEmail, mode: "insensitive" },
      });
    }

    let existingClient = identityFilters.length
      ? await db.client.findFirst({
          where: { OR: identityFilters },
          select: {
            id: true,
            userId: true,
            leadId: true,
            email: true,
            accountManager: true,
            companyName: true,
            contactName: true,
            phoneWhatsapp: true,
            businessName: true,
            businessType: true,
            status: true,
          },
        })
      : null;

    if (!existingClient && this.hasUsablePhone(params.phoneWhatsapp)) {
      existingClient = await db.client.findFirst({
        where: { phoneWhatsapp: params.phoneWhatsapp },
        select: {
          id: true,
          userId: true,
          leadId: true,
          email: true,
          accountManager: true,
          companyName: true,
          contactName: true,
          phoneWhatsapp: true,
          businessName: true,
          businessType: true,
          status: true,
        },
      });
    }

    if (!existingClient) {
      existingClient = await db.client.findFirst({
        where: {
          companyName: params.companyName,
          contactName: params.contactName,
          businessName: params.businessName,
        },
        select: {
          id: true,
          userId: true,
          leadId: true,
          email: true,
          accountManager: true,
          companyName: true,
          contactName: true,
          phoneWhatsapp: true,
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
    const normalizedEmail = this.normalizeEmail(params.email);
    const existingClient = await this.findExistingClient(db, {
      ...params,
      email: normalizedEmail,
    });

    const accountManagerId =
      existingClient?.accountManager ??
      (await this.resolveAccountManager(db, [params.preferredManagerId]));

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

      if (!existingClient.email && normalizedEmail) {
        updateData.email = normalizedEmail;
      }

      if (!existingClient.accountManager && accountManagerId) {
        updateData.accountManager = accountManagerId;
      }

      if (
        existingClient.companyName === existingClient.contactName &&
        existingClient.companyName !== params.companyName
      ) {
        updateData.companyName = params.companyName;
      }

      if (
        existingClient.contactName === existingClient.companyName &&
        existingClient.contactName !== params.contactName
      ) {
        updateData.contactName = params.contactName;
      }

      if (
        (!existingClient.phoneWhatsapp ||
          existingClient.phoneWhatsapp === PLACEHOLDER_PHONE) &&
        params.phoneWhatsapp &&
        existingClient.phoneWhatsapp !== params.phoneWhatsapp
      ) {
        updateData.phoneWhatsapp = params.phoneWhatsapp;
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

      return { client, created: false };
    }

    const client = await db.client.create({
      data: {
        userId: params.userId ?? undefined,
        leadId: params.leadId ?? undefined,
        companyName: params.companyName,
        contactName: params.contactName,
        phoneWhatsapp: params.phoneWhatsapp,
        email: normalizedEmail ?? undefined,
        businessName: params.businessName,
        businessType: params.businessType,
        accountManager: accountManagerId ?? undefined,
        status: params.status ?? ClientStatus.LEAD,
      },
    });

    return { client, created: true };
  }
}
