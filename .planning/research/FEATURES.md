# Feature Landscape: Client Reports Dashboard (التقارير)

**Project:** Hassad Platform — Client Reports Dashboard
**Researched:** 2026-05-07
**Focus:** Marketing analytics dashboards for client-facing portals

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **KPI Summary Cards** | Clients must see aggregate performance at a glance (conversions, clicks, impressions, spend) | Low | Depends on existing `kpiSnapshot` table. Requires aggregation queries across all client campaigns. |
| **Trend Indicators (↑/↓ %)** | Up/down arrows with percentage change from previous period is universal language | Low | Requires period-over-period calculation in backend or frontend. Need consensus on "previous period" logic (default: last 30 days vs previous 30 days). |
| **Monthly Comparison Bar Chart** | Monthly aggregates are standard for budget review cycles; clients compare monthly performance | Medium | Bar chart with Arabic month labels (يناير–ديسمبر). Requires `date_trunc('month')` group by in Prisma/PostgreSQL. |
| **Performance Trend Line Chart** | Time series line chart is table stakes for "show me progression" requests | Medium | Requires daily/weekly granularity. X-axis MUST be RTL-friendly (time flows right-to-left in Arabic UI). |
| **Sortable "Top Performing" Table** | Clients expect to see which campaigns/ads drove the best results | Medium | Columns: campaign name, platform, spend, impressions, clicks, conversions, conv. rate. Sortable by each metric. |
| **Spend Distribution Donut Chart** | Visual breakdown of budget allocation is expected for any finance-related view | Low | Group by `platform` field. Simple aggregate. |
| **RTL Arabic Layout** | Portal is 100% Arabic; all charts, labels, tooltips must support RTL | Low | Use `recharts` RTL support or `direction: rtl` wrapper. Month names must be Arabic. |
| **Time Range Selector** | "Last 7 days / 30 days / 90 days / Custom" is standard | Medium | Affects all aggregates. Default to "This Month" or "Last 30 Days" for B2B marketing context. |
| **Date Formatting (Hijri/Gregorian)** | Saudi/GCC clients often expect Hijri dates alongside Gregorian | Low | Use `moment-hijri` or similar if needed. Start with Gregorian Arabic (`ar-SA` locale) as MVP. |
| **Export to PDF/Print** | Marketing reports are often shared with stakeholders outside the platform | Medium | `react-to-print` or `@react-pdf/renderer`. Defer to post-MVP if resource-constrained. |

---

## Differentiators

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Smart Tips / Recommendations (توصيات ذكية)** | Turns passive reporting into actionable advice — "Increase budget on Google Ads, CTR is above benchmark" | High | Requires benchmark definitions, rule engine, or simple heuristics. Can start with hardcoded rules (e.g., CTR > 5% = "Excellent performance"). |
| **Benchmark Comparison** | Show performance vs. industry average (e.g., "Your CTR is 23% higher than industry avg") | High | Requires benchmark data source. Build internal benchmark table or integrate third-party. |
| **Campaign Health Score** | Single "score" aggregating multiple KPIs into a green/yellow/red status | Medium | Weighted average formula. E.g., (CTR% * 0.3 + ConvRate% * 0.5 + ROAS * 0.2). |
| **Anomaly Detection** | Auto-flag sudden drops in CTR or spikes in CPC | High | Requires time-series analysis or std-deviation logic. Can simulate with simple % change thresholds. |
| **Predicted vs. Actual** | Show campaign progress vs. original proposal targets | Medium | Requires linking campaigns to proposal deliverables or budget estimates. Data may not exist yet. |
| **ROI / ROAS Card** | Revenue-on-ad-spend is a gold-standard metric for performance marketing | Low | Requires `revenue` or `conversionValue` field in `kpiSnapshot` or campaign model. Check if field exists. |
| **Custom Dashboard Builder** | Let clients pick which KPIs to see and reorder cards | Very High | Drag-and-drop, persist layout. Major scope increase. |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time/live updating charts** | Increases server load unnecessarily; marketing KPIs change daily, not by the second | Use cached aggregates with a "Last updated: HH:mm" indicator + manual refresh button |
| **Data editing in dashboard** | Dashboards are read-only; editing KPIs belongs in campaign detail | Link "Edit" buttons to campaign detail page |
| **Cross-client comparison** | Clients must NEVER see other clients' data. Breaks tenant isolation. | Scope all queries by `clientId` derived from JWT. No global leaderboards. |
| **Granular user-level permissions within portal** | Portal users currently share a single client role. Over-engineering. | Use existing `client` role with all-or-nothing access to own campaigns. |
| **Email/scheduled report delivery** | Significant infra (email templates, queue, scheduling). Separate initiative. | Build "Export to PDF" first, let clients download and share manually. |
| **Drill-down to ad-group or keyword level** | Scope is campaign-level aggregation. Keyword-level requires ad platform APIs. | Campaign detail page already exists; use that for individual campaign deep-dives |
| **Multi-currency display** | Platform currently uses SAR (implicit). Adds complexity without clear need. | Display in SAR only. Add currency symbol if needed. |
| **Advanced chart types (funnel, cohort, retention)** | Overkill for current v1.1 scope. Good for later phases. | Stick to bar, line, donut. |

---

## Feature Dependencies

```
Client Reports Dashboard
├── Backend Aggregate Endpoints (NEW)
│   ├── GET /portal/reports/summary (KPI cards + trends)
│   ├── GET /portal/reports/monthly (bar chart data)
│   ├── GET /portal/reports/trend (line chart data)
│   ├── GET /portal/reports/top-performers (table data)
│   └── GET /portal/reports/spend-distribution (donut data)
├── Frontend Components (NEW)
│   ├── KPI Card Grid
│   ├── Monthly Bar Chart (recharts)
│   ├── Trend Line Chart (recharts)
│   ├── Top Performers Table (shadcn Table + sorting)
│   ├── Spend Donut Chart (recharts)
│   ├── Smart Tips Section
│   └── Time Range Filter (DatePicker / Select)
└── Data Layer (EXISTS)
    ├── kpiSnapshot table (PERIOD aggregates)
    ├── campaign table (status, platform, name)
    └── task → project → client (derive clientId)
```

**Critical dependency:** All aggregate queries MUST scope to `clientId` derived from the authenticated user's `client` profile. Reuse existing pattern:
```
user → client profile → projects → tasks → campaigns → kpiSnapshots
```

---

## MVP Recommendation

Prioritize (v1.1 scope):
1. **KPI Summary Cards with trend indicators** — Table stakes, low complexity, high impact
2. **Monthly comparison bar chart** — Core visual, medium complexity
3. **Performance trend line chart** — Core visual, medium complexity
4. **Spend distribution donut chart** — Low complexity, visually impactful
5. **Top-performing campaigns table** — Medium complexity, essential for actionability
6. **Smart tips (hardcoded rules)** — Differentiator, start simple with 4 static rule-based cards

Defer (post-v1.1):
- **Export to PDF:** Requires new library, not requested by current milestone
- **Anomaly detection:** Requires historical baseline calculation
- **Benchmark comparison:** Requires external or manually maintained benchmark data
- **Custom time range beyond preset buttons:** Start with fixed periods (Last 30 days, This month, Last month, Last 3 months)
- **Predicted vs. actual:** Data model may not support

---

## Specific Dashboard Behaviors

### KPI Cards
- **Layout:** 4 cards in a grid (2x2 on mobile, 4-col on desktop)
- **Content:** Metric name, value, trend arrow + %, small sparkline (optional)
- **Trend logic:** Compare selected period vs. equivalent previous period (e.g., May 1–15 vs Apr 1–15)
- **Color coding:** Positive trend in emerald (`#10B981`), negative in rose (`#F43F5E`), neutral in slate
- **RTL:** Card order right-to-left; first card is top-right

### Trend Indicators
- **Calculation:** `((current - previous) / previous) * 100`
- **Edge case:** If `previous = 0`, show "—" or "New" instead of infinity
- **Period:** MUST match the selected time range filter. If user picks "Last 7 days", compare to previous 7 days.

### Monthly Comparison Bar Chart
- **X-axis:** Arabic month abbreviations (يناير, فبراير, ...)
- **Y-axis:** Metric value (clicks, impressions, etc.)
- **Bars:** Grouped bars if comparing multiple metrics; single metric per group if one selected
- **Tooltip:** Arabic formatting with locale number separators (e.g., `١٢٬٣٤٥`)
- **Metric switcher:** Tabs or dropdown to switch between Clicks, Impressions, Conversions, Spend

### Performance Trend Line Chart
- **X-axis:** Dates (daily for 30d, weekly for 90d)
- **Lines:** One line per metric, or multi-line if comparing
- **Area fill:** Subtle gradient fill under line for visual weight
- **Legend:** Arabic labels, clickable to toggle lines

### Smart Tips / Recommendations
- **Rule-based MVP:**
  - If `conversionRate > 5%` → "أداء ممتاز! حاول زيادة الميزانية على هذه الحملة"
  - If `spend > budget * 0.9` → "الميزانية على وشك النفاد، فكر في زيادتها"
  - If `ctr < 1%` → "معدل النقر منخفض، جرب تحسين عناوين الإعلانات"
  - If `impressions < 1000` → "الوصول محدود، فكر في استهداف جمهور أوسع"
- **Presentation:** 4 horizontal cards with icon, title, description. Light background, rounded corners.

### Top Performing Ads Table
- **Columns:** Campaign Name, Platform, Spend, Impressions, Clicks, Conversions, Conv. Rate
- **Sort:** Click header to sort ASC/DESC per column
- **Pagination:** 10 rows per page (campaign count per client is usually low; pagination may be unnecessary for v1.1)
- **Actions:** Row click navigates to campaign detail page
- **Empty state:** "لا توجد حملات في الفترة المحددة"

### Spend Distribution Donut Chart
- **Segments:** By `campaign.platform` (Google, Meta, TikTok, etc.)
- **Center label:** Total spend across all campaigns
- **Legend:** Arabic platform names + percentage + SAR amount
- **Colors:** Palette from existing design system; avoid generic defaults

---

## Data Model Implications

Ensure `kpiSnapshot` table has:
- `createdAt` (used for time-based grouping)
- `impressions`, `clicks`, `conversions`, `spend` (numeric)
- Campaign → Task → Project → Client relationships (for scoping)

**Query patterns needed:**
```sql
-- Summary (KPI cards)
SELECT SUM(impressions), SUM(clicks), SUM(conversions), SUM(spend)
FROM kpi_snapshot WHERE campaign_id IN (...) AND createdAt BETWEEN $1 AND $2

-- Monthly (bar chart)
SELECT date_trunc('month', createdAt) as month, SUM(clicks) as clicks
FROM kpi_snapshot WHERE ... GROUP BY month ORDER BY month

-- Trend (line chart)
SELECT date_trunc('week', createdAt) as week, SUM(impressions) as impressions
FROM kpi_snapshot WHERE ... GROUP BY week ORDER BY week

-- Top performers (table)
SELECT c.name, c.platform, SUM(s.spend), SUM(s.impressions), SUM(s.clicks), SUM(s.conversions)
FROM campaign c JOIN kpi_snapshot s ON c.id = s.campaign_id
WHERE ... GROUP BY c.id ORDER BY SUM(s.conversions) DESC

-- Spend distribution (donut)
SELECT c.platform, SUM(s.spend) FROM campaign c JOIN kpi_snapshot s ... GROUP BY c.platform
```

---

## Sources

- Existing `PROJECT.md` and `AGENTS.md` for Hassad Platform context
- Standard marketing analytics dashboard patterns (Google Ads Reporting, Meta Ads Manager, common SaaS dashboard UX)
- Project constraints: NestJS 11 + Prisma 6 + PostgreSQL 17 + Next.js 16 + Tailwind CSS 4 + shadcn/ui + recharts
