# Hassad Platform

## What This Is

A full-featured SaaS platform for marketing agencies and B2B service providers. Manages CRM (leads/clients), proposals, contracts, projects, tasks, deliverables, invoices, payments, payroll, campaigns (ad campaign management with KPI tracking), chat, notifications, and AI integrations. Clients now have a comprehensive analytics dashboard (التقارير) aggregating all campaign performance data with KPI cards, charts, and smart tips alongside existing campaign, deliverable, and invoice views.

## Core Value

Marketers can be assigned to marketing tasks, create and manage campaigns with KPI tracking, and clients reliably receive analytics and notifications for every campaign on their project — same experience clients already have for deliverables and invoices on the portal homepage.

## Current State (shipped v1.1 — 2026-05-08)

- 6 phases across 2 milestones (v1.0: 3 phases, 6 plans; v1.1: 3 phases, 5 plans)
- 31 requirements delivered for v1.1 reports dashboard
- **Backend:** Two aggregate API endpoints (`/portal/reports`, `/portal/reports/timeline`) with client-scoped batch queries, period-over-period trends, Arabic localization, and rule-based smart tips
- **Frontend:** `/portal/reports` page with 4 KPI summary cards, bar chart, line chart, donut chart, sortable campaigns table, smart tips, and time range selector — all RTL Arabic with responsive layout
- **Integration:** RTK Query endpoints with full TypeScript interfaces, loading skeletons, error states, empty states
- **Navigation:** Portal sidebar and BottomNav updated with "التقارير" link
- Build verified: `turbo build --filter=api --filter=web` passes

## Current Milestone

**v1.2** — Next milestone to be defined.

## Next Milestone Goals

To be defined. Potential areas:
- Export/sharing features (PDF, email scheduled reports)
- Custom time range picker (date picker with custom range)
- Campaign health score
- Ad platform integration (Meta, Google, TikTok APIs)
- TypeScript strict mode enablement
- Rate limiting and CSRF protection
- Prisma migration workflow fix
- Hard delete → soft delete conversion for remaining models

## Requirements

### Validated

**v1.0 — Marketing System Readiness:**
- ✓ Campaign CRUD with permissions — v1.0
- ✓ KPI snapshots with audit logs — v1.0
- ✓ Campaign status machine — v1.0
- ✓ Task-campaign linkage — v1.0
- ✓ Client-facing campaign notifications — v1.0
- ✓ Client portal campaign listing + detail — v1.0
- ✓ WebSocket real-time notification push — v1.0
- ✓ Marketer task assignment restriction — v1.0
- ✓ Campaign-client integrity (server-side clientId) — v1.0
- ✓ Atomic KPI snapshot writes ($transaction) — v1.0
- ✓ Atomic notification creation ($transaction) — v1.0
- ✓ Observable notification failures (logger.error) — v1.0
- ✓ Live marketer dashboard KPIs — v1.0
- ✓ Real AlertList with kpiSnapshot data — v1.0
- ✓ API-wired task status dropdown — v1.0
- ✓ Real notification-based activity feed — v1.0
- ✓ Server-side deptName filtering — v1.0
- ✓ Portal campaigns error state — v1.0
- ✓ Portal campaign detail page — v1.0
- ✓ Portal dashboard campaign skeleton — v1.0
- ✓ Campaign card navigation links — v1.0

**v1.1 — Client Reports Dashboard (التقارير):**
- ✓ NAV-01: "التقارير" link in PortalSidebar — v1.1
- ✓ NAV-02: "التقارير" in BottomNav with BarChart3 icon — v1.1
- ✓ NAV-03: Navigation to `/portal/reports` — v1.1
- ✓ API-01 through API-12: All backend aggregate endpoints — v1.1
- ✓ UI-01 through UI-13: All frontend chart and widget components — v1.1
- ✓ INT-01 through INT-06: RTK Query integration, TypeScript types, loading/error/empty states, build pass — v1.1

### Active

To be defined for next milestone.

### Out of Scope

- Ad platform integration — separate product initiative
- A/B testing for campaigns — separate product initiative
- Automated campaign optimization — separate product initiative
- TypeScript strict mode — separate cross-cutting concern
- Hard-delete → soft-delete conversion — separate cross-cutting concern
- Rate limiting — separate security initiative
- CSRF protection — separate security initiative
- Prisma migration workflow fix — separate infrastructure initiative
- Real-time/live chart updates — marketing KPIs change daily
- Cross-client comparison — violates tenant isolation
- Drill-down to ad-group/keyword level — requires ad platform APIs
- Multi-currency display — SAR only
- Advanced chart types (funnel, cohort, retention) — overkill for current scope

## Context

**Current codebase state (post-v1.1):**
- Monorepo: npm workspaces + Turborepo with `apps/api`, `apps/web`, `packages/shared`
- NestJS 11 API with 17 modules, Prisma 6 on PostgreSQL 17
- Next.js 16 App Router with RTK Query, shadcn/ui, Tailwind CSS 4
- JWT auth with HttpOnly cookies, PermissionsGuard per-request
- Marketing module: campaign CRUD, KPI tracking, status machine, notifications
- Portal module: client dashboard with campaigns, reports (3,569 LOC), deliverables, invoices, activity feed
- Real-time: Socket.IO gateways for chat and notifications
- ~3,569 LOC added for v1.1 reports dashboard across 12+ files

## Constraints

- **Tech stack**: NestJS 11, Prisma 6, PostgreSQL 17, Next.js 16, React 19, Redux Toolkit 2, Tailwind CSS 4, shadcn/ui
- **TypeScript strictness**: `strict: false`, `strictNullChecks: false` — do not enable strict flags
- **No hard deletes**: All changes must use soft-delete conventions
- **No migration changes**: Use `prisma db push`, do not create migrations
- **Notifications after commit**: Notification failures must not roll back business data
- **Permissions**: Use existing permission keys for new endpoints
- **Response envelope**: All API responses wrapped in `{ success, data, error }`
- **No tests**: Verify via `turbo build` + manual QA

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Derive clientId from task's project, ignore frontend | Prevents campaign-client mismatch | ✓ Good |
| logger.error in notification catch blocks | Simple observability without new deps | ✓ Good |
| Fire-and-forget notifyClientAboutCampaign | Notifications must not roll back business data | ✓ Good |
| transformResponse flatten analytics onto campaign | Frontend reads .conversions not .analytics.conversions | ✓ Good |
| onChange → onBlur for KPI inputs | Per-keystroke API calls stole focus | ✓ Good |
| defaultValue for KPI input fields | Controlled value locked inputs | ✓ Good |
| Merge from latest snapshot on partial KPI update | Prevent data loss on single-field updates | ✓ Good |
| Use snapshot.revenue as spend proxy | Snapshot has no explicit spend field | ✓ Good |
| Period-over-period via equal-length prior window | Simple, fair comparison for any date range | ✓ Good |
| Distinct latest snapshot for KPI cards; all for timeline | Avoids double-counting while showing progression | ✓ Good |
| Default time range "Last 30 days" with day granularity | Balances data density with performance | ✓ Good |
| Metric switcher on bar/line charts | Users compare different KPIs on same axis | ✓ Good |
| Donut with inner total label | Serves as chart + summary stat | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-08 after v1.1 milestone completion*
