import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpsertClientProfileDto } from "../dto/client-profile.dto";

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
      throw new ForbiddenException("You can only access your own profile");
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

    /**
     * Serialize the validated DTO into JSON-compatible plain objects so Prisma's
     * Json fields (competitors, brandAssets, customFields) accept the payload.
     */
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
