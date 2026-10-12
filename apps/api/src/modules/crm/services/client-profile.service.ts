import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  UpsertClientProfileDto,
  UpsertClientProfileV2Dto,
} from "../dto/client-profile.dto";

interface AuthenticatedUser {
  id: string;
  role: string;
  clientId?: string;
}

const OPERATIONAL_COMMUNICATION_FIELDS = [
  "businessName",
  "businessType",
  "industry",
] as const;
const OPERATIONAL_PROFILE_FIELDS = {
  productInfo: [
    "productStory",
    "detailedDescription",
    "valueProposition",
    "advantages",
    "benefits",
    "contentDirection",
  ],
  brandVoice: [
    "toneOfVoice",
    "boundaries",
    "verbalSlogan",
    "appearanceMethod",
  ],
  customerJourney: ["orderMethods", "followUpTools"],
  campaignInfo: [
    "campaignGoal",
    "campaignDetails",
    "campaignOffer",
    "guarantees",
    "campaignSeason",
    "competitors",
  ],
  visualIdentityInfo: [
    "hasVisualIdentity",
    "brandAssets",
    "pastDesigns",
    "productPhotos",
    "visualDirection",
  ],
} as const;

function selectRecordFields(
  value: unknown,
  fields: readonly string[],
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const selected = Object.fromEntries(
    fields
      .filter((field) => record[field] !== undefined)
      .map((field) => [field, record[field]]),
  );
  return Object.keys(selected).length > 0 ? selected : null;
}

function selectOperationalAudienceInfo(value: unknown) {
  const audienceInfo = selectRecordFields(value, ["customerAnalysis", "faq"]);
  if (!audienceInfo || !Array.isArray(audienceInfo.faq)) return audienceInfo;

  audienceInfo.faq = audienceInfo.faq
    .map((item) => selectRecordFields(item, ["question", "answer"]))
    .filter((item): item is Record<string, unknown> => item !== null);
  return audienceInfo;
}

function selectOperationalVisualIdentity(value: unknown) {
  const visualIdentityInfo = selectRecordFields(
    value,
    OPERATIONAL_PROFILE_FIELDS.visualIdentityInfo,
  );
  if (visualIdentityInfo && "brandAssets" in visualIdentityInfo) {
    visualIdentityInfo.brandAssets = selectRecordFields(
      visualIdentityInfo.brandAssets,
      ["logoUrl", "brandColors", "fonts", "guidelinesUrl"],
    );
  }
  return visualIdentityInfo;
}

function omitKeys<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = { ...value };
  for (const key of keys) {
    delete (result as Partial<T>)[key];
  }
  return result as Omit<T, K>;
}

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveClientIdForUser(userId: string): Promise<string | null> {
    const client = await this.prisma.client.findFirst({
      where: { userId },
      select: { id: true },
    });
    return client?.id ?? null;
  }

  private async assertClientOwnership(
    user: AuthenticatedUser,
    clientId: string,
  ): Promise<void> {
    if (user.role !== "CLIENT") return;

    const ownedClientId = await this.resolveClientIdForUser(user.id);
    if (!ownedClientId || ownedClientId !== clientId) {
      throw new ForbiddenException({
        code: "CLIENT_PROFILE_ACCESS_DENIED",
        details: { clientId },
      });
    }
  }

  async getByClientId(clientId: string, user?: AuthenticatedUser) {
    if (user) {
      await this.assertClientOwnership(user, clientId);
    }

    const profile = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    return profile ?? null;
  }

  /**
   * Returns business context for internal task roles. Personal, access,
   * financial, performance, and legacy profile fields are not selected or
   * returned; consumers must still enforce their own task ownership.
   */
  async getTeamView(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        companyName: true,
        businessName: true,
        businessType: true,
        kind: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            clientId: true,
            communicationInfo: true,
            productInfo: true,
            audienceInfo: true,
            brandVoice: true,
            customerJourney: true,
            campaignInfo: true,
            visualIdentityInfo: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { id: clientId },
      });
    }

    const profile = client.profile;
    return {
      client: {
        id: client.id,
        companyName: client.companyName,
        businessName: client.businessName,
        businessType: client.businessType,
        kind: client.kind,
        status: client.status,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      profile: profile
        ? {
            id: profile.id,
            clientId: profile.clientId,
            communicationInfo: selectRecordFields(
              profile.communicationInfo,
              OPERATIONAL_COMMUNICATION_FIELDS,
            ),
            productInfo: selectRecordFields(
              profile.productInfo,
              OPERATIONAL_PROFILE_FIELDS.productInfo,
            ),
            audienceInfo: selectOperationalAudienceInfo(profile.audienceInfo),
            brandVoice: selectRecordFields(
              profile.brandVoice,
              OPERATIONAL_PROFILE_FIELDS.brandVoice,
            ),
            customerJourney: selectRecordFields(
              profile.customerJourney,
              OPERATIONAL_PROFILE_FIELDS.customerJourney,
            ),
            campaignInfo: selectRecordFields(
              profile.campaignInfo,
              OPERATIONAL_PROFILE_FIELDS.campaignInfo,
            ),
            visualIdentityInfo: selectOperationalVisualIdentity(
              profile.visualIdentityInfo,
            ),
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
    };
  }

  async upsert(
    clientId: string,
    dto: UpsertClientProfileDto,
    user: AuthenticatedUser,
  ) {
    await this.assertClientOwnership(user, clientId);

    const plainDto = JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;

    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const profile = await this.prisma.$transaction(async (tx) => {
      let result;

      if (existing) {
        const updateData = omitKeys(plainDto, ["createdBy"] as const) as
          Prisma.ClientProfileUpdateInput;

        result = await tx.clientProfile.update({
          where: { clientId },
          data: updateData,
        });
      } else {
        const createData = {
          ...plainDto,
          clientId,
          createdBy: user.id,
        } as unknown as Prisma.ClientProfileUncheckedCreateInput;

        result = await tx.clientProfile.create({
          data: createData,
        });

        await tx.client.update({
          where: { id: clientId },
          data: { intakeCompleted: true },
        });
      }

      return result;
    });

    const eventType = existing
      ? "CLIENT_PROFILE_UPDATED"
      : "CLIENT_PROFILE_CREATED";
    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: user.id,
        eventType,
        description: eventType,
        metadata: { profileId: profile.id },
      },
    });

    return profile;
  }

  /**
   * Upsert client profile with V2 data (unified with IntakeFormV2)
   * This is the canonical method for updating client profile from both
   * intake form submission and profile edit.
   */
  async upsertV2(
    clientId: string,
    dto: UpsertClientProfileV2Dto,
    user: AuthenticatedUser,
  ) {
    await this.assertClientOwnership(user, clientId);

    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const profile = await this.prisma.$transaction(async (tx) => {
      let result;

      // Helper to cast JSON values properly
      const toJson = (
        val: unknown,
      ):
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput
        | undefined => {
        if (val === undefined || val === null) return undefined;
        return val as Prisma.InputJsonValue;
      };

      if (existing) {
        result = await tx.clientProfile.update({
          where: { clientId },
          data: {
            communicationInfo:
              toJson(dto.communicationInfo) ?? existing.communicationInfo,
            productInfo: toJson(dto.productInfo) ?? existing.productInfo,
            audienceInfo: toJson(dto.audienceInfo) ?? existing.audienceInfo,
            brandVoice: toJson(dto.brandVoice) ?? existing.brandVoice,
            customerJourney:
              toJson(dto.customerJourney) ?? existing.customerJourney,
            campaignInfo: toJson(dto.campaignInfo) ?? existing.campaignInfo,
            pastPerformance:
              toJson(dto.pastPerformance) ?? existing.pastPerformance,
            budgetInfo: toJson(dto.budgetInfo) ?? existing.budgetInfo,
            visualIdentityInfo:
              toJson(dto.visualIdentityInfo) ?? existing.visualIdentityInfo,
          },
        });
      } else {
        result = await tx.clientProfile.create({
          data: {
            clientId,
            createdBy: user.id,
            communicationInfo: toJson(dto.communicationInfo) ?? Prisma.JsonNull,
            productInfo: toJson(dto.productInfo) ?? Prisma.JsonNull,
            audienceInfo: toJson(dto.audienceInfo) ?? Prisma.JsonNull,
            brandVoice: toJson(dto.brandVoice) ?? Prisma.JsonNull,
            customerJourney: toJson(dto.customerJourney) ?? Prisma.JsonNull,
            campaignInfo: toJson(dto.campaignInfo) ?? Prisma.JsonNull,
            pastPerformance: toJson(dto.pastPerformance) ?? Prisma.JsonNull,
            budgetInfo: toJson(dto.budgetInfo) ?? Prisma.JsonNull,
            visualIdentityInfo:
              toJson(dto.visualIdentityInfo) ?? Prisma.JsonNull,
          } as Prisma.ClientProfileUncheckedCreateInput,
        });

        await tx.client.update({
          where: { id: clientId },
          data: { intakeCompleted: true },
        });
      }

      return result;
    });

    const eventType = existing
      ? "CLIENT_PROFILE_UPDATED"
      : "CLIENT_PROFILE_CREATED";
    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: user.id,
        eventType,
        description: eventType,
        metadata: { profileId: profile.id },
      },
    });

    return profile;
  }

  async delete(clientId: string) {
    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "CLIENT_PROFILE_NOT_FOUND",
        details: { clientId },
      });
    }
    await this.prisma.clientProfile.delete({
      where: { clientId },
    });
  }
}
