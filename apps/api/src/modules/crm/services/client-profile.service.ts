import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
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

  async getByClientId(clientId: string, user?: AuthenticatedUser) {
    if (user?.role === "CLIENT") {
      const client = await this.prisma.client.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!client || client.id !== clientId) {
        throw new ForbiddenException("You can only view your own profile");
      }
    }

    const profile = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    return profile ?? null;
  }

  async upsert(
    clientId: string,
    dto: UpsertClientProfileDto,
    user: AuthenticatedUser,
  ) {
    if (user.role === "CLIENT") {
      const client = await this.prisma.client.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!client || client.id !== clientId) {
        throw new ForbiddenException("You can only update your own profile");
      }
    }

    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const data: any = { ...dto, createdBy: user.id };

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
