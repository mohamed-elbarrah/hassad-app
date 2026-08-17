import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContractStatus } from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { Prisma } from "@prisma/client";

const RENEWAL_ESCALATION_CLAIM_EVENT = "RENEWAL_ESCALATION_CLAIM";
const CLAIM_LEASE_MS = 15 * 60 * 1000;

function isFreshClaim(metadata: unknown, now: Date) {
  const value = metadata as { status?: string; claimedAt?: string } | null;
  if (value?.status === "DELIVERED") return true;
  if (value?.status !== "CLAIMED" || !value.claimedAt) return false;
  const claimedAt = Date.parse(value.claimedAt);
  return (
    Number.isFinite(claimedAt) && now.getTime() - claimedAt < CLAIM_LEASE_MS
  );
}

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
      const claimedAlert = await this.prisma.$transaction(async (tx) => {
        if (typeof tx.$executeRaw === "function") {
          await tx.$executeRaw(
            Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`${contract.id}:SEVEN_DAYS`}))`,
          );
        }
        let alert = await tx.contractRenewalAlert.findFirst({
          where: {
            contractId: contract.id,
            alertType: "SEVEN_DAYS",
            scheduledAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });
        if (!alert) {
          alert = await tx.contractRenewalAlert.create({
            data: {
              contractId: contract.id,
              alertType: "SEVEN_DAYS",
              isSent: false,
              scheduledAt: new Date(),
            },
          });
        }
        const staleBefore = new Date(Date.now() - CLAIM_LEASE_MS);
        if (alert.isSent && alert.sentAt && alert.sentAt > staleBefore) {
          return null;
        }
        const claimed = await tx.contractRenewalAlert.updateMany({
          where: {
            id: alert.id,
            OR: [
              { isSent: false },
              { isSent: true, sentAt: null },
              { isSent: true, sentAt: { lt: staleBefore } },
            ],
          },
          data: { isSent: true, sentAt: new Date() },
        });
        return claimed.count > 0 ? alert.id : null;
      });

      if (!claimedAlert) continue;

      const recipientIds = [
        contract.createdBy,
        contract.client.accountManager,
        contract.client.userId,
      ].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService
          .notifyUsersWithMessage({
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
          })
          .catch(async () => {
            await this.prisma.contractRenewalAlert.updateMany({
              where: { id: claimedAlert, isSent: true },
              data: { isSent: false, sentAt: null },
            });
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
      const transitioned = await this.prisma.$transaction(async (tx) => {
        const result = await tx.contract.updateMany({
          where: { id: contract.id, status: ContractStatus.SIGNED },
          data: { status: ContractStatus.EXPIRED },
        });
        if (result.count === 0) return false;
        await tx.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: ContractStatus.SIGNED,
            toStatus: ContractStatus.EXPIRED,
            changedBy: contract.createdBy,
            reason: "Contract expired",
          },
        });
        return true;
      });
      if (!transitioned) continue;

      const recipientIds = [
        contract.createdBy,
        contract.client.accountManager,
        contract.client.userId,
      ].filter(Boolean) as string[];
      if (recipientIds.length > 0) {
        await this.notificationsService
          .notifyUsersWithMessage({
            userIds: recipientIds,
            messageKey: "contract.expired",
            messageParams: {
              contractTitle: contract.title,
              companyName: contract.client.companyName,
            },
            entityId: contract.id,
            entityType: "CONTRACT",
            eventType: "CONTRACT_EXPIRED",
          })
          .catch(() => undefined);
      }
    }

    // ── Renewal escalation: expiring within 7d with no renewal action ──────
    for (const contract of expiringContracts) {
      const hasRenewalAlert = await this.prisma.contractRenewalAlert.findFirst({
        where: {
          contractId: contract.id,
          alertType: "THIRTY_DAYS",
          isSent: true,
        },
      });

      // Only escalate if the 30-day alert was already sent (meaning admin knew and did nothing)
      if (!hasRenewalAlert) continue;

      const managerIds = [
        contract.createdBy,
        contract.client?.accountManager,
      ].filter(Boolean) as string[];
      if (managerIds.length === 0) continue;

      const claim = await this.prisma.$transaction(async (tx) => {
        if (typeof tx.$executeRaw === "function") {
          await tx.$executeRaw(
            Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`${contract.id}:RENEWAL_ESCALATED`}))`,
          );
        }
        const claims = await tx.notificationEvent.findMany({
          where: {
            entityId: contract.id,
            entityType: "CONTRACT",
            eventType: RENEWAL_ESCALATION_CLAIM_EVENT,
          },
        });
        const now = new Date();
        if (claims.some((event) => isFreshClaim(event.metadata, now))) {
          return null;
        }

        const alert = await tx.contractRenewalAlert.create({
          data: {
            contractId: contract.id,
            alertType: "SEVEN_DAYS",
            isSent: false,
            scheduledAt: new Date(),
          },
        });
        const claimEvent = await tx.notificationEvent.create({
          data: {
            entityId: contract.id,
            entityType: "CONTRACT",
            eventType: RENEWAL_ESCALATION_CLAIM_EVENT,
            metadata: { status: "CLAIMED", claimedAt: now.toISOString() },
          },
        });
        return { alertId: alert.id, claimEventId: claimEvent.id };
      });
      if (!claim) continue;

      try {
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
        await this.prisma.$transaction(async (tx) => {
          await tx.contractRenewalAlert.updateMany({
            where: { id: claim.alertId, isSent: false },
            data: { isSent: true, sentAt: new Date() },
          });
          await tx.notificationEvent.update({
            where: { id: claim.claimEventId },
            data: { metadata: { status: "DELIVERED" } },
          });
        });
      } catch {
        await this.prisma.$transaction(async (tx) => {
          await tx.contractRenewalAlert.updateMany({
            where: { id: claim.alertId, isSent: false },
            data: { isSent: false, sentAt: null },
          });
          await tx.notificationEvent.update({
            where: { id: claim.claimEventId },
            data: {
              metadata: {
                status: "RELEASED",
                releasedAt: new Date().toISOString(),
              },
            },
          });
        });
      }
    }

    this.logger.log(
      `Processed ${expiringContracts.length} expiring and ${expiredContracts.length} expired contracts`,
    );
  }
}
