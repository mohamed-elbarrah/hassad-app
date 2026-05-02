import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContractStatus } from '@hassad/shared';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class ContractCronService {
  private readonly logger = new Logger(ContractCronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 8 * * *')
  async handleExpiringContracts() {
    this.logger.log('Checking for expiring contracts...');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        status: ContractStatus.SIGNED,
        endDate: { lte: sevenDaysFromNow, gte: new Date() },
      },
      include: {
        client: { select: { id: true, companyName: true, accountManager: true } },
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
          alertType: 'SEVEN_DAYS',
          isSent: false,
          scheduledAt: new Date(),
        },
      });

      const recipientIds = [contract.createdBy, contract.client.accountManager].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService.notifyUsers({
          userIds: recipientIds,
          title: 'عقد يقترب من الانتهاء',
          message: `العقد "${contract.title}" مع ${contract.client.companyName} ينتهي خلال 7 أيام`,
          entityId: contract.id,
          entityType: 'CONTRACT',
          eventType: 'CONTRACT_EXPIRING',
        });
      }
    }

    const expiredContracts = await this.prisma.contract.findMany({
      where: {
        status: ContractStatus.SIGNED,
        endDate: { lt: new Date() },
      },
      include: {
        client: { select: { id: true, companyName: true, accountManager: true } },
      },
    });

    for (const contract of expiredContracts) {
      await this.prisma.contract.update({
        where: { id: contract.id },
        data: { status: ContractStatus.EXPIRED },
      });

      const recipientIds = [contract.createdBy, contract.client.accountManager].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService.notifyUsers({
          userIds: recipientIds,
          title: 'انتهى العقد',
          message: `انتهى العقد "${contract.title}" مع ${contract.client.companyName}. يرجى التواصل مع العميل للتجديد.`,
          entityId: contract.id,
          entityType: 'CONTRACT',
          eventType: 'CONTRACT_EXPIRED',
        });
      }
    }

    this.logger.log(`Processed ${expiringContracts.length} expiring and ${expiredContracts.length} expired contracts`);
  }
}