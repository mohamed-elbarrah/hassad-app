# Admin Overview Refactor Plan

**Goal:** Transform the admin overview from a weak 4-card stats page into a command center that answers: *What is happening now? What changed? What needs attention? Where do I click to go deeper?*

**Principle:** The overview shows insight, risk, trend, and action — not just stats.

---

## Architecture Overview

```
admin/page.tsx  ← orchestrates everything, wires API data, layout
├── components/dashboard/admin/overview/
│   ├── PeriodSelector.tsx         # Row 1: today/week/month/custom
│   ├── KpiGrid.tsx                # Row 2: 8 enhanced StatCards
│   ├── Sparkline.tsx              # Inline SVG trend for each card
│   ├── AlertPanel.tsx             # Row 3-left: categorized urgency
│   ├── TrendChart.tsx             # Row 3-right: revenue/user line chart
│   ├── FunnelChart.tsx            # Row 4-left: lead → payment pipeline
│   ├── ContractChart.tsx          # Row 4-right: contract status donut
│   ├── HealthScore.tsx            # Row 5-left: gauge + service status
│   ├── ActivityFeed.tsx           # Row 5-right: recent ledger events
│   ├── QuickActions.tsx           # Row 6-left: action shortcuts
│   └── BusinessStats.tsx          # Row 6-right: rate metrics grid
```

---

## Page Layout (6 Rows)

```
Row 1 ── Header + PeriodSelector ───────────────────────────────────────────────
Row 2 ── KPI Grid (8 cards × 4 cols) ───────────────────────────────────────────
Row 3 ── AlertPanel (40%)  │  TrendChart (60%) ─────────────────────────────────
Row 4 ── FunnelChart (50%) │  ContractChart (50%) ──────────────────────────────
Row 5 ── HealthScore (35%) │  ActivityFeed (65%) ───────────────────────────────
Row 6 ── QuickActions (40%)│  BusinessStats (60%) ──────────────────────────────
```

---

## Phase 1 — Frontend (Backend Agnostic)

### Step 1: Upgrade `StatCard` to Support Sparklines

**File:** `components/design-system/StatCard.tsx`

What changes:
- Add `sparklineData?: number[]` prop
- Render inline SVG sparkline next to the icon area
- Highlight the `trend` visual (green up / red down arrow already exists)
- Add `href?: string` for drill-down (wrap card in Link)
- Ensure the card click navigates to deeper page

Uses existing props: `trend`, `trendValue` are already there — just unused.

### Step 2: Build `Sparkline` Component

**File:** `components/dashboard/admin/overview/Sparkline.tsx`

- Accept `data: number[]` + `color?: string` + `height?: number`
- Render a simple SVG polyline (no recharts needed — tiny, inline)
- ~40 lines of code
- Pure presentational — zero API coupling

### Step 3: Build `PeriodSelector`

**File:** `components/dashboard/admin/overview/PeriodSelector.tsx`

- Reuse existing `TimeRangeSelector` from design-system (it already has "last7days", "last30days", "last12months")
- Add tabs for quick switches: Today / This Week / This Month / This Quarter / Custom
- Stored as local state, passed down to all data-fetching hooks
- Needed now for trend % comparison; backend will eventually accept `from`/`to`

### Step 4: Build `KpiGrid`

**File:** `components/dashboard/admin/overview/KpiGrid.tsx`

Takes `AdminStats` and `AdminTrend[]` → renders 8 cards:

| # | Card | Icon | Field | Drill-down Link |
|---|------|------|-------|----------------|
| 1 | المستخدمون النشطون | Users | `totalUsers` | `/dashboard/admin/users` |
| 2 | العملاء النشطون | CheckCircle | `activeClients` | `/dashboard/admin/clients` |
| 3 | العملاء الجدد | UserPlus | `newClientsThisMonth` | `/dashboard/admin/clients` |
| 4 | الإيرادات الشهرية | DollarSign | `monthlyRevenue` | `/dashboard/admin/finance` |
| 5 | المشاريع الجارية | Activity | `activeProjects` | `/dashboard/admin/projects` |
| 6 | المشاريع المكتملة | ClipboardCheck | `completedProjects` | `/dashboard/admin/projects` |
| 7 | الفواتير المتأخرة | AlertCircle | `unpaidInvoicesCount` | `/dashboard/admin/finance` |
| 8 | المهام المتأخرة | Clock | `overdueTasks` | `/dashboard/admin/tasks` |

Each card shows:
- `Sparkline` from trend data
- `trend` arrow + `trendValue` (computed from comparing last 7 days to prior 7)
- Color-coded variant (red for overdue/unpaid, green for revenue/growth)

### Step 5: Build `AlertPanel`

**File:** `components/dashboard/admin/overview/AlertPanel.tsx`

Takes `AdminAlertsResponse` + `AdminAttentionResponse` and categorizes:

```
🔴 HIGH severity (always visible):
  • الفواتير المتأخرة — count + "عرض الكل" → /finance
  • المهام المتجاوزة — count + "عرض الكل" → /tasks
  • النزاعات المفتوحة — count + "عرض الكل" → /disputes

🟡 MEDIUM severity:
  • العقود المنتهية قريباً — count + "عرض الكل" → /contracts
  • الطلبات قيد الانتظار — count + "عرض الكل" → /requests

🟢 LOW (informational):
  • المشاريع المتعطلة — count + "عرض الكل" → /projects
```

Each category is a row with: severity dot (🔴🟡🟢) → label → count badge → "عرض الكل" link. Total items badge in the header.

### Step 6: Build `TrendChart`

**File:** `components/dashboard/admin/overview/TrendChart.tsx`

Takes `AdminTrend[]` from existing `GET /admin/stats/trends`.

- Uses existing `PerformanceTrendLineChart` (AreaChart from recharts) as base
- Metric switcher tabs above chart: الإيرادات / المستخدمون / العملاء / المشاريع
- Shows "↑ X% عن الشهر الماضي" below chart
- Empty state: "لا توجد بيانات كافية للمخطط"
- Drill-down: "عرض التقرير الكامل →" link to reports

### Step 7: Build `FunnelChart`

**File:** `components/dashboard/admin/overview/FunnelChart.tsx`

Takes `AdminFunnel` from existing `GET /admin/funnel`.

Horizontal bar chart (custom, no recharts needed — just divs with width %):
```
العملاء المتوقعون     ████████████  85
العملاء المؤهلون       ████████      62
العروض                 ██████        40
العقود                 ████          28
```

Shows conversion rate below: "نسبة التحويل الإجمالية: ٣٣%"
Drill-down: "عرض مسار التحويل الكامل →" → `/dashboard/admin/reports`

### Step 8: Build `ContractChart`

**File:** `components/dashboard/admin/overview/ContractChart.tsx`

Takes contract counts from `AdminStats` (active/completed) + additional data from contract endpoints when available.

- Uses existing `SpendDistributionDonutChart` pattern (PieChart from recharts)
- Segments: نشط / مسودة / منتهي / ملغى
- Legend below chart with counts + %
- Drill-down: "عرض كل العقود →" → `/dashboard/admin/contracts`

### Step 9: Build `HealthScore`

**File:** `components/dashboard/admin/overview/HealthScore.tsx`

Takes `AdminHealthInfo` from existing `GET /admin/health`.

- Uses existing `GaugeChart` component for overall score
- Detail rows:
  - 🟢 قاعدة البيانات: متصل
  - 🟢🟡🔴 حالة الخدمات: X/Y تعمل
  - 🟡 الأخطاء الحديثة: count
  - 👥 المستخدمون النشطون (آخر ساعة): count
- Drill-down: "عرض صحة النظام →" → `/dashboard/admin/health`

### Step 10: Build `ActivityFeed`

**File:** `components/dashboard/admin/overview/ActivityFeed.tsx`

Takes `AdminRecentActivity[]` from existing `GET /admin/dashboard/recent-activity`.

- Same visual as current page but moved to its own component
- Shows up to 8 items with icon per entity type
- `formatRelativeTime` for timestamp display
- Drill-down: "عرض كل النشاطات →" → `/dashboard/admin/audit`

### Step 11: Build `QuickActions`

**File:** `components/dashboard/admin/overview/QuickActions.tsx`

Pure frontend — no API needed. 2×3 grid of action cards:

| مشروع جديد | فاتورة جديدة | عميل جديد |
| مستخدم جديد | حملة تسويق | تقرير مالي |

Each card: lucide icon + label + `onClick` navigates to create page using `useRouter`.

### Step 12: Build `BusinessStats`

**File:** `components/dashboard/admin/overview/BusinessStats.tsx`

Takes stats + funnel data. Grid of 6 rate metrics:

| Metric | Source |
|--------|--------|
| معدل إنجاز العقود | computed: completedProjects / totalProjects |
| معدل تحويل العملاء | `funnel.conversionRates.leadsToClients` |
| معدل نجاح الدفع | computed: 1 - (unpaid / total invoices) |
| رضا العملاء | `stats.satisfactionRate` |
| متوسط وقت الإنجاز | `AdminDashboardTeamWorkload` avgCompletionSpeedDays |
| معدل الاحتفاظ | not yet available — show "قريباً" placeholder |

### Step 13: Rewrite `admin/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/admin/page.tsx`

Full rewrite to:
1. Import all 6 API hooks (some are not even called today)
2. Add local state for `PeriodSelector` value
3. Pass data to each section component
4. Handle loading (existing skeleton pattern) + error states per section
5. Each section gracefully handles missing data (empty states)

---

## Phase 2 — Backend Enhancements (After Frontend Ships)

| # | Enhancement | Current State | Effort |
|---|------------|---------------|--------|
| 1 | Add `from`/`to` params to `GET /admin/stats` | Always returns current month | Low |
| 2 | Add period-over-period delta computation for every KPI | `revenueChange` exists, others don't | Medium |
| 3 | Add retention/churn computation | Not implemented | Medium |
| 4 | Add goal/target tracking model (monthly revenue targets etc.) | New Prisma model + CRUD | Medium |
| 5 | Add AI insights endpoint (anomaly detection, trends analysis) | New endpoint + Gemini integration | High |
| 6 | Add `?period=` param to funnel endpoint | Always returns all-time | Low |
| 7 | Add contract status distribution to stats | Not returned | Low |

---

## Reusable Assets Already in Codebase

| Asset | File | Used For |
|-------|------|----------|
| `recharts` (AreaChart, BarChart, PieChart) | package.json | TrendChart, ContractChart |
| `PerformanceTrendLineChart` | `components/design-system/` | Base for TrendChart |
| `MonthlyComparisonBarChart` | `components/design-system/` | Bar comparison variant |
| `SpendDistributionDonutChart` | `components/design-system/` | Base for ContractChart |
| `GaugeChart` | `components/design-system/` | HealthScore gauge |
| `TimeRangeSelector` | `components/design-system/` | PeriodSelector |
| `StatCard` | `components/design-system/` | KPI card (needs sparkline) |
| `SurfaceCard` | `components/design-system/` | Section wrapper |
| `formatNumber`, `formatCurrency`, `formatRelativeTime` | `lib/format.ts` | Value display |
| All 6 admin API hooks | `features/admin/adminApi.ts` | Data fetching |

---

## What We Remove

- Old `admin/page.tsx` (rewritten)
- `AdminEmptyState` import (no longer needed at page level — each section handles its own)
- Unused `useGetAdminTrendsQuery()` call with no render (currently called but data thrown away)

---

## Files Changed

| File | Action |
|------|--------|
| `apps/web/components/design-system/StatCard.tsx` | Edit — add sparklineData, href props |
| `apps/web/app/(dashboard)/dashboard/admin/page.tsx` | Rewrite — new 6-row layout, wire all hooks |
| `apps/web/app/(dashboard)/dashboard/admin/loading.tsx` | Edit — match new skeleton structure |
| `apps/web/components/dashboard/admin/overview/Sparkline.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/PeriodSelector.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/KpiGrid.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/AlertPanel.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/TrendChart.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/FunnelChart.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/ContractChart.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/HealthScore.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/ActivityFeed.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/QuickActions.tsx` | **New** |
| `apps/web/components/dashboard/admin/overview/BusinessStats.tsx` | **New** |
