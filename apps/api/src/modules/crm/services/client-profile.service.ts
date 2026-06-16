import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpsertClientProfileDto } from "../dto/client-profile.dto";

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getByClientId(clientId: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    return profile ?? null;
  }

  async upsert(clientId: string, dto: UpsertClientProfileDto, userId?: string) {
    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const data: any = { ...dto, createdBy: userId };

    const profile = existing
      ? await this.prisma.clientProfile.update({
          where: { clientId },
          data,
        })
      : await this.prisma.clientProfile.create({
          data: { ...data, clientId },
        });

    if (!existing) {
      await this.prisma.client.update({
        where: { id: clientId },
        data: { intakeCompleted: true },
      });
    }

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: userId || "system",
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
