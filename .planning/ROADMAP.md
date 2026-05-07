# Roadmap: Hassad Platform — Marketing System Readiness

## Overview

A targeted 3-phase refactoring of the existing marketing subsystem to fix 14 bugs and gaps. Phase 1 secures data integrity (atomic transactions, enforced clientId derivation, observable error logging). Phase 2 makes the marketer dashboard functional with real data. Phase 3 completes the client portal campaign experience — error states, detail pages, and navigation.

## Phases

- [ ] **Phase 1: Data Integrity & API Safety** — Atomic transactions, enforced clientId derivation, and observable notification failures
- [ ] **Phase 2: Marketer Dashboard UX** — Real KPI data, working task management, live alerts, and actual activity feed
- [ ] **Phase 3: Client Portal UX** — Error states, campaign detail page with KPI history, loading skeletons, and navigation links

## Phase Details

### Phase 1: Data Integrity & API Safety
**Goal**: Campaign data is consistent and auditable; client notification failures are observable in production logs.
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04
**Success Criteria** (what must be TRUE):
  1. Campaign creation always links to the correct client derived from the task's project — no mismatched campaign-client pairs can occur regardless of what the frontend sends
  2. KPI snapshot creation is atomic — budget updates, snapshot rows, and audit log entries all succeed or none do; no partial state is observable
  3. Notification dispatch is atomic — notification events and notification rows are created together; no orphaned event rows exist in the database
   4. Failed client notifications produce observable `logger.error` entries with stack traces, making every silent failure traceable in production logs
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Enforce clientId from task.project in create(), wrap KPI snapshot and notification creation in prisma.$transaction, add logger.error to all 4 notification catch blocks

### Phase 2: Marketer Dashboard UX
**Goal**: Marketers see real data on their dashboard — actual KPIs, campaign alerts, working task management, and live activity feed.
**Depends on**: Phase 1
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05
**Success Criteria** (what must be TRUE):
  1. Marketer dashboard KPI cards display live data — active campaigns count, budget used, average ROAS — reflecting actual database values, not hardcoded zeros
  2. AlertList shows real campaign alerts (deadline warnings, budget thresholds) derived from actual campaign data in the API response
  3. Marketer can change a task's status from the dashboard dropdown and the change persists across page reloads (actual `PATCH /tasks/:id/status` call)
  4. Activity feed shows actual notification events (campaign started, paused, completed, KPI updated) fetched from the notifications API
  5. Marketing tasks page shows only MARKETING-department tasks via server-side `dept=MARKETING` filter, not client-side JS filtering
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Create `GET /campaigns/my-stats` endpoint for KPI cards + enrich `GET /tasks/my` with campaign data and `deptName` filter
- [ ] 02-02-PLAN.md — Wire dashboard KPI cards to `useGetMyCampaignStatsQuery`, AlertList to kpiSnapshot data, and activity feed to notifications API
- [ ] 02-03-PLAN.md — Add `PATCH /tasks/:id/status` endpoint + wire tasks page to server-side dept filter and API status mutation

**UI hint**: yes

### Phase 3: Client Portal UX
**Goal**: Clients have a complete campaign experience — reliable error handling, detailed campaign pages with KPI history, loading states, and seamless navigation.
**Depends on**: Phase 1
**Requirements**: WEB-06, WEB-07, WEB-08, WEB-09, WEB-10
**Success Criteria** (what must be TRUE):
  1. Client sees an error message (not a blank screen) when the campaigns API fails, with a visible retry affordance
  2. Client can navigate from the campaign list to a dedicated campaign detail page showing full KPI history in chronological order, status timeline, and budget breakdown using existing card/table patterns
  3. Client portal dashboard campaign summary shows a loading skeleton during fetch instead of a misleading "no campaigns" empty message
  4. Client can click any campaign card in the list to navigate to its detail page via a clearly identifiable link
  5. Campaign detail page data is fetched via a dedicated RTK Query hook (`useGetPortalCampaignQuery`) and renders all KPI snapshots chronologically
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3. Phase 2 and 3 both depend on Phase 1 but are independent of each other.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Integrity & API Safety | 0/1 | Not started | - |
| 2. Marketer Dashboard UX | 0/3 | Planned | - |
| 3. Client Portal UX | 0/0 | Not started | - |
