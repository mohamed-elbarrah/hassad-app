import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";

// ─── Event Payload Types ─────────────────────────────────────────────────────

interface DisputeCreatedPayload {
  disputeId: string;
  ticketNumber: number;
  clientId: string;
  projectId: string;
  pmId: string;
  title: string;
}

interface DisputeApprovedPayload {
  disputeId: string;
  pmId: string;
  clientId: string;
  priority?: string;
}

interface DisputeRejectedPayload {
  disputeId: string;
  clientId: string;
  reason: string;
}

interface DisputeMessagePayload {
  disputeId: string;
  messageId: string;
  authorId: string;
}

interface DisputePmResolvedPayload {
  disputeId: string;
  pmId: string;
  clientId: string;
  message: string;
}

interface DisputeResolvedPayload {
  disputeId: string;
  clientId: string;
  pmId: string;
  feedback?: string;
}

interface DisputeEscalatedPayload {
  disputeId: string;
  clientId: string;
  pmId: string;
  feedback?: string;
}

interface DisputeAutoEscalatedPayload {
  disputeId: string;
  pmId: string;
}

interface DisputePmChangedPayload {
  disputeId: string;
  oldPmId: string;
  newPmId: string;
  clientId: string;
  reason: string;
}

interface DisputeClosedPayload {
  disputeId: string;
  pmId: string;
  resolution: string;
}

interface DisputeReminderPayload {
  disputeId: string;
  clientId: string;
  pmId: string;
  ticketNumber: number;
  reminderNumber: 1 | 2 | 3;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DisputesNotificationsService {
  private readonly logger = new Logger(DisputesNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Helper: Get Dispute Details ────────────────────────────────────────────

  private async getDisputeDetails(disputeId: string) {
    return this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        clientId: true,
        pmId: true,
        projectId: true,
        status: true,
        project: { select: { name: true } },
        client: { select: { companyName: true, userId: true } },
        pm: { select: { name: true } },
      },
    });
  }

  // ─── Helper: Get Admin User IDs ─────────────────────────────────────────────

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: "ADMIN" },
      },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────

  @OnEvent("dispute.created")
  async handleDisputeCreated(payload: DisputeCreatedPayload) {
    this.logger.log(`Dispute created: #${payload.ticketNumber}`);

    const adminIds = await this.getAdminUserIds();
    if (adminIds.length === 0) return;

    await this.notificationsService.notifyUsers({
      userIds: adminIds,
      title: "تذكرة نزاع جديدة",
      message: `تذكرة جديدة رقم #${payload.ticketNumber} تحتاج مراجعة`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_OPENED",
    });
  }

  @OnEvent("dispute.approved")
  async handleDisputeApproved(payload: DisputeApprovedPayload) {
    this.logger.log(`Dispute approved, notifying PM: ${payload.pmId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    // Notify PM
    await this.notificationsService.notifyUsers({
      userIds: [payload.pmId],
      title: "تمت الموافقة على تذكرة نزاع",
      message: `تمت الموافقة على تذكرة "${dispute.title}" - لديك 3 أيام للحل`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_APPROVED",
    });

    // Create history entry
    await this.prisma.disputeHistory.create({
      data: {
        ticketId: payload.disputeId,
        toStatus: "APPROVED" as any,
        changedBy: payload.pmId,
        note: "تم إرسال إشعار لمدير المشروع",
      },
    });
  }

  @OnEvent("dispute.rejected")
  async handleDisputeRejected(payload: DisputeRejectedPayload) {
    this.logger.log(`Dispute rejected, notifying client: ${payload.clientId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const client = await this.prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { userId: true },
    });

    if (!client?.userId) return;

    await this.notificationsService.notifyUsers({
      userIds: [client.userId],
      title: "تم رفض تذكرتك",
      message: `تم رفض تذكرتك. السبب: ${payload.reason}`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_REJECTED",
    });
  }

  @OnEvent("dispute.message")
  async handleDisputeMessage(payload: DisputeMessagePayload) {
    this.logger.log(`New message in dispute: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    // Get the author to determine who to notify
    const message = await this.prisma.disputeMessage.findUnique({
      where: { id: payload.messageId },
      select: { authorId: true, isInternal: true },
    });

    if (!message || message.isInternal) return; // Internal notes don't trigger notifications

    // Get client's user ID
    const client = await this.prisma.client.findUnique({
      where: { id: dispute.clientId },
      select: { userId: true },
    });

    if (!client?.userId) return;

    // Determine recipient: if author is PM, notify client; if author is client, notify PM
    const recipientId = message.authorId === dispute.pmId ? client.userId : dispute.pmId;

    await this.notificationsService.notifyUsers({
      userIds: [recipientId],
      title: "رسالة جديدة في التذكرة",
      message: `لديك رسالة جديدة في التذكرة #${dispute.ticketNumber}`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_NEW_MESSAGE",
    });
  }

  @OnEvent("dispute.pm_resolved")
  async handleDisputePmResolved(payload: DisputePmResolvedPayload) {
    this.logger.log(`PM marked dispute resolved: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const client = await this.prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { userId: true },
    });

    if (!client?.userId) return;

    await this.notificationsService.notifyUsers({
      userIds: [client.userId],
      title: "تحديث على تذكرتك",
      message: `مدير المشروع أشار إلى حل المشكلة. يرجى تأكيد الحل أو التصعيد.`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_PM_RESOLVED",
    });
  }

  @OnEvent("dispute.resolved")
  async handleDisputeResolved(payload: DisputeResolvedPayload) {
    this.logger.log(`Dispute resolved: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    // Notify PM
    await this.notificationsService.notifyUsers({
      userIds: [payload.pmId],
      title: "تم حل التذكرة",
      message: `العميل أكد حل التذكرة #${dispute.ticketNumber}`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_CLIENT_CONFIRM",
    });

    // Notify admins
    const adminIds = await this.getAdminUserIds();
    if (adminIds.length > 0) {
      await this.notificationsService.notifyUsers({
        userIds: adminIds,
        title: "تم حل تذكرة نزاع",
        message: `تم حل التذكرة #${dispute.ticketNumber} - العميل أكد الحل`,
        entityId: payload.disputeId,
        entityType: "DISPUTE",
        eventType: "DISPUTE_CLIENT_CONFIRM",
      });
    }
  }

  @OnEvent("dispute.escalated")
  async handleDisputeEscalated(payload: DisputeEscalatedPayload) {
    this.logger.log(`Dispute escalated by client: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const adminIds = await this.getAdminUserIds();
    if (adminIds.length === 0) return;

    await this.notificationsService.notifyUsers({
      userIds: adminIds,
      title: "تم تصعيد تذكرة نزاع",
      message: `العميل صرح بعدم حل المشكلة في التذكرة #${dispute.ticketNumber}`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_CLIENT_ESCALATE",
    });
  }

  @OnEvent("dispute.auto_escalated")
  async handleDisputeAutoEscalated(payload: DisputeAutoEscalatedPayload) {
    this.logger.log(`Dispute auto-escalated: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const adminIds = await this.getAdminUserIds();
    if (adminIds.length === 0) return;

    await this.notificationsService.notifyUsers({
      userIds: adminIds,
      title: "تصعيد تلقائي لتذكرة",
      message: `التذكرة #${dispute.ticketNumber} تم تصعيدها تلقائياً لانتهاء المهلة`,
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: "DISPUTE_AUTO_ESCALATED",
    });
  }

  @OnEvent("dispute.pm_changed")
  async handleDisputePmChanged(payload: DisputePmChangedPayload) {
    this.logger.log(`PM changed for dispute: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const client = await this.prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { userId: true },
    });

    const newPm = await this.prisma.user.findUnique({
      where: { id: payload.newPmId },
      select: { name: true },
    });

    const notifications: Promise<void>[] = [];

    // Notify client
    if (client?.userId) {
      notifications.push(
        this.notificationsService.notifyUsers({
          userIds: [client.userId],
          title: "تغيير مدير المشروع",
          message: `تم تغيير مدير المشروع لحل التذكرة #${dispute.ticketNumber}`,
          entityId: payload.disputeId,
          entityType: "DISPUTE",
          eventType: "DISPUTE_PM_CHANGED",
        }).then(() => {}),
      );
    }

    // Notify old PM
    notifications.push(
      this.notificationsService.notifyUsers({
        userIds: [payload.oldPmId],
        title: "تم تغييرك من مشروع",
        message: `تم تغييرك كمدير لمشروع "${dispute.project.name}" بسبب نزاع`,
        entityId: payload.disputeId,
        entityType: "DISPUTE",
        eventType: "DISPUTE_PM_CHANGED",
      }).then(() => {}),
    );

    // Notify new PM
    notifications.push(
      this.notificationsService.notifyUsers({
        userIds: [payload.newPmId],
        title: "تعيينك كمدير مشروع جديد",
        message: `تم تعيينك كمدير لمشروع "${dispute.project.name}"`,
        entityId: payload.disputeId,
        entityType: "DISPUTE",
        eventType: "DISPUTE_PM_CHANGED",
      }).then(() => {}),
    );

    await Promise.all(notifications);
  }

  @OnEvent("dispute.closed")
  async handleDisputeClosed(payload: DisputeClosedPayload) {
    this.logger.log(`Dispute closed: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return;

    const client = await this.prisma.client.findUnique({
      where: { id: dispute.clientId },
      select: { userId: true },
    });

    const notifications: Promise<void>[] = [];

    // Notify client
    if (client?.userId) {
      notifications.push(
        this.notificationsService.notifyUsers({
          userIds: [client.userId],
          title: "تم إغلاق التذكرة",
          message: `تم إغلاق تذكرتك #${dispute.ticketNumber}`,
          entityId: payload.disputeId,
          entityType: "DISPUTE",
          eventType: "DISPUTE_CLOSED",
        }).then(() => {}),
      );
    }

    // Notify PM
    notifications.push(
      this.notificationsService.notifyUsers({
        userIds: [payload.pmId],
        title: "تم إغلاق التذكرة",
        message: `تم إغلاق التذكرة #${dispute.ticketNumber}`,
        entityId: payload.disputeId,
        entityType: "DISPUTE",
        eventType: "DISPUTE_CLOSED",
      }).then(() => {}),
    );

    await Promise.all(notifications);
  }

  // ─── Reminder Handler (called by scheduler) ────────────────────────────────

  async sendReminder(payload: DisputeReminderPayload) {
    this.logger.log(`Sending reminder ${payload.reminderNumber} for dispute: ${payload.disputeId}`);

    const dispute = await this.getDisputeDetails(payload.disputeId);
    if (!dispute) return false;

    const client = await this.prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { userId: true },
    });

    if (!client?.userId) return false;

    const reminderMessages: Record<number, string> = {
      1: `تذكير: يرجى تأكيد حل المشكلة في التذكرة #${payload.ticketNumber}`,
      2: `تذكير ثاني: لم يتم تأكيد حل المشكلة في التذكرة #${payload.ticketNumber}`,
      3: `تذكير نهائي: سيتم تصعيد التذكرة #${payload.ticketNumber} تلقائياً في حال عدم الرد`,
    };

    await this.notificationsService.notifyUsers({
      userIds: [client.userId],
      title: `تذكير ${payload.reminderNumber}`,
      message: reminderMessages[payload.reminderNumber],
      entityId: payload.disputeId,
      entityType: "DISPUTE",
      eventType: `DISPUTE_REMINDER_DAY${payload.reminderNumber}` as any,
    });

    return true;
  }
}