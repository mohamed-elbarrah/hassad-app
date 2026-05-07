# Technology Stack

**Project:** Hassad Platform — Client Reports Dashboard Milestone (v1.1)
**Researched:** 2026-05-07
**Confidence:** HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | ^3.8.1 (installed) | Bar, line, donut chart rendering | Already in node_modules; shadcn/ui officially underpins its Chart component on Recharts v3. Covers all required chart types (BarChart, LineChart, PieChart for donut) with responsive containers and composable primitives. |
| shadcn/ui Chart | latest (add via CLI) | Tailwind-styled chart wrappers | Provides `ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`, and theming integration that matches the existing design system. Zero lock-in — it does not wrap Recharts, only adds presentational components. |
| Next.js App Router | ^16.2.0 (installed) | Page routing & SSR | Existing; new `/portal/reports` page lives here. Chart components must be marked `"use client"` because Recharts relies on browser measurement. |
| React | ^19.0.0 (installed) | Component layer | Existing; works with Recharts v3 and shadcn/ui Chart wrappers. |
| Redux Toolkit + RTK Query | ^2.x (installed) | State & data fetching | Existing; backend aggregate endpoints will be consumed via existing API slice pattern. |

### Database / Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NestJS | ^11.x (installed) | API layer | Existing; new aggregate endpoints for multi-campaign KPI grouping, trend aggregation, and smart-tip generation logic belong here. |
| Prisma | ^6.x (installed) | ORM & aggregations | Existing; `groupBy`, `_sum`, `_avg`, `_count`, and raw query aggregations are sufficient for monthly rollups and platform spend distribution. No extra analytics engine needed. |
| PostgreSQL | ^17 (installed) | Data store | Existing; aggregate queries run against indexed snapshot tables. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Table | ^8.21.3 (installed) | Sortable top-performing ads table | Existing; used for client-side or server-side sortable columns in the "أفضل الإعلانات أداءً" section. |
| Motion (Framer Motion) | latest (installed) | Animated card/chart entrance | Optional — use for staggered KPI card entry or chart fade-in if desired. Not required for core functionality. |
| Lucide React | ^1.8.0 (installed) | Icons for KPI cards & smart tips | Existing; `TrendingUp`, `TrendingDown`, `Eye`, `MousePointerClick`, `Wallet`, `Lightbulb`, etc. |
| `Intl.NumberFormat` | Native (built-in) | Compact/locale number formatting | Always — KPI cards and chart tooltips need compact notation (e.g., 1.2M). Add a `formatCompactNumber()` helper in `lib/format.ts`; no library needed. |
| `Intl.DateTimeFormat` | Native (built-in) | Monthly axis labels & date formatting | Always — monthly comparison chart labels use `month: 'short'`. Already used by `formatDate()` in `lib/format.ts`. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charting library | Recharts (existing) | Apache ECharts | Recharts is already installed, works with React 19, and shadcn/ui v2+ officially supports it. ECharts is heavier and adds a second charting paradigm. |
| Charting library | Recharts (existing) | Chart.js + react-chartjs-2 | Extra dependency; Recharts covers all required chart types natively with better React composability. |
| Date formatting | `Intl.DateTimeFormat` (native) | date-fns / dayjs | No new dependency needed. Intl handles Arabic month names, RTL context, and compact numeric notation natively. |
| Number formatting | `Intl.NumberFormat` (native) | numbro / d3-format | No new dependency needed. `notation: 'compact'` produces 1.2M-style labels required by the design. |
| shadcn/ui Chart wrappers | Install `chart` component | Hand-write chart wrappers | The shadcn/ui `chart` component is the community standard for Tailwind + Recharts; it brings color-token theming, tooltip styling, and accessibility with no lock-in. Rewriting it duplicates effort. |

## Installation

```bash
# Add shadcn/ui chart wrappers (copy-paste into components/ui/)
npx shadcn@latest add chart

# No additional npm packages needed — Recharts, TanStack Table, Motion,
# and Lucide are already present in apps/web.
```

After adding the `chart` component, add chart color tokens to `globals.css`:

```css
@layer base {
  :root {
    --chart-1: oklch(0.65 0.18 85);   /* gold/yellow  #E5B840 */
    --chart-2: oklch(0.55 0.15 175);  /* emerald/teal #10B981 */
    --chart-3: oklch(0.50 0.12 250);  /* action-blue  #2684fc */
    --chart-4: oklch(0.60 0.14 30);   /* alert-orange #f8af01 */
    --chart-5: oklch(0.45 0.08 260);  /* neutral-navy #40465d */
  }
}
```

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `date-fns`, `dayjs`, `luxon` | Unnecessary weight; Intl APIs cover all required formatting. | `Intl.DateTimeFormat` + existing `lib/format.ts` helpers. |
| `numbro`, `d3-format`, `numeral` | Unnecessary weight; Intl covers compact notation, currency, and Arabic numerals. | `Intl.NumberFormat` with `notation: 'compact'`. |
| Chart.js / ECharts / Victory | Redundant; Recharts v3 already supports bar, line, and donut charts with responsive containers. | Recharts + shadcn/ui `chart` component. |
| Separate analytics/OLAP database | Overkill for a single-client aggregate view over ~hundreds of snapshots. | Prisma aggregations + PostgreSQL indexes on `campaignId`, `createdAt`. |
| PDF/Excel export libraries | Out of scope for v1.1 dashboard. | Defer to a later milestone if needed. |

## Integration with Existing Recharts

**Current state:** `recharts@3.8.1` is installed but unused in the codebase (no imports found). `@types/recharts@^1.8.29` is also present but **stale** — Recharts v3 ships its own TypeScript definitions.

**Action items:**
1. **Remove `@types/recharts`** from `apps/web/package.json` to avoid type conflicts (Recharts v3 is self-typed).
2. **Install the shadcn/ui `chart` component** — it adds `components/ui/chart.tsx` with `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, and `ChartLegendContent`.
3. **Wrap every chart in `ChartContainer`** (which uses `ResponsiveContainer` internally) with an explicit `min-h-*` or `h-*` class so first-render measurement works.
4. **Mark chart page sections `"use client"`** because Recharts uses browser APIs (`getBoundingClientRect`, SVG rendering).

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@3.8.1 | react@19 | Verified — Recharts v3 explicitly supports React 19. |
| recharts@3.8.1 | tailwindcss@4.2.2 | Verified — shadcn/ui Chart docs confirm v3 uses `var(--chart-1)` style tokens, matching Tailwind v4 CSS variable theming. |
| shadcn/ui chart (latest) | recharts@3.8.1 | Verified — shadcn/ui docs state: "The `chart` component now uses Recharts v3." |
| @types/recharts@1.8.29 | recharts@3.8.1 | **Incompatible / redundant** — causes type conflicts. Remove it. |

## Sources

- Context7 `/recharts/recharts` — verified Recharts v3 component exports, `ResponsiveContainer` usage, `PieChart` donut (`innerRadius`) pattern, and `BarChart`/`LineChart` examples.
- Official shadcn/ui docs (`https://ui.shadcn.com/docs/components/chart`) — verified `chart` component installation, Recharts v3 theming with `var(--chart-*)`, and Tailwind v4 compatibility.
- Direct codebase inspection — `apps/web/package.json` lists `recharts@^3.8.1`, `@types/recharts@^1.8.29`, `motion`, `lucide-react`, `@tanstack/react-table`, and existing `lib/format.ts` using `Intl.NumberFormat`/`Intl.DateTimeFormat`.

---
*Stack research for: Client Reports Dashboard (التقارير) — KPI cards, bar/line/donut charts, smart tips, top ads table.*
*Researched: 2026-05-07*
