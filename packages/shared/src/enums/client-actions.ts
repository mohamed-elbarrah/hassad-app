import { NotificationEventType } from "./client";

/**
 * Client responsibilities shown in the portal action center.
 * Notifications remain a history feed; these types represent unresolved work.
 */
export const ClientActionType = {
  DELIVERABLE_APPROVAL: "DELIVERABLE_APPROVAL",
  INVOICE_PAYMENT: "INVOICE_PAYMENT",
  PROPOSAL_REVIEW: "PROPOSAL_REVIEW",
  CONTRACT_SIGN: "CONTRACT_SIGN",
  STRATEGY_REVIEW: "STRATEGY_REVIEW",
} as const;

export type ClientActionType =
  (typeof ClientActionType)[keyof typeof ClientActionType];

/** Events that have a corresponding pending client action. */
export const CLIENT_ACTION_NOTIFICATION_EVENTS = [
  NotificationEventType.PROPOSAL_SENT,
  NotificationEventType.CONTRACT_SENT,
  NotificationEventType.INVOICE_SENT,
  NotificationEventType.DELIVERABLE_APPROVAL,
  NotificationEventType.DELIVERABLE_READY,
  NotificationEventType.MARKETING_STRATEGY_SENT,
  NotificationEventType.ACTION_REQUIRED,
] as const;

export function isClientActionNotificationEvent(
  eventType: string | null | undefined,
): boolean {
  return eventType
    ? (CLIENT_ACTION_NOTIFICATION_EVENTS as readonly string[]).includes(
        eventType,
      )
    : false;
}
