# ROADMAP.md — Hassad Platform Improvement Plan

> Generated from full system audit on 2026-05-02.
> Covers: API (14 modules), DB (50 Prisma models), UI (15+ pages, 106 RTK endpoints), shared package.

---

## Phase ordering and dependency graph

```
Phase 0: Foundation (prerequisite for everything)
  ↓
Phase 1: Server-side gaps (prerequisite for Phase 2)
  ↓
Phase 2: Cross-module integration (depends on Phases 0+1)
  ↓
Phase 3: UI consistency (can start in parallel with Phase 1)
  ↓
Phase 4: Real-time (depends on Phase 1 chat/notifications fixes)
  ↓
Phase 5: Schema & spec alignment (prerequisite to Phase 6 AI)
  ↓
Phase 6: AI & Chat enhancement
  ↓
Phase 7: Polish & edge cases
```

**Note:** Phase 0 is mandatory before anything else. Phases 1 and 3 can run in parallel.

---

## Phase 0: Foundation Fixes (must-do, prerequisite)

| # | Area | Task | File(s) to touch | Why |
|---|---|---|---|---|
| 0.1 | UI | Add `middleware.ts` edge auth guard | `apps/web/middleware.ts` (new) | Auth is client-side only — flash of content on every page load. Middleware checks JWT cookie at edge before render. |
| 0.2 | UI | Add global `error.tsx` in `(dashboard)/` + per-route `error.tsx` for all role subdirs | `apps/web/app/(dashboard)/error.tsx`, `dashboard/admin/error.tsx`, `dashboard/pm/error.tsx`, `dashboard/sales/error.tsx`, `dashboard/finance/error.tsx`, `dashboard/accountant/error.tsx`, `dashboard/marketing/error.tsx`, `dashboard/employee/error.tsx`, `(portal)/error.tsx` | Zero error boundaries today — any unhandled API exception crashes to white screen |
| 0.3 | UI | Standardize loading pattern: adopt skeleton-grid-matching-content (PM project detail pattern) | All page.tsx files across `(dashboard)/dashboard/*/` and `(portal)/` | 4 different loading philosophies (spinner, full-screen skeleton, inline skeleton, nothing) |
| 0.4 | UI | Create `@/lib/format.ts` — shared currency + date + locale utilities | `apps/web/lib/format.ts` (new), then replace inline formatting in all pages | 3 currencies (SAR/DZD/USD) and 4 date locales (`en-GB`, `ar-SA`, `ar-DZ`, `ar-EG`) across the app |
| 0.5 | UI | Add empty states to all Kanban board pages (sales pipeline, employee, marketing) | `apps/web/app/(dashboard)/dashboard/sales/pipeline/page.tsx`, `dashboard/employee/page.tsx`, `dashboard/marketing/page.tsx` | Kanban pages show nothing when data is empty |
| 0.6 | UI | Standardize page title to `text-3xl font-bold tracking-tight` everywhere | All page.tsx files | 3 different title sizes currently (`text-3xl font-bold tracking-tight`, `text-2xl font-semibold`, `text-xl font-semibold`) |

**Effort estimate:** ~9h total (0.1=1h, 0.2=2h, 0.3=3h, 0.4=1h, 0.5=1.5h, 0.6=0.5h)

---

## Phase 1: Server-side Gaps (API completeness)

| # | Module | Task | File(s) to touch |
|---|---|---|---|
| 1.1 | Marketing | Add `GET /campaigns` (list all, paginated, filtered), `PATCH /campaigns/:id` (update details), `POST /campaigns/:id/kpis`, `GET /campaigns/:id/kpis` | `apps/api/src/modules/marketing/controllers/campaigns.controller.ts`, `services/campaigns.service.ts`, `dto/campaign.dto.ts` |
| 1.2 | Marketing | Add Prisma models: `CampaignKpiSnapshot`, `CampaignKpiAuditLog`, `AdPlatformConnection` | `apps/api/prisma/schema.prisma` |
| 1.3 | Chat | Add `GET /conversations` (list current user's conversations) | `apps/api/src/modules/chat/controllers/chat.controller.ts`, `services/chat.service.ts` |
| 1.4 | Chat | Add WebSocket gateway (`@nestjs/websockets`) for real-time messaging | `apps/api/src/modules/chat/gateway/chat.gateway.ts` (new), `chat.module.ts` |
| 1.5 | Notifications | Add Socket.io gateway for real-time push | `apps/api/src/modules/notifications/gateway/notifications.gateway.ts` (new), `notifications.module.ts` |
| 1.6 | Sales | Extend `GET /sales/metrics` with per-salesperson breakdown, activity timeline | `apps/api/src/modules/sales/sales.controller.ts`, `sales.service.ts` |
| 1.7 | Portal | Add `GET /portal/dashboard` (summary), `GET /portal/contracts`, `GET /portal/invoices` | `apps/api/src/modules/portal/controllers/portal.controller.ts`, `services/portal.service.ts` |
| 1.8 | Tasks | Fix `toggleArchive()` — add `archivedAt` field to Prisma Task model | `apps/api/prisma/schema.prisma`, `apps/api/src/modules/tasks/services/tasks.service.ts` |
| 1.9 | Finance | Add `GET /payment-tickets/:id` (single ticket detail) | `apps/api/src/modules/finance/controllers/finance.controller.ts`, `services/finance.service.ts` |
| 1.10 | Finance | Standardize HTTP methods: align spec ↔ code (PATCH→POST for mark-read, mark-paid) | Controllers for notifications, finance |

**Effort estimate:** ~18h total

---

## Phase 2: Cross-Module Integration (workflow connections)

| # | What | File(s) to touch | Detail |
|---|---|---|---|
| 2.1 | Task → Deliverable: auto-create Deliverable when task reaches DONE | `tasks.service.ts` (approve method), `portal.service.ts` | When a task with a marketing/design department is approved, auto-create a visible deliverable for the client portal |
| 2.2 | Invoice → Task/Project: link line items to projects/tasks | `schema.prisma`, `finance.service.ts`, `finance.dto.ts` | Allow creating invoices from project budgets with line-item breakdown |
| 2.3 | Proposal → Contract → Project: auto-populate project budget/scope from proposal | `proposals.service.ts` (approve), `contracts.service.ts` (sign) | Proposal pricing/services should flow into the created project |
| 2.4 | Contract expiry → auto-flag client for re-engagement | `contracts.service.ts`, cron job in `contracts.module.ts` | When contract → EXPIRED, create a notification + lead re-assignment trigger |
| 2.5 | Audit all notification event emissions across every module | All services that perform state changes | Ensure every state change (task, contract, lead, campaign, invoice, deliverable) emits a notification |
| 2.6 | Multi-currency: add `currency` to Invoice, Contract, Campaign; create CurrencySetting model | `schema.prisma`, `finance.service.ts`, `marketing.service.ts`, frontend `format.ts` | Admin-selectable default currency via settings, per-entity currency override |

**Effort estimate:** ~16h total

---

## Phase 3: UI Consistency & Design System

| # | Task | File(s) to touch |
|---|---|---|
| 3.1 | Extract `resolveEntityUrl` and `formatRelativeTime` to `@/lib/notifications.ts` | New file, then refactor `NotificationsDropdown.tsx` and `notifications/page.tsx` |
| 3.2 | Replace all hardcoded data in PM, marketing, finance dashboards with real API calls | `pm/page.tsx`, `marketing/page.tsx`, `finance/page.tsx` |
| 3.3 | Replace full-screen spinners (`finance/*`, `invoices`) with skeleton-grid pattern | `finance/page.tsx`, `finance/invoices/page.tsx`, all pages using `Loader2` |
| 3.4 | Add `loading.tsx` to `(dashboard)/` and each role subdirectory | `loading.tsx` files in each route group |
| 3.5 | Create shared `<PageLayout>` and `<PageHeader>` components | `components/common/PageLayout.tsx`, `PageHeader.tsx` (new) |
| 3.6 | Add loading skeleton, empty state, error boundary to sales pipeline page | `sales/pipeline/page.tsx` |
| 3.7 | Add Redux hydration guard to account page | `account/page.tsx` |
| 3.8 | Add empty-section fallback to sidebar when role matches zero nav items | `app-sidebar.tsx` |

**Effort estimate:** ~12h total

---

## Phase 4: Real-time & Production Readiness

| # | Task | File(s) to touch |
|---|---|---|
| 4.1 | Install `@nestjs/platform-socket.io` and `socket.io-client` | `apps/api/package.json`, `apps/web/package.json` |
| 4.2 | Chat WebSocket gateway | `chat.gateway.ts` — handles message send, receive, typing indicators |
| 4.3 | Notification WebSocket gateway | `notifications.gateway.ts` — pushes new notifications + unread count updates |
| 4.4 | WebSocket fallback → polling | Frontend: if Socket.io disconnects, fall back to 30s REST polling |
| 4.5 | File upload progress indicator | `TaskForm.tsx` and similar upload components |

**Effort estimate:** ~10h total

---

## Phase 5: Schema & Spec Alignment

| # | Task | File(s) to touch |
|---|---|---|
| 5.1 | Add missing DB tables: `campaign_kpi_snapshots`, `campaign_kpi_audit_logs`, `ad_platform_connections` | `schema.prisma` |
| 5.2 | Add `archivedAt` to Task model | `schema.prisma` |
| 5.3 | Add `currency` to Invoice, Contract, Campaign | `schema.prisma` |
| 5.4 | Update `DATA_BASE_V2.md` to include payment tables, employee, salary, ledger, bank accounts | `.agent/DATA_BASE_V2.md` |
| 5.5 | Update `NESTJS_API_V2.md` to include payments module, sales module, all extra endpoints | `.agent/NESTJS_API_V2.md` |

**Effort estimate:** ~4h total

---

## Phase 6: AI & Chat Enhancement

| # | Task | File(s) to touch |
|---|---|---|
| 6.1 | Replace AI stub logic with real Gemini API integration | `ai.service.ts` — uses `GEMINI_API_KEY` from env |
| 6.2 | Wire AI suggestions to actual actions (notifications, lead stage suggestions) | `ai.service.ts`, `notifications.service.ts` |
| 6.3 | Add message read receipts, typing indicators, message editing/deletion to chat | `chat.gateway.ts`, `chat.service.ts`, frontend chat components |

**Effort estimate:** ~8h total

---

## Phase 7: Polish & Edge Cases

| # | Task | File(s) to touch |
|---|---|---|
| 7.1 | Add `loading.tsx` + `error.tsx` to `(portal)/` route group | `(portal)/loading.tsx`, `(portal)/error.tsx` |
| 7.2 | Add `not-found.tsx` to role subdirectories | `not-found.tsx` per role dir |
| 7.3 | Add pagination limits + sorting to all list endpoints | Various controllers and services |
| 7.4 | Audit notification events completeness across all modules | Verify every status/state change emits a `notificationEvent` + `notification` |
| 7.5 | Add `.env.example` for Socket.io config | `apps/api/.env.example`, `apps/web/.env.example` |

**Effort estimate:** ~6h total

---

## Summary

| Phase | Focus | Effort | Dependencies |
|---|---|---|---|
| 0 | Foundation (auth, error boundaries, loading, formatting, empty states) | ~9h | None |
| 1 | Server-side gaps (missing endpoints, WebSocket, schema) | ~18h | Phase 0 |
| 2 | Cross-module workflows (auto-create, auto-populate, notifications) | ~16h | Phase 0, Phase 1 |
| 3 | UI consistency (design system, shared components) | ~12h | Phase 0 (can run parallel to 1) |
| 4 | Real-time (Socket.io, chat/notifications push) | ~10h | Phase 1 (chat + notifications) |
| 5 | Schema & spec alignment | ~4h | Phase 1.2 (marketing tables) |
| 6 | AI & Chat enhancement | ~8h | Phase 1 (chat WS + AI cleanup) |
| 7 | Polish & edge cases | ~6h | Phases 0-3 |
| **Total** | | **~83h** | |

---

## Key architectural decisions (from user input)

- **Multi-currency**: Admin selects default currency from settings. Each invoice/contract/campaign can override. Store in `CurrencySetting` model.
- **Real-time**: Socket.io (`@nestjs/platform-socket.io` + `socket.io-client`). Chat messages + notifications pushed via WebSocket, fallback to REST polling.
