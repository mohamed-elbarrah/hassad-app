# Project Research Summary

**Project:** Hassad Platform — Client Reports Dashboard (التقارير) v1.1
**Domain:** Client-facing marketing analytics dashboard (read-only aggregate view)
**Researched:** 2026-05-07
**Confidence:** HIGH

## Executive Summary

The Hassad Platform v1.1 milestone adds a **client-facing Reports Dashboard** inside the existing client portal. It aggregates multi-campaign KPIs (impressions, clicks, conversions, spend) into summary cards, bar/line/donut charts, a sortable top-campaigns table, and rule-based "smart tips." Research confirms this is a classic **read-only analytics overlay** on existing data — no new data stores, no write patterns, and no external integrations are required.

The recommended approach is to **extend the existing `PortalModule`** rather than create a standalone Reports module. Two new aggregate endpoints (`GET /portal/reports` for summary + widgets, `GET /portal/reports/timeline` for time-series charts) and five new `PortalService` methods are sufficient. On the frontend, Recharts v3 (already installed) plus the shadcn/ui `chart` component covers all required visualizations without adding new dependencies. All work stays within the established NestJS + Prisma + Next.js + RTK Query stack.

The primary risks are **N+1 snapshot queries** (mitigated by batch-fetching existing `getLatestSnapshots`), **frontend aggregate computation** (mitigated by computing everything server-side in `PortalService`), and **RTL Arabic formatting** (mitigated by `Intl.NumberFormat`/`Intl.DateTimeFormat` with `ar-SA` locale). No schema changes are needed, and no new npm packages are required beyond `npx shadcn add chart`.

## Key Findings

### Recommended Stack

See full analysis in [STACK.md](STACK.md). The existing stack already covers every requirement. Recharts v3 supports React 19 and provides BarChart, LineChart, and PieChart (for donut). The shadcn/ui `chart` wrapper adds Tailwind-styled tooltips, legends, and color-token theming with zero lock-in. TanStack Table is already installed for the sortable top-campaigns table. `Intl.NumberFormat` and `Intl.DateTimeFormat` handle Arabic compact numbers and month labels natively — no date/number libraries needed.

**Core technologies:**
- **Recharts ^3.8.1** — bar, line, donut rendering; already installed and React-19 compatible.
- **shadcn/ui Chart** — Tailwind-themed wrappers (`ChartContainer`, `ChartTooltipContent`, etc.); add via CLI.
- **TanStack Table ^8.21.3** — sortable "Top Performing Ads" table; already installed.
- **NestJS + Prisma** — new aggregate endpoints and grouping queries; no schema changes.
- **Intl APIs (native)** — compact notation (`1.2M`) and Arabic month names; no new dependencies.

### Expected Features

See full analysis in [FEATURES.md](FEATURES.md).

**Must have (table stakes):**
- KPI Summary Cards with trend indicators (↑/↓ %) — aggregate across all client campaigns.
- Monthly Comparison Bar Chart — Arabic month labels, metric switcher (clicks, impressions, conversions, spend).
- Performance Trend Line Chart — daily/weekly granularity, RTL-friendly time axis.
- Spend Distribution Donut Chart — by platform (Google, Meta, TikTok, etc.).
- Sortable Top Performing Campaigns Table — columns + sort by any metric.
- RTL Arabic Layout — entire page including charts, tooltips, and card order.
- Time Range Selector — preset buttons (Last 30 days, This month, Last 3 months).

**Should have (differentiators):**
- Smart Tips / Recommendations — rule-based MVP (4 static heuristics) turns reporting into actionable advice.
- Campaign Health Score — weighted KPI rollup (green/yellow/red) for at-a-glance status.

**Defer (v2+):**
- Export to PDF/Print — requires new library; not in v1.1 scope.
- Benchmark Comparison — needs external or manually maintained benchmark data.
- Anomaly Detection — needs historical baseline calculation.
- Custom Dashboard Builder — drag-and-drop persistence; major scope increase.
- Email/Scheduled Delivery — separate infrastructure initiative.

### Architecture Approach

See full analysis in [ARCHITECTURE.md](ARCHITECTURE.md). The dashboard is a **read-only aggregate view** entirely inside the Portal boundary. The recommended pattern is a **single composite endpoint** (`/portal/reports`) returning KPI cards, smart tips, top campaigns, and platform distribution in one payload, plus a **separate time-series endpoint** (`/portal/reports/timeline`) for chart data parameterized by date range and granularity. All aggregation lives in `PortalService`; the frontend receives shaped DTOs and only renders.

**Major components:**
1. **PortalController** — adds 2 new `@Get()` routes; reuses `resolveClientId()` and `PermissionsGuard`.
2. **PortalService** — adds 5 new methods: `getReportAggregates`, `getReportTimeSeries`, `getReportPlatformDistribution`, `getTopPerformingCampaigns`, `generateSmartTips`.
3. **portalApi (RTK Query)** — adds `getPortalReports` and `getReportTimeSeries` endpoints with cache tags.
4. **ReportsPage + 6 presentational components** — `ReportKpiCards`, `ReportBarChart`, `ReportLineChart`, `ReportDonutChart`, `ReportTopAdsTable`, `ReportSmartTips`.

### Critical Pitfalls

*Note: PITFALLS.md was not produced by the research agents, but the following critical issues are documented across FEATURES.md and ARCHITECTURE.md.*

1. **N+1 Snapshot Queries per Campaign** — Looping over campaigns and querying KPI snapshots individually causes severe performance regression. **Avoid:** always batch-fetch via `campaignId in [...]` using the existing `getLatestSnapshots()` helper.
2. **Frontend Aggregate Computation** — Computing totals, averages, or tips in React components violates the existing server-side shaping pattern and forces downloading all raw snapshots. **Avoid:** compute everything in `PortalService` and return shaped DTOs.
3. **Reusing `/portal/campaigns/summary` for the Dashboard** — The legacy endpoint returns a different shape (totalVisits, totalConversions, avgRoas). Extending it would break existing consumers (portal homepage). **Avoid:** create new `/portal/reports` and `/portal/reports/timeline` endpoints; leave legacy untouched.
4. **Creating a Separate Reports Module** — Reports have no independent domain; they read the same `Campaign` + `CampaignKpiSnapshot` tables that Portal and Marketing already own. A separate module adds indirection and requires `app.module.ts` wiring. **Avoid:** extend `PortalModule` directly.
5. **Missing Empty-State Guard** — New clients legitimately have zero campaigns. Returning 404 or throwing produces a broken UI. **Avoid:** return well-formed zero-value shapes (same pattern as existing `getCampaignSummary`).
6. **Cross-Client Data Leakage** — All aggregate queries MUST scope to `clientId` derived from the authenticated JWT. **Avoid:** never allow unscoped queries or global leaderboards.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Backend Aggregates
**Rationale:** All frontend work depends on knowing the API response shapes. The existing `PortalService` patterns (`getCampaignSummary`, `getLatestSnapshots`) provide a direct template.
**Delivers:** Two new endpoints (`GET /portal/reports`, `GET /portal/reports/timeline`) and five new `PortalService` methods.
**Addresses:** KPI cards, trends, monthly bar chart, trend line chart, spend donut, top campaigns table, smart tips (data layer).
**Avoids:** N+1 queries (batch-fetch snapshots), frontend computation (server-side aggregation), endpoint shape mismatch (new routes instead of extending legacy).

### Phase 2: Frontend API + Navigation Shell
**Rationale:** Once backend shapes are stable, finalize RTK Query types and add navigation so the page is reachable. The existing `/portal/campaigns` page is the closest reference for loading skeletons, error cards, and `dir="rtl"` patterns.
**Delivers:** `portalApi.ts` endpoints + TypeScript interfaces, `PortalSidebar` / `BottomNav` entries, `/portal/reports/page.tsx` shell with loading/error/empty states.
**Uses:** Existing RTK Query + baseQuery envelope unwrap pattern, existing `BarChart3` icon.
**Implements:** Navigation integration, page-level layout, API-to-UI wiring.

### Phase 3: Chart & Widget Components + QA
**Rationale:** Presentational components have no backend dependencies once data shapes are known; they can be built and tested in parallel. shadcn/ui `chart` component + Recharts covers all visuals.
**Delivers:** `ReportKpiCards`, `ReportBarChart`, `ReportLineChart`, `ReportDonutChart`, `ReportTopAdsTable`, `ReportSmartTips` — all wired into the page shell.
**Uses:** Recharts + shadcn/ui Chart wrappers, TanStack Table, `Intl` formatting helpers.
**Avoids:** Missing empty states, broken RTL layouts, generic chart colors (use existing navy/gold/emerald palette).

### Phase Ordering Rationale

- **Backend-first dependency:** Frontend types and components cannot be finalized until the aggregate endpoint response shape is stable. The existing `PortalService` provides a clear template, so backend work is low-risk and fast.
- **Navigation early:** Adding the sidebar/bottom-nav entry is safe and makes the page testable as soon as the shell exists.
- **Widgets parallelizable:** All six presentational components are pure props-driven; they can be developed in any order once the page shell and API hooks exist.
- **Anti-pattern avoidance:** Keeping everything inside `PortalModule` avoids the pitfall of creating an unnecessary separate module. Using a single composite endpoint plus a dedicated timeline endpoint follows the established pattern and prevents legacy endpoint breakage.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Charts & Widgets):** RTL rendering behavior with Recharts + Arabic month labels may need a quick spike if `recharts` RTL support is insufficient (`direction: rtl` wrapper or custom tick formatter).
- **Phase 1 (Backend):** Confirm whether `kpiSnapshot` table columns (`impressions`, `clicks`, `conversions`, `spend`) all exist and are numeric; the AGENTS.md notes the schema doc is stale (50 models, some undocumented).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backend):** NestJS controller + service extension is a well-established pattern in this codebase (14 modules already).
- **Phase 2 (Navigation + RTK):** Adding nav items and RTK Query endpoints follows exact existing conventions in `portalApi.ts` and `PortalSidebar.tsx`.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via direct `package.json` inspection, Context7 Recharts docs, and official shadcn/ui docs. All recommended libraries are already installed except the shadcn `chart` component (zero-risk CLI add). |
| Features | HIGH | Derived from standard marketing analytics dashboard patterns (Google Ads, Meta Ads Manager) and explicitly scoped by the v1.1 milestone. Anti-features clearly defer scope creep. |
| Architecture | HIGH | Every pattern was derived from direct codebase inspection of `PortalController`, `PortalService`, `portalApi.ts`, `PortalSidebar.tsx`, and `schema.prisma`. No speculative patterns. |
| Pitfalls | MEDIUM | No dedicated PITFALLS.md was produced, but pitfalls are well-documented across ARCHITECTURE.md (Anti-Patterns) and FEATURES.md (Anti-Features). Confidence would be HIGH if a dedicated pitfalls file existed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Schema validation:** The `kpiSnapshot` table columns required for aggregation (`impressions`, `clicks`, `conversions`, `spend`) must be confirmed in the actual Prisma schema (AGENTS.md warns the schema doc is stale). Handle during Phase 1 backend implementation.
- **Recharts RTL behavior:** While Recharts supports SVG rendering, actual RTL tick placement and tooltip alignment need a quick manual verification during Phase 3.
- **Staleness of `@types/recharts`:** Must remove `@types/recharts@1.8.29` from `apps/web/package.json` before using Recharts v3 to avoid type conflicts. Handle immediately before Phase 3.
- **No PITFALLS.md produced:** Research agent gap. Mitigated by extracting anti-patterns from ARCHITECTURE.md and anti-features from FEATURES.md, but future projects should ensure the PITFALLS agent completes.

## Sources

### Primary (HIGH confidence)
- Context7 `/recharts/recharts` — Recharts v3 component exports, `ResponsiveContainer`, `PieChart` donut (`innerRadius`) pattern, `BarChart`/`LineChart` examples.
- Official shadcn/ui docs (`https://ui.shadcn.com/docs/components/chart`) — `chart` component installation, Recharts v3 theming with `var(--chart-*)`, Tailwind v4 compatibility.
- Direct codebase inspection — `apps/web/package.json`, `apps/api/src/modules/portal/portal.controller.ts`, `apps/api/src/modules/portal/services/portal.service.ts`, `apps/web/features/portal/portalApi.ts`, `apps/web/components/portal/PortalSidebar.tsx`, `apps/web/app/(portal)/portal/campaigns/page.tsx`, `apps/api/prisma/schema.prisma`.

### Secondary (MEDIUM confidence)
- Standard marketing analytics dashboard patterns (Google Ads Reporting, Meta Ads Manager) — feature expectations and UX conventions.
- `AGENTS.md` and `PROJECT.md` — Hassad Platform context, monorepo commands, auth architecture, critical business logic conventions.

### Tertiary (LOW confidence)
- `moment-hijri` or Hijri date support — noted as a future possibility but not required for v1.1 MVP (Gregorian Arabic `ar-SA` is sufficient).

---
*Research completed: 2026-05-07*
*Ready for roadmap: yes*
