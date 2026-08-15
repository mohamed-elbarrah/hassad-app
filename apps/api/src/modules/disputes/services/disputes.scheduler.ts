import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { DisputeStatus } from "@prisma/client";
import { DisputesNotificationsService } from "./disputes-notifications.service";

@Injectable()
export class DisputesScheduler {
  private readonly logger = new Logger(DisputesScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: DisputesNotificationsService,
  ) {}

  /**
   * Get system user ID for automated actions (first admin)
   */
  private async getSystemUserId(): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        role: { name: "ADMIN" },
      },
      select: { id: true },
    });
    if (!admin) {
      throw new Error("No active admin user found for system actions");
    }
    return admin.id;
  }

  // ─── Daily Reminder Checks (9:00 AM) ────────────────────────────────────────

  @Cron("0 9 * * *")
  async handleDailyReminders() {
    this.logger.log("Starting daily dispute reminder check...");

    await this.handleReminderDay3();
    await this.handleReminderDay5();
    await this.handleReminderDay7();
  }

  // ─── Deadline Check (Every 15 minutes) ────────────────────────────────────────

  @Cron("*/15 * * * *")
  async handleDeadlineCheck() {
    this.logger.log("Checking for disputes past deadline...");

    const now = new Date();

    // Find disputes past deadline that are still in APPROVED or IN_PROGRESS
    const pastDeadline = await this.prisma.disputeTicket.findMany({
      where: {
        status: { in: [DisputeStatus.APPROVED, DisputeStatus.IN_PROGRESS] },
        deadlineAt: { lt: now },
      },
      include: {
        pm: { select: { id: true } },
        client: { select: { id: true, userId: true } },
      },
    });

    for (const dispute of pastDeadline) {
      await this.escalateDispute(dispute.id, dispute.pmId, "Resolution deadline expired");
    }

    this.logger.log(`Escalated ${pastDeadline.length} overdue disputes`);
  }

  // ─── Private: Reminder Logic ────────────────────────────────────────────────

  private async handleReminderDay3() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Find disputes in PENDING_CLIENT status, 3 days since PM resolved, no reminder1 sent
    const disputes = await this.prisma.disputeTicket.findMany({
      where: {
        status: DisputeStatus.PENDING_CLIENT,
        clientNotifiedAt: { lte: threeDaysAgo },
        reminder1SentAt: null,
      },
      include: {
        client: { select: { id: true, userId: true } },
        pm: { select: { id: true } },
      },
    });

    for (const dispute of disputes) {
      await this.sendReminderAndUpdate(dispute, 1);
    }

    this.logger.log(`Sent ${disputes.length} day-3 reminders`);
  }

  private async handleReminderDay5() {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Find disputes in PENDING_CLIENT status, 5 days since PM resolved, no reminder2 sent
    const disputes = await this.prisma.disputeTicket.findMany({
      where: {
        status: DisputeStatus.PENDING_CLIENT,
        clientNotifiedAt: { lte: fiveDaysAgo },
        reminder2SentAt: null,
      },
      include: {
        client: { select: { id: true, userId: true } },
        pm: { select: { id: true } },
      },
    });

    for (const dispute of disputes) {
      await this.sendReminderAndUpdate(dispute, 2);
    }

    this.logger.log(`Sent ${disputes.length} day-5 reminders`);
  }

  private async handleReminderDay7() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    // Find disputes in PENDING_CLIENT status, 7 days since PM resolved, no reminder3 sent
    const disputes = await this.prisma.disputeTicket.findMany({
      where: {
        status: DisputeStatus.PENDING_CLIENT,
        clientNotifiedAt: { lte: sevenDaysAgo, gte: eightDaysAgo },
        reminder3SentAt: null,
      },
      include: {
        client: { select: { id: true, userId: true } },
        pm: { select: { id: true } },
      },
    });

    for (const dispute of disputes) {
      await this.sendReminderAndUpdate(dispute, 3);
    }

    this.logger.log(`Sent ${disputes.length} day-7 reminders`);

    // Now check for disputes past 7 days with no client response - auto escalate
    await this.autoEscalateStaleDisputes(sevenDaysAgo);
  }

  private async autoEscalateStaleDisputes(sevenDaysAgo: Date) {
    // Disputes that have reminder3 sent but are still pending after 7+ days
    // (meaning client hasn't responded for > 7 days since PM marked resolved)
    const staleDisputes = await this.prisma.disputeTicket.findMany({
      where: {
        status: DisputeStatus.PENDING_CLIENT,
        clientNotifiedAt: { lt: sevenDaysAgo },
        clientRespondedAt: null,
      },
      include: {
        pm: { select: { id: true } },
        client: { select: { id: true } },
      },
    });

    for (const dispute of staleDisputes) {
      await this.escalateDispute(
        dispute.id,
        dispute.pmId,
        "Automatic escalation - client did not respond",
      );
    }

    this.logger.log(`Auto-escalated ${staleDisputes.length} stale disputes`);
  }

  // ─── Private: Helper Methods ────────────────────────────────────────────────

  private async sendReminderAndUpdate(
    dispute: {
      id: string;
      ticketNumber: number;
      clientId: string;
      pmId: string;
      client: { id: string; userId: string | null };
    },
    reminderNumber: 1 | 2 | 3,
  ) {
    if (!dispute.client?.userId) return;

    // Get system user ID for history entry
    const systemUserId = await this.getSystemUserId();

    // Send reminder notification
    await this.notificationsService.sendReminder({
      disputeId: dispute.id,
      clientId: dispute.clientId,
      pmId: dispute.pmId,
      ticketNumber: dispute.ticketNumber,
      reminderNumber,
    });

    // Update the appropriate reminder timestamp
    const field = `reminder${reminderNumber}SentAt` as const;
    await this.prisma.disputeTicket.update({
      where: { id: dispute.id },
      data: { [field]: new Date() },
    });

    // Add history entry
    await this.prisma.disputeHistory.create({
      data: {
        ticketId: dispute.id,
        toStatus: DisputeStatus.PENDING_CLIENT,
        changedBy: systemUserId,
        note: `Reminder ${reminderNumber} sent to the client`,
      },
    });
  }

  private async escalateDispute(
    disputeId: string,
    pmId: string,
    reason: string,
  ) {
    const now = new Date();

    // Get system user ID for history entry
    const systemUserId = await this.getSystemUserId();

    await this.prisma.disputeTicket.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.ESCALATED,
        escalatedAt: now,
        history: {
          create: {
            fromStatus: DisputeStatus.PENDING_CLIENT,
            toStatus: DisputeStatus.ESCALATED,
            changedBy: systemUserId,
            note: reason,
          },
        },
      },
    });

    // Emit event for notification handler
    await this.notificationsService.handleDisputeAutoEscalated({
      disputeId,
      pmId,
    });
  }
}
