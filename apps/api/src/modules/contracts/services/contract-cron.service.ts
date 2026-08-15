import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContractStatus } from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";

@Injectable()
export class ContractCronService {
  private readonly logger = new Logger(ContractCronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron("0 8 * * *")
  async handleExpiringContracts() {
    this.logger.log("Checking for expiring contracts...");

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        status: ContractStatus.SIGNED,
        endDate: { lte: sevenDaysFromNow, gte: new Date() },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            accountManager: true,
            userId: true,
          },
        },
      },
    });

    for (const contract of expiringContracts) {
      const existingAlert = await this.prisma.contractRenewalAlert.findFirst({
        where: {
          contractId: contract.id,
          scheduledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (existingAlert) continue;

      await this.prisma.contractRenewalAlert.create({
        data: {
          contractId: contract.id,
          alertType: "SEVEN_DAYS",
          isSent: false,
          scheduledAt: new Date(),
        },
      });

      const recipientIds = [
        contract.createdBy,
        contract.client.accountManager,
        contract.client.userId,
      ].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService.notifyUsersWithMessage({
          userIds: recipientIds,
          messageKey: "contract.expiring",
          messageParams: {
            contractTitle: contract.title,
            companyName: contract.client.companyName,
            days: 7,
          },
          entityId: contract.id,
          entityType: "CONTRACT",
          eventType: "CONTRACT_EXPIRING",
        });
      }
    }

    const expiredContracts = await this.prisma.contract.findMany({
      where: {
        status: ContractStatus.SIGNED,
        endDate: { lt: new Date() },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            accountManager: true,
            userId: true,
          },
        },
      },
    });

    for (const contract of expiredContracts) {
      await this.prisma.contract.update({
        where: { id: contract.id },
        data: { status: ContractStatus.EXPIRED },
      });

      const recipientIds = [
        contract.createdBy,
        contract.client.accountManager,
        contract.client.userId,
      ].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService.notifyUsersWithMessage({
          userIds: recipientIds,
          messageKey: "contract.expired",
          messageParams: {
            contractTitle: contract.title,
            companyName: contract.client.companyName,
          },
          entityId: contract.id,
          entityType: "CONTRACT",
          eventType: "CONTRACT_EXPIRED",
        });
      }
    }

    // ── Renewal escalation: expiring within 7d with no renewal action ──────
    for (const contract of expiringContracts) {
      const hasRenewalAlert = await this.prisma.contractRenewalAlert.findFirst({
        where: {
          contractId: contract.id,
          alertType: "THIRTY_DAYS",
        },
      });

      // Only escalate if the 30-day alert was already sent (meaning admin knew and did nothing)
      if (!hasRenewalAlert) continue;

      const escalated = await this.prisma.contractRenewalAlert.findFirst({
        where: {
          contractId: contract.id,
          alertType: "SEVEN_DAYS",
          isSent: true,
        },
      });
      if (escalated) continue;

      await this.prisma.contractRenewalAlert.create({
        data: {
          contractId: contract.id,
          alertType: "SEVEN_DAYS",
          isSent: true,
          scheduledAt: new Date(),
          sentAt: new Date(),
        },
      });

      const managerIds = [
        contract.createdBy,
        contract.client?.accountManager,
      ].filter(Boolean) as string[];
      if (managerIds.length > 0) {
        await this.notificationsService.notifyUsersWithMessage({
          userIds: managerIds,
          messageKey: "contract.renewal_urgent",
          messageParams: {
            contractTitle: contract.title,
            companyName: contract.client?.companyName,
            days: 7,
          },
          entityId: contract.id,
          entityType: "CONTRACT",
          eventType: "RENEWAL_ESCALATED",
        });
      }
    }

    this.logger.log(
      `Processed ${expiringContracts.length} expiring and ${expiredContracts.length} expired contracts`,
    );
  }
}
