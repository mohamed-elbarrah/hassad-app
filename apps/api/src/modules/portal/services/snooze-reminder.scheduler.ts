import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";

/**
 * Cron service that surfaces snoozed action items back to the client
 * once their snooze window expires.
 *
 * Behavior contract:
 *   - Runs every 15 minutes.
 *   - Finds every `ClientSnoozedItem` whose `snoozedUntil <= now` AND
 *     `reminderSentAt IS NULL`.
 *   - For each match, emits ONE notification (dedup'd via `reminderSentAt`).
 *   - The notification body describes the item by referencing the original
 *     action-item shape (title / subtitle / actionUrl) so the user can
 *     click through to resolve it.
 *   - Resolves the owning `client.userId` to target the recipient; clients
 *     without a linked user are skipped silently (the action items list
 *     already filters those out).
 *   - Failures are wrapped in `.catch(() => undefined)` so a notification
 *     glitch never rolls back the `reminderSentAt` write — and vice versa.
 *
 * What this intentionally does NOT do:
 *   - Does not mutate the underlying source entity (deliverable / invoice /
 *     contract). The snooze is purely a UI-layer hide; the source data is
 *     owned by its respective module.
 *   - Does not retry. If the notification service is down, the row stays
 *     `reminderSentAt IS NULL` and the next tick will retry — bounded by
 *     the snoozed item still being visible in `getActionItems` (which
 *     filters out items where the source state is no longer pending).
 *
 * Mirrors the conventions used by `BillingCronService` and
 * `DisputesScheduler`: `@nestjs/schedule`, `Logger` per service,
 * `.catch(() => undefined)` around the notification call so a notification
 * glitch never aborts the whole sweep.
 */
@Injectable()
export class SnoozeReminderScheduler {
  private readonly logger = new Logger(SnoozeReminderScheduler.name);

  /**
   * `BATCH_SIZE` caps how many rows we touch per tick. With 15-min ticks
   * this comfortably absorbs 100k+ snoozed clients without spiking CPU.
   * If a backlog forms we just catch up over the next few ticks.
   */
  private static readonly BATCH_SIZE = 500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Every 15 minutes. Matches `DisputesScheduler.handleDeadlineCheck`. */
  @Cron("*/15 * * * *")
  async handleExpiredSnoozes() {
    const now = new Date();
    let processed = 0;
    let notified = 0;
    let skipped = 0;

    try {
      // Fetch in small batches so we never lock a huge range and the
      // transaction per-row stays cheap.
      // (Prisma does not natively support LIMIT inside a transaction so
      // we page by id.)
      let cursor: string | undefined;
      // Safety bound: never run more than 20 batches per tick (~10k rows).
      // Anything beyond that points to a misconfiguration upstream.
      for (let i = 0; i < 20; i++) {
        const batch = await this.prisma.clientSnoozedItem.findMany({
          where: {
            snoozedUntil: { lte: now },
            reminderSentAt: null,
            ...(cursor ? { id: { gt: cursor } } : {}),
          },
          orderBy: { id: "asc" },
          take: SnoozeReminderScheduler.BATCH_SIZE,
          include: {
            client: {
              select: {
                id: true,
                userId: true,
                companyName: true,
              },
            },
          },
        });

        if (batch.length === 0) break;
        cursor = batch[batch.length - 1].id;

        for (const row of batch) {
          processed++;
          const recipientId = row.client?.userId;
          if (!recipientId) {
            // No user linked — mark as sent so we don't keep re-evaluating.
            await this.markReminderSent(row.id, now);
            skipped++;
            continue;
          }

          const { title, body, actionUrl } = this.describeItem(
            row.itemType,
            row.itemId,
            row.client?.companyName ?? null,
          );

          // Notification failure MUST NOT roll back `reminderSentAt` —
          // AGENTS.md says notification glitches never block business data.
          // We write `reminderSentAt` first, then fire-and-forget the
          // notification. Worst case the user misses one nudge and the
          // next snooze they make will re-surface the item.
          await this.markReminderSent(row.id, now);

          this.notificationsService
            .createLocalizedNotification({
              entityId: row.itemId,
              entityType: `ACTION_ITEM_${row.itemType}`,
              eventType: "ACTION_ITEM_SNOOZE_EXPIRED",
              userId: recipientId,
              messageKey: "snooze.expired",
              messageParams: { title, body },
              metadata: {
                itemType: row.itemType,
                itemId: row.itemId,
                actionUrl,
                snoozedUntil: row.snoozedUntil.toISOString(),
              },
            })
            .then(() => notified++)
            .catch((err) => {
              // Log and continue. Already marked as sent above, so the
              // cron won't re-attempt until the row is reset manually.
              this.logger.warn(
                `Failed to push snooze-expired notification for ${row.itemType}:${row.itemId}: ${(err as Error).message}`,
              );
            });
        }

        if (batch.length < SnoozeReminderScheduler.BATCH_SIZE) break;
      }
    } catch (err) {
      this.logger.error(
        `Snooze reminder sweep failed: ${(err as Error).message}`,
      );
      return;
    }

    if (processed > 0) {
      this.logger.log(
        `Snooze sweep: processed=${processed} notified=${notified} skipped=${skipped}`,
      );
    }
  }

  private async markReminderSent(id: string, when: Date) {
    await this.prisma.clientSnoozedItem.update({
      where: { id },
      data: { reminderSentAt: when },
    });
  }

  /**
   * Build the user-facing copy for the snooze-expired notification.
   * We keep this short and actionable — a title, a one-line body, and an
   * `actionUrl` that the notification drawer can deep-link into.
   *
   * Static titles per item type so the user can scan their notification
   * list and instantly know what category the nudge belongs to. The body
   * varies slightly so two reminders back-to-back don't look identical.
   */
  private describeItem(
    itemType: string,
    itemId: string,
    companyName: string | null,
  ): { title: string; body: string; actionUrl: string } {
    const greeting = companyName ? ` ${companyName}` : "";
    switch (itemType) {
      case "DELIVERABLE_APPROVAL":
        return {
          title: "Reminder: deliverable awaiting your review",
          body: `A new deliverable${greeting} is awaiting your approval. Open it to review and decide.`,
          actionUrl: `/portal/deliverables/${itemId}`,
        };
      case "INVOICE_PAYMENT":
        return {
          title: "Reminder: invoice awaiting payment",
          body: `An invoice${greeting} is due again after your previous snooze. Open it to view details and pay.`,
          actionUrl: `/portal/invoices/${itemId}`,
        };
      case "PROPOSAL_REVIEW":
        return {
          title: "Reminder: proposal awaiting your review",
          body: `The proposal${greeting} you snoozed is ready for review. Open it to read and decide.`,
          actionUrl: `/portal/proposals/${itemId}`,
        };
      case "CONTRACT_SIGN":
        return {
          title: "Reminder: contract awaiting your signature",
          body: `The contract${greeting} has been awaiting your signature since it was snoozed. Open it to sign.`,
          actionUrl: `/portal/contracts/${itemId}`,
        };
      case "STRATEGY_REVIEW":
        return {
          title: "Reminder: marketing strategy awaiting your review",
          body: `The marketing strategy${greeting} is ready for review. Open it to approve or request revisions.`,
          actionUrl: `/portal/marketing-strategies/${itemId}`,
        };
      default:
        return {
          title: "Reminder: action needs your attention",
          body: `You have${greeting} a snoozed action that is now available for review.`,
          actionUrl: `/portal/actions`,
        };
    }
  }
}
