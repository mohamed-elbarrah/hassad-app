# Architecture Research: Client Reports Dashboard (التقارير)

**Domain:** Client-facing analytics dashboard for multi-campaign performance aggregation
**Researched:** 2026-05-07
**Confidence:** HIGH — All patterns are derived directly from existing codebase inspection.

---

## System Overview

The Client Reports Dashboard is a **read-only, aggregate analytics view** that sits entirely within the existing Portal module boundary. It consumes the same `Campaign` + `CampaignKpiSnapshot` data that v1.0 already writes and serves. No new data stores, no new write patterns — only new **read-aggregate** endpoints and a new frontend page.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /portal      │  │ /portal      │  │ /portal      │     │
│  │ /reports     │  │ /campaigns   │  │ /campaigns/:id│    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────┴─────────────────┴─────────────────┴───────┐     │
│  │           RTK Query (portalApi slice)             │     │
│  │  • getCampaignSummary (existing)                  │     │
│  │  • getPortalCampaigns (existing)                  │     │
│  │  • getPortalReports (NEW)                         │     │
│  │  • getReportTimeSeries (NEW)                      │     │
│  └──────────────────────┬────────────────────────────┘     │
│                         │ baseQuery (envelope unwrap)      │
├─────────────────────────┼──────────────────────────────────┤
│                         │ HTTPS /v1                        │
│  ┌──────────────────────┴────────────────────────────┐     │
│  │           NestJS PortalController                 │     │
│  │  @Controller() @UseGuards(JwtAuthGuard,             │     │
│  │              PermissionsGuard)                      │     │
│  │                                                   │     │
│  │  GET portal/reports           ← NEW               │     │
│  │  GET portal/reports/timeline  ← NEW               │     │
│  │  GET portal/campaigns/summary  (existing)         │     │
│  │  GET portal/campaigns          (existing)         │     │
│  └──────────────────────┬────────────────────────────┘     │
│                         │                                │
│  ┌──────────────────────┴────────────────────────────┐     │
│  │           PortalService (Injectable)                │     │
│  │  • getCampaignSummary()        (existing)         │     │
│  │  • findCampaignsByClient()     (existing)         │     │
│  │  • getReportAggregates()       ← NEW               │     │
│  │  • getReportTimeSeries()       ← NEW               │     │
│  │  • getReportPlatformDistribution() ← NEW            │     │
│  │  • getTopPerformingCampaigns()   ← NEW               │     │
│  └──────────────────────┬────────────────────────────┘     │
│                         │ Prisma queries (read-only)       │
│  ┌──────────────────────┴────────────────────────────┐     │
│  │  PostgreSQL — existing tables:                      │     │
│  │  • campaigns (clientId, platform, budgetSpent, ...) │     │
│  │  • campaign_kpi_snapshots (recordedAt, all KPIs)  │     │
│  │  • No schema changes needed for v1.1              │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `PortalController` | HTTP routing, auth/permission gating, `resolveClientId()` | `PortalService` |
| `PortalService` | All Prisma queries, data transformation, aggregation logic | `PrismaService`, `NotificationsService` (not needed for reads) |
| `portalApi` (RTK) | Frontend data fetching, caching, tag invalidation | `baseQuery` → NestJS API |
| `ReportsPage` | Page-level layout, composed chart/table sections | `portalApi` hooks + local presentational components |
| `KpiCards` | 4 summary cards with trend sparklines | `ReportsPage` (props) |
| `PerformanceBarChart` | Monthly comparison bar chart | `ReportsPage` (props) |
| `PerformanceLineChart` | Trend-over-time line chart | `ReportsPage` (props) |
| `SpendDonutChart` | Platform spend distribution | `ReportsPage` (props) |
| `TopAdsTable` | Sortable top-performing campaigns table | `ReportsPage` (props) |
| `SmartTips` | Insight cards derived from aggregate data | `ReportsPage` (props) |

---

## Recommended Architecture

### New vs Modified — Explicit Inventory

#### NEW Backend Components

| Component | Path | Rationale |
|-----------|------|-----------|
| `GET /portal/reports` | `PortalController` | Main aggregate endpoint returning KPI cards, smart tips, top campaigns, platform distribution in a single payload to reduce round trips. |
| `GET /portal/reports/timeline` | `PortalController` | Time-series data for bar + line charts. Separate endpoint because it is parameterised (`from`, `to`, `granularity`) and heavier than the summary. |
| `PortalService.getReportAggregates()` | `portal.service.ts` | Computes cross-campaign totals, averages, and period-over-period deltas. |
| `PortalService.getReportTimeSeries()` | `portal.service.ts` | Groups `CampaignKpiSnapshot` by month (or week) and aggregates impressions/clicks/conversions/spend. |
| `PortalService.getReportPlatformDistribution()` | `portal.service.ts` | Sums `budgetSpent` per `CampaignPlatform` for the donut chart. |
| `PortalService.getTopPerformingCampaigns()` | `portal.service.ts` | Returns campaigns sorted by a chosen metric (default: `roas` or `conversionRate`) with their latest snapshot. |
| `PortalService.generateSmartTips()` | `portal.service.ts` | Pure function: takes aggregate data, returns 0–4 insight objects. No DB hits. |

#### MODIFIED Backend Components

| Component | Change | Rationale |
|-----------|--------|-----------|
| `PortalController` | Add 2 new `@Get()` routes | Follows existing controller pattern (`portal/campaigns`, `portal/campaigns/summary`). Keep portal-scoped routes together. |
| `PortalService` | Add 5 new public methods + 2–3 private helpers | Existing `getCampaignSummary()` is the template. Reuse `getLatestSnapshots()` and `emptyAnalytics()` private helpers. |

#### NEW Frontend Components

| Component | Path | Rationale |
|-----------|------|-----------|
| `PortalReportsPage` | `app/(portal)/portal/reports/page.tsx` | Replace current redirect. Composes sections, handles loading/error/empty states. |
| `ReportKpiCards` | `app/(portal)/portal/reports/_components/ReportKpiCards.tsx` | 4 cards: Conversion Rate, Clicks, Impressions, Total Spend. Each shows current value + trend indicator (up/down vs previous period). |
| `ReportBarChart` | `app/(portal)/portal/reports/_components/ReportBarChart.tsx` | Monthly performance comparison. Uses `recharts` or `chart.js` (see Stack note). |
| `ReportLineChart` | `app/(portal)/portal/reports/_components/ReportLineChart.tsx` | Performance trend over time. Same chart library as bar chart for consistency. |
| `ReportDonutChart` | `app/(portal)/portal/reports/_components/ReportDonutChart.tsx` | Ad spend by platform. |
| `ReportTopAdsTable` | `app/(portal)/portal/reports/_components/ReportTopAdsTable.tsx` | Sortable table. "Ads" = campaigns in current schema. Columns: name, platform, impressions, clicks, conversions, roas, spend. |
| `ReportSmartTips` | `app/(portal)/portal/reports/_components/ReportSmartTips.tsx` | 4 insight cards with icon + text. |

#### MODIFIED Frontend Components

| Component | Change | Rationale |
|-----------|--------|-----------|
| `PortalSidebar.tsx` | Insert `"التقارير"` into `NAV_ITEMS` | Link between "الحملات" and "الفواتير" per design spec. |
| `BottomNav.tsx` | Insert `"التقارير"` into mobile `NAV_ITEMS` | Mobile parity. Use `BarChart3` icon (already imported in sidebar; mobile nav currently lacks it). |
| `portalApi.ts` | Add `getPortalReports` and `getReportTimeSeries` endpoints | RTK Query caching with `providesTags: ['PortalReports', 'ReportTimeline']`. |
| `portalApi.ts` | Add `PortalReportsResponse`, `ReportTimelineResponse`, `SmartTip`, `TopCampaign` interfaces | TypeScript types for the new payload shapes. |

---

## Data Flow

### Aggregate Report Flow (KPI Cards + Tips + Donut + Table)

```
Client loads /portal/reports
         ↓
ReportsPage mounts → dispatch getPortalReports()
         ↓
portalApi (RTK) → baseQuery unwraps { success, data, error }
         ↓
GET /v1/portal/reports
         ↓
PortalController.resolveClientId(user) → clientId
         ↓
PortalService.getReportAggregates(clientId)
   ├─ fetch campaigns + latest snapshots (reuse getLatestSnapshots)
   ├─ compute totals (sum impressions, clicks, conversions, spend)
   ├─ compute averages (avg conversionRate, avg ctr)
   ├─ compute deltas vs previous period (7-day or 30-day)
   ├─ getTopPerformingCampaigns(clientId, sortBy='roas', limit=10)
   ├─ getReportPlatformDistribution(clientId)
   └─ generateSmartTips(aggregates)
         ↓
Prisma read queries (no transaction needed — read-only)
         ↓
JSON response wrapped by ResponseInterceptor → { success: true, data: {...} }
         ↓
RTK Query cache update → UI re-renders sections
```

### Time-Series Flow (Bar + Line Charts)

```
ReportsPage mounts → dispatch getReportTimeSeries({ from, to, granularity })
         ↓
GET /v1/portal/reports/timeline?from=2026-01-01&to=2026-05-07&granularity=month
         ↓
PortalService.getReportTimeSeries(clientId, { from, to, granularity })
   ├─ fetch all snapshots for client's campaigns in date range
   ├─ group by granularity bucket (month = YYYY-MM)
   └─ aggregate per bucket: sum impressions, clicks, conversions, spend
         ↓
Prisma $queryRaw or findMany + in-memory grouping
         ↓
Return array of { period, impressions, clicks, conversions, spend, revenue }
```

**Grouping strategy:** Prisma `groupBy` does **not** support grouping by formatted date strings (e.g. `DATE_TRUNC('month', recordedAt)`). Two viable options:

1. **`$queryRaw` with `DATE_TRUNC`** (recommended for v1.1) — concise, single query, but raw SQL.
2. **`findMany` + in-memory grouping** (existing pattern) — more TypeScript, more network data, but no raw SQL. Given the expected data volume (dozens to low hundreds of snapshots per client), option 2 is perfectly fine and keeps the codebase consistent with existing Prisma-only patterns.

**Recommendation:** Use `findMany` + in-memory grouping to stay within existing Prisma patterns. If a client ever accumulates >10K snapshots, revisit with `$queryRaw`.

---

## Patterns to Follow

### Pattern 1: Single Aggregate Endpoint for Dashboard Summary

**What:** One `GET /portal/reports` returns everything the dashboard needs except time-series chart data. Reduces HTTP round trips from 4–5 to 1.
**When:** Dashboard has many widgets that all derive from the same underlying data.
**Trade-offs:** Slightly larger payload, but fewer waterfalls. Cache invalidation is simpler (one tag).

**Example:**
```typescript
// PortalController
@Get('portal/reports')
@RequirePermissions('portal.read')
async getReports(@CurrentUser() user: any) {
  const clientId = await this.resolveClientId(user);
  if (!clientId) return this.emptyReport();
  return this.portalService.getReportAggregates(clientId);
}

// PortalService — returning a composite shape
async getReportAggregates(clientId: string) {
  const campaigns = await this.prisma.campaign.findMany({
    where: { clientId },
    select: { id: true, name: true, platform: true, budgetSpent: true, status: true },
  });
  const snapshots = await this.getLatestSnapshots(campaigns.map(c => c.id));

  // ... compute totals, deltas, tips, platform distribution, top performers
  return {
    summary: { conversionRate, clicks, impressions, totalSpend, trends },
    platformDistribution: [...],
    topCampaigns: [...],
    smartTips: [...],
  };
}
```

### Pattern 2: Separate Time-Series Endpoint

**What:** Bar and line charts get their own endpoint because they need date-range parameters and return an array shape, not a composite object.
**When:** Chart data is parameterised and orthogonal to summary cards.
**Trade-offs:** One extra HTTP request, but the endpoint remains cacheable by date range.

**Example:**
```typescript
@Get('portal/reports/timeline')
@RequirePermissions('portal.read')
async getReportTimeline(
  @CurrentUser() user: any,
  @Query('from') from?: string,
  @Query('to') to?: string,
  @Query('granularity') granularity: 'week' | 'month' = 'month',
) {
  const clientId = await this.resolveClientId(user);
  if (!clientId) return [];
  return this.portalService.getReportTimeSeries(clientId, { from, to, granularity });
}
```

### Pattern 3: Smart Tips as Pure Computation

**What:** Insights are generated entirely in-memory from aggregate numbers. No DB schema changes, no ML service calls for v1.1.
**When:** Tips are simple heuristics (e.g. "Your CTR is below 2%, consider refreshing creatives").
**Trade-offs:** Not as sophisticated as AI-generated insights, but zero latency and zero dependencies.

**Example:**
```typescript
private generateSmartTips(aggregates: ReportAggregates): SmartTip[] {
  const tips: SmartTip[] = [];
  if (aggregates.avgCtr < 2.0) {
    tips.push({ type: 'CTR_LOW', title: 'تحسين نسبة النقر', body: '...' });
  }
  if (aggregates.totalSpend / aggregates.totalBudget > 0.8) {
    tips.push({ type: 'BUDGET_HIGH', title: 'الميزانية تقترب من النفاد', body: '...' });
  }
  // ... up to 4 tips
  return tips.slice(0, 4);
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: N+1 Snapshot Queries per Campaign

**What:** Loop over campaigns and query `CampaignKpiSnapshot` one-by-one inside the loop.
**Why bad:** Existing `getLatestSnapshots(campaignIds)` already solves this with a single `findMany(where: { campaignId: { in: [...] } })`. Doing N+1 would cause performance regression.
**Instead:** Always batch-fetch snapshots by `campaignId in` array, exactly as `getLatestSnapshots()` does.

### Anti-Pattern 2: Frontend Aggregate Computation

**What:** Fetch raw campaign list and compute totals, averages, and tips in React components.
**Why bad:** Violates existing pattern where `PortalService` does all data shaping. Also forces downloading all raw snapshots to the browser.
**Instead:** Compute aggregates server-side in `PortalService` and return shaped DTOs.

### Anti-Pattern 3: Reusing `/portal/campaigns/summary` for the Dashboard

**What:** Trying to force the existing `getCampaignSummary()` (returns only `totalVisits, totalConversions, avgRoas, improvementPercent`) to serve the new UI.
**Why bad:** Shape mismatch — the new dashboard needs clicks, impressions, spend, platform distribution, top campaigns, and tips. Extending the old endpoint would break its consumers (portal homepage).
**Instead:** Create new `/portal/reports` and `/portal/reports/timeline` endpoints. Leave legacy endpoints untouched.

### Anti-Pattern 4: New Module for Reports

**What:** Creating a `reports.module.ts`, `reports.controller.ts`, `reports.service.ts`.
**Why bad:** Reports are client portal features with no independent domain. They read the same `Campaign` + `KpiSnapshot` tables that Portal and Marketing already own. A separate module adds indirection and requires wiring into `app.module.ts`.
**Instead:** Extend `PortalModule` (controller + service). Keeps boundary aligned with existing portal-scoped routes.

### Anti-Pattern 5: Missing Empty-State Guard

**What:** Returning 404 or throwing when a client has zero campaigns.
**Why bad:** New clients legitimately have no campaigns. The UI should show empty-state illustrations, not error cards.
**Instead:** Return well-formed zero-value shapes (same pattern as existing `getCampaignSummary` returning `{ totalVisits: 0, ... }`).

---

## Scalability Considerations

| Concern | At <100 campaigns/client | At 1K+ campaigns/client | Mitigation |
|---------|--------------------------|------------------------|------------|
| Snapshot aggregation | In-memory `findMany` + JS grouping is fine | Raw `$queryRaw` with `DATE_TRUNC` + SQL aggregation | Add `$queryRaw` path behind volume threshold |
| Single `/portal/reports` payload size | <50 KB | Could grow if tips + top campaigns are unbounded | Cap `topCampaigns` at 20; tips at 4 |
| KPI card delta computation | Two `findMany` calls (latest + previous window) | Same, indexed by `recordedAt` | Ensure composite index on `(campaignId, recordedAt)` (already exists per schema `@index([recordedAt])` on snapshots) |
| Frontend chart rendering | `recharts` handles <200 points well | >500 time-series points needs canvas-based lib | Switch to `chart.js` or downsample data server-side |

---

## Integration Points

### Existing Systems Reused (No New External Dependencies)

| System | Integration Pattern | Notes |
|--------|---------------------|-------|
| `Campaign` table | Prisma `findMany` via `PortalService` | Already has `clientId` index |
| `CampaignKpiSnapshot` table | Prisma `findMany` with `campaignId in` array | Already has `campaignId` + `recordedAt` indexes |
| `PermissionsGuard` | `@RequirePermissions('portal.read')` on new routes | Existing permission key — no new keys needed |
| `ResponseInterceptor` | Automatic envelope wrapping `{ success, data, error }` | Zero code changes |
| `RTK Query (portalApi)` | New endpoints added to existing slice | `providesTags` for cache coherence |
| `PortalSidebar / BottomNav` | Static nav item arrays | Insert `"التقارير"` entry |

---

## Suggested Build Order (Dependency-Aware)

```
Phase A — Backend Skeleton (no UI)
─────────────────────────────────
1. PortalService.getReportAggregates()
   └─ depends on: getLatestSnapshots() (already exists)
2. PortalService.getReportTimeSeries()
   └─ depends on: CampaignKpiSnapshot findMany
3. PortalService.getReportPlatformDistribution()
   └─ depends on: Campaign findMany (platform + budgetSpent)
4. PortalService.getTopPerformingCampaigns()
   └─ depends on: getLatestSnapshots()
5. PortalService.generateSmartTips()
   └─ depends on: aggregate numbers from step 1
6. PortalController — wire 2 new @Get routes
   └─ depends on: steps 1–5

Phase B — Frontend API + Types
──────────────────────────────
7. portalApi.ts — add interfaces + endpoints
   └─ depends on: knowing controller response shapes
8. turbo build --filter=api --filter=web (verify)

Phase C — Navigation + Page Shell
─────────────────────────────────
9. PortalSidebar — insert "التقارير" nav item
10. BottomNav — insert mobile nav item
11. /portal/reports/page.tsx — replace redirect with shell layout
    └─ loading, error, empty states (copy patterns from /campaigns)

Phase D — Chart + Widget Components
──────────────────────────────────
12. ReportKpiCards
13. ReportBarChart
14. ReportLineChart
15. ReportDonutChart
16. ReportTopAdsTable
17. ReportSmartTips

Phase E — Integration + QA
───────────────────────────
18. Wire page shell to portalApi hooks
19. RTL + Arabic formatting verification
20. Dark navy / gold / emerald palette verification
21. turbo build + manual QA across desktop + mobile
```

**Rationale for ordering:**
- Backend aggregate methods must exist before frontend types can be finalised (shape-driven coupling).
- Navigation changes are safe to do early but are only user-visible once the page is implemented.
- Chart components are purely presentational; they can be built in parallel once the data shapes are known.
- The existing `/portal/campaigns` page is the closest style reference — copy its loading skeletons, error cards, and `dir="rtl"` patterns.

---

## Sources

- Code inspection: `apps/api/src/modules/portal/portal.controller.ts` — route patterns and `resolveClientId` guard
- Code inspection: `apps/api/src/modules/portal/services/portal.service.ts` — existing aggregation patterns (`getCampaignSummary`, `getLatestSnapshots`)
- Code inspection: `apps/api/src/modules/marketing/services/campaigns.service.ts` — KPI snapshot batch-fetch pattern
- Code inspection: `apps/web/features/portal/portalApi.ts` — RTK Query conventions and tag types
- Code inspection: `apps/web/components/portal/PortalSidebar.tsx` + `BottomNav.tsx` — navigation structure
- Code inspection: `apps/web/app/(portal)/portal/campaigns/page.tsx` — existing portal page patterns (loading, error, empty)
- Code inspection: `apps/api/prisma/schema.prisma` — `Campaign`, `CampaignKpiSnapshot`, indexes
