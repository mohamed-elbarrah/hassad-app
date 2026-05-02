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

## Phase 0: Foundation Fixes (must-do, prerequisite) — DONE

| # | Area | Task | Status |
|---|---|---|---|
| 0.1 | UI | Upgrade `proxy.ts` edge auth guard with JWT verification via `jose` | DONE |
| 0.2 | UI | Add global `error.tsx` + per-route `error.tsx` for all 8 role subdirs + portal | DONE |
| 0.3 | UI | Standardize loading pattern to skeleton-grid-matching-content (PM project detail pattern) | DONE |
| 0.4 | UI | Create `@/lib/format.ts` — shared currency + date + locale utilities, replace all inline formatting | DONE |
| 0.5 | UI | Add `EmptyState` component + empty states to Kanban pages (employee, marketing) | DONE |
| 0.6 | UI | Standardize page title to `text-3xl font-bold tracking-tight` everywhere | DONE |

**Completed:** 2026-05-02. Build verified: `turbo build` passes (shared + api + web).

---

## Phase 1: Server-side Gaps (API completeness) — DONE

| # | Module | Task | Status |
|---|---|---|---|
| 1.1 | Marketing | `GET /campaigns` + `PATCH /campaigns/:id` | DONE |
| 1.2 | Marketing | KPI models (CampaignKpiSnapshot, etc.) | DEFERRED to Phase 5 |
| 1.3 | Chat | `GET /conversations` | DONE |
| 1.4 | Chat | WebSocket gateway | DEFERRED to Phase 4 |
| 1.5 | Notifications | Socket.io gateway | DEFERRED to Phase 4 |
| 1.6 | Sales | `GET /sales/performance` + `GET /sales/activity` | DONE |
| 1.7 | Portal | `GET /portal/dashboard`, `/contracts`, `/invoices` | DONE |
| 1.8 | Tasks | `toggleArchive()` with `archivedAt` field | DONE |
| 1.9 | Finance | `GET /payment-tickets/:id` | DONE |
| 1.10 | Spec | Updated NESTJS_API_V2.md with all new endpoints | DONE |

---

## Phase 2: Cross-Module Integration (workflow connections) — DONE

| # | What | Status |
|---|---|---|
| 2.1 | Task → Deliverable: auto-create on task DONE (design/content/marketing depts) | DONE |
| 2.2 | Invoice → Task/Project line items (InvoiceItem model) | DONE |
| 2.3 | Proposal → Contract → Project: auto-populate from proposal data | DONE |
| 2.4 | Contract expiry → cron job + notifications (7-day warning + expired) | DONE |
| 2.5 | P0 notification gaps fixed: contract sign/activate/cancel/send, campaign status, lead stage/assign, project status | DONE |
| 2.6 | Multi-currency: `currency` field on Invoice, Contract, Campaign + CurrencySetting model | DONE |

---

## Phase 3: UI Consistency & Design System — DONE

| # | Task | Status |
|---|---|---|
| 3.1 | `resolveEntityUrl` + `formatRelativeTime` extracted to `@/lib/notifications.ts` | DONE (Phase 0) |
| 3.2 | Replace hardcoded data in dashboards with real API calls | DEFERRED (requires frontend API slices) |
| 3.3 | Replace full-screen spinners with skeleton-grid pattern | DONE (Phase 0 — finance dashboard) |
| 3.4 | Add `loading.tsx` to `(dashboard)/`, `(portal)/`, and 6 role subdirectories | DONE |
| 3.5 | Create `PageLayout` + `PageHeader` shared components | DONE |
| 3.6 | Sales pipeline: already has loading skeleton, error state, empty banner | DONE (already existed) |
| 3.7 | Account page: Redux hydration guard with skeleton fallback | DONE |
| 3.8 | Sidebar: empty-section fallback when role has zero nav items | DONE |

---

## Phase 4: Real-time & Production Readiness — DONE

| # | Task | Status |
|---|---|---|
| 4.1 | Install `@nestjs/platform-socket.io`, `socket.io`, `socket.io-client` | DONE |
| 4.2 | Chat WebSocket gateway (rooms, send, typing) | DONE |
| 4.3 | Notification WebSocket gateway (push, unread count, broadcast) | DONE |
| 4.4 | Frontend socket client + hooks (`useSocket`, `useChatSocket`, `useNotifications`) | DONE |
| 4.5 | WebSocket auth guard (`WsAuthGuard`) + `IoAdapter` in `main.ts` | DONE |
| 4.6 | Event emitters wired: `chat.messageCreated`, `notification.created`, `notification.unreadCount`, `notification.broadcast` | DONE |
| 4.7 | File upload progress indicator | DEFERRED (functional uploads exist, progress bar not yet) |

---

## Phase 5: Schema & Spec Alignment — DONE

| # | Task | Status |
|---|---|---|
| 5.1 | Add `CampaignKpiSnapshot`, `CampaignKpiAuditLog`, `AdPlatformConnection` models | DONE |
| 5.2 | Add `archivedAt` to Task model | DONE (Phase 1) |
| 5.3 | Add `currency` to Invoice, Contract, Campaign + `CurrencySetting` model | DONE (Phase 2) |
| 5.4 | Update `DATA_BASE_V2.md` to include missing models | PENDING |
| 5.5 | Update `NESTJS_API_V2.md` to include all new endpoints | PENDING |

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
