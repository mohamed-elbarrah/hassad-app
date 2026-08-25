# Notification migration plan (Phase 1–3 foundations)

## Contract

Notifications now carry `eventType` plus JSON-safe `metadata` through the shared
`Notification`, `NotificationEventPayload`, `NotificationPage`,
`NotificationMetadata`, and `NotificationPresentation` types. Event codes are
forward-compatible (`NotificationEventType | string`) so one portal can add an
event without breaking older consumers. `createdAt`, `channel`, `sentAt`, and
`readAt` remain compatible with existing API responses.

The centralized `notificationPresentation()` function is the only notification
content presentation boundary. It maps event codes and metadata and retains
read-only fallbacks for legacy records (including legacy broadcast title/body).
No database fields were removed.

## Producer inventory

All current API notification producers:

- `apps/api/src/modules/admin/services/admin-alert.service.ts`
- `apps/api/src/modules/chat/services/chat.service.ts`
- `apps/api/src/modules/contracts/services/{billing-cron.service.ts,contract-cron.service.ts,contracts.service.ts}`
- `apps/api/src/modules/disputes/services/disputes-notifications.service.ts`
- `apps/api/src/modules/finance/services/finance.service.ts`
- `apps/api/src/modules/marketing/services/{campaigns.service.ts,marketing-strategy.service.ts}`
- `apps/api/src/modules/notifications/controllers/notifications.controller.ts`
- `apps/api/src/modules/payments/services/payments.service.ts`
- `apps/api/src/modules/pm/services/pm-project-actions.service.ts`
- `apps/api/src/modules/portal/services/portal.service.ts`
- `apps/api/src/modules/projects/services/projects.service.ts`
- `apps/api/src/modules/proposals/services/proposals.service.ts`
- `apps/api/src/modules/tasks/services/tasks.service.ts`

Marketing campaign and strategy producers use event codes; campaign event
arguments are now typed against the shared event-code contract. Other portals
remain unchanged in this bounded phase.

## Consumer inventory

- Dashboard list: `apps/web/app/(dashboard)/dashboard/notifications/page.tsx`
- Portal list: `apps/web/app/(portal)/portal/notifications/page.tsx`
- Shared dropdowns/bells: `apps/web/components/common/NotificationsDropdown.tsx`,
  `apps/web/components/common/NotificationBell.tsx`,
  `apps/web/components/design-system/{DashboardNotificationsDropdown.tsx,DashboardNotificationBell.tsx,NotificationDropdown.tsx}`
- Navigation/socket consumers: `apps/web/components/dashboard/dashboard-shell.tsx`,
  `apps/web/components/portal/shared/PortalNavigation.tsx`,
  `apps/web/hooks/{useNotifications.ts,useDashboardNotificationSocket.ts,useNotificationSocket.ts}`
- API/type boundaries: `apps/web/features/notifications/notificationsApi.ts`,
  `apps/web/features/portal-notifications/portalNotificationsApi.ts`,
  `packages/shared/src/index.ts`
- Presentation boundary: `apps/web/lib/i18n.ts`

## Direct title/body/message rendering audit

Notification list and detail consumers no longer render notification
`title`, `body`, or `message`; they use `notificationPresentation(eventType,
metadata)`. The remaining title/body reads in `apps/web/lib/i18n.ts` are
intentional compatibility fallbacks for legacy broadcast/records. Other search
matches (`dashboard-model.ts`, `dashboard-panels.tsx`, admin overview, and
`dashboard-shell.tsx`) are unrelated dashboard activity/KPI payloads, not the
notification DTO, and were not changed.

## Deferred phase

Removal/backfill of legacy database fields and legacy broadcast/template content
requires coordinated migration across all producers, stored records, and
external clients. It is tracked in `docs/violations-backlog.md` and is not part
of this safe foundation phase.
