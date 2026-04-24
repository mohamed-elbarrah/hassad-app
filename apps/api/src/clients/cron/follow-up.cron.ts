import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { ClientStatus } from "@hassad/shared";
import { Prisma } from "@prisma/client";

const FOLLOW_UP_REMINDER_DAYS = 7;

@Injectable()
export class LeadFollowUpCronService {
  private readonly logger = new Logger(LeadFollowUpCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processLeadFollowUps(): Promise<void> {
    const now = new Date();

    try {
      const clients = await this.prisma.client.findMany({
        where: {
          nextFollowUpAt: { lte: now },
          followUpStep: { gt: 0 },
          OR: [{ status: ClientStatus.LEAD }, { status: ClientStatus.STOPPED }],
        },
        select: {
          id: true,
          name: true,
          followUpStep: true,
          assignedToId: true,
          activityLog: true,
        },
      });

      if (clients.length === 0) return;

      for (const client of clients) {
        await this.handleFollowUp(client, now);
      }
    } catch (error) {
      this.logger.error("Lead follow-up cron job failed", error);
    }
  }

  private async handleFollowUp(
    client: {
      id: string;
      name: string;
      followUpStep: number;
      assignedToId: string;
      activityLog: Prisma.JsonValue | null;
    },
    now: Date,
  ): Promise<void> {
    const currentLog = Array.isArray(client.activityLog)
      ? (client.activityLog as Array<Record<string, unknown>>)
      : [];

    const followUpMessages: Record<
      number,
      { action: string; details: string }
    > = {
      1: {
        action: "FOLLOW_UP_INTRO_MESSAGE",
        details: "تم إرسال رسالة تعريفية تلقائياً",
      },
      2: {
        action: "FOLLOW_UP_MEETING_LINK",
        details: "تم إرسال رابط تحديد موعد تلقائياً",
      },
      3: {
        action: "FOLLOW_UP_SERVICE_SUMMARY",
        details: "تم إرسال عرض مختصر للخدمة تلقائياً",
      },
      4: {
        action: "FOLLOW_UP_REMINDER",
        details: "تذكير متابعة بعد أسبوع من الإيقاف",
      },
    };

    const entry = followUpMessages[client.followUpStep];
    if (!entry) return;

    const updateData: Prisma.ClientUpdateInput = {
      activityLog: [
        ...currentLog,
        {
          action: entry.action,
          userId: client.assignedToId,
          timestamp: now.toISOString(),
        },
      ] as Prisma.InputJsonValue,
    };

    if (client.followUpStep === 3) {
      updateData.status = ClientStatus.STOPPED;
      updateData.followUpStep = 4;
      updateData.nextFollowUpAt = new Date(
        now.getTime() + FOLLOW_UP_REMINDER_DAYS * 24 * 60 * 60 * 1000,
      );
    } else if (client.followUpStep === 4) {
      updateData.followUpStep = 0;
      updateData.nextFollowUpAt = null;
    } else {
      updateData.followUpStep = 0;
      updateData.nextFollowUpAt = null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: client.id },
        data: updateData,
      });

      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          userId: client.assignedToId,
          action: entry.action,
          details: entry.details,
          metadata: {
            followUpStep: client.followUpStep,
            automated: true,
          } as Prisma.InputJsonValue,
        },
      });
    });

    this.logger.log(
      `Automated follow-up step ${client.followUpStep} for client ${client.id}`,
    );
  }
}
