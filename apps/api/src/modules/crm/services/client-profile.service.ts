import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
import {
  UpsertClientProfileDto,
  UpsertClientProfileV2Dto,
} from "../dto/client-profile.dto";

interface AuthenticatedUser {
  id: string;
  role: string;
  clientId?: string;
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
      throw new ApiException("PROFILE_ACCESS_DENIED", "You can only access your own profile", 403);
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
   * Returns a combined, filtered view of a client + profile for team members
   * (PM, designers, marketers, employees). Sensitive financial fields
   * (totalContractValue, totalPaid, avgSatisfactionScore, project counters)
   * are excluded so internal roles only see operational context.
   * No special permission required — just authentication.
   */
  async getTeamView(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        manager: { select: { id: true, name: true } },
        profile: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Return only non-sensitive client fields + full profile
    const {
      totalProjects: _tp,
      activeProjects: _ap,
      completedProjects: _cp,
      cancelledProjects: _x,
      totalContractValue: _tcv,
      totalInvoiced: _ti,
      totalPaid: _tpd,
      avgSatisfactionScore: _as,
      lastProjectAt: _lp,
      portalAccessToken: _pat,
      portalTokenExpiresAt: _pte,
      userId: _u,
      intakeCompleted: _ic,
      ...safeClient
    } = client;

    return {
      client: safeClient,
      profile: client.profile ?? null,
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
        const { createdBy: _, ...rest } = plainDto;
        const updateData = rest as Prisma.ClientProfileUpdateInput;

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

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: user.id,
        eventType: existing
          ? "CLIENT_PROFILE_UPDATED"
          : "CLIENT_PROFILE_CREATED",
        description: existing
          ? "Client profile updated"
          : "Client profile created",
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

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: user.id,
        eventType: existing
          ? "CLIENT_PROFILE_UPDATED"
          : "CLIENT_PROFILE_CREATED",
        description: existing
          ? "Client profile updated (V2)"
          : "Client profile created (V2)",
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
      throw new NotFoundException("Client profile not found");
    }
    await this.prisma.clientProfile.delete({
      where: { clientId },
    });
  }
}
