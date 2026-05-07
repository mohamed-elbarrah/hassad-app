# Roadmap: Hassad Platform

## Milestones

- ✅ **v1.0 Marketing System Readiness** — Phases 1-3 (shipped 2026-05-07)
- ○ **v1.1 Client Reports Dashboard (التقارير)** — Phases 4-6 (planned)

## Phases

<details>
<summary>✅ v1.0 Marketing System Readiness (Phases 1-3) — SHIPPED 2026-05-07</summary>

- [x] Phase 1: Data Integrity & API Safety (1/1 plan) — completed 2026-05-07
- [x] Phase 2: Marketer Dashboard UX (3/3 plans) — completed 2026-05-07
- [x] Phase 3: Client Portal UX (2/2 plans) — completed 2026-05-07

</details>

- [ ] **Phase 4: Backend Aggregates** — NestJS aggregate endpoints for multi-campaign KPI reporting
- [ ] **Phase 5: Frontend API + Navigation** — RTK Query wiring, sidebar nav, page shell with states
- [ ] **Phase 6: Charts & Widgets + QA** — Recharts components, smart tips, responsive layout, build verification

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Integrity & API Safety | v1.0 | 1/1 | Complete | 2026-05-07 |
| 2. Marketer Dashboard UX | v1.0 | 3/3 | Complete | 2026-05-07 |
| 3. Client Portal UX | v1.0 | 2/2 | Complete | 2026-05-07 |
| 4. Backend Aggregates | v1.1 | 0/? | Not started | - |
| 5. Frontend API + Navigation | v1.1 | 0/? | Not started | - |
| 6. Charts & Widgets + QA | v1.1 | 0/? | Not started | - |

---

## Phase Details

### Phase 4: Backend Aggregates
**Goal:** Client reports data endpoints return accurate, scoped, secure aggregate data for all dashboard widgets
**Depends on:** Phase 3 (client portal UX foundation)
**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, NAV-03
**Success Criteria** (what must be TRUE):
  1. `GET /portal/reports` returns composite summary with KPI totals, smart tips, top campaigns, and platform distribution
  2. `GET /portal/reports/timeline` returns time-series data grouped by month/week/day with Arabic labels
  3. All aggregate queries are strictly scoped to the authenticated client's `clientId` — no cross-client leakage
  4. Empty-state response returns well-formed zero-value shapes (not 404) when client has no campaigns
**Plans:** TBD

### Phase 5: Frontend API + Navigation
**Goal:** `/portal/reports` page is reachable, loads data via RTK Query, and handles all UI states
**Depends on:** Phase 4 (stable API shapes)
**Requirements:** NAV-01, NAV-02, NAV-03, INT-01, INT-02, INT-03, INT-04, INT-05
**Success Criteria** (what must be TRUE):
  1. "التقارير" link appears in PortalSidebar between "العقود" and "الفواتير"
  2. "التقارير" appears in BottomNav (mobile) with BarChart3 icon
  3. Clicking the link navigates to `/portal/reports` which loads and displays report data
  4. Page shows loading skeletons, error cards, and empty states (copied from `/portal/campaigns` patterns)
  5. RTK Query endpoints fetch and cache report data correctly with proper TypeScript types
**Plans:** TBD
**UI hint**: yes

### Phase 6: Charts & Widgets + QA
**Goal:** All dashboard visual components render with real data, matching the designer's UI exactly
**Depends on:** Phase 5 (page shell + API wired)
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13, INT-06
**Success Criteria** (what must be TRUE):
  1. 4 KPI summary cards show values with ↑/↓ trend arrows and Arabic compact formatting (1.2M, 45K)
  2. Monthly comparison bar chart (مقارنة الأداء) renders with Arabic month labels and metric switcher
  3. Performance trend line chart (تطور الأداء) renders with RTL-friendly time axis and area fill
  4. Spend distribution donut chart (توزيع الإنفاق الإعلاني) shows platform breakdown with center total
  5. Top-performing campaigns table (أفضل الإعلانات أداءً) is sortable by any metric with row navigation to campaign detail
  6. 4 smart tips cards (توصيات ذكية) display rule-based actionable insights with icons
  7. `turbo build --filter=api --filter=web` passes with zero errors
**Plans:** TBD
**UI hint**: yes

---
*Roadmap created: 2026-05-07*
*Last updated: 2026-05-07 after v1.1 milestone planning*
