import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import { ClientProfileService } from "../../crm/services/client-profile.service";

@Injectable()
export class PmClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientProfileService: ClientProfileService,
  ) {}

  private async assertOwnership(clientId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { clientId, projectManagerId: userId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { clientId },
      });
    }
  }

  private async getPmTeamView(clientId: string, userId: string) {
    await this.assertOwnership(clientId, userId);
    return this.clientProfileService.getTeamView(clientId);
  }

  getFull(clientId: string, userId: string) {
    return this.getPmTeamView(clientId, userId);
  }

  getTeamView(clientId: string, userId: string) {
    return this.getPmTeamView(clientId, userId);
  }
}
