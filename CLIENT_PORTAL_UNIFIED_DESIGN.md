# Client Portal Unified Design System — Implementation Plan

> **Scope:** Unify all UI patterns across the client portal (`/portal/*`) to follow one design language, token system, component pattern, and user-experience rhythm.
> **Reference page:** `/portal/projects` (currently the most consistent implementation).
> **Created:** 2026-05-14

---

## 1. Design System Tokens (Source of Truth)

All tokens live in `apps/web/app/globals.css` (Tailwind CSS 4 CSS-first config). Every portal page must read from this set only — no hard-coded hex values, no ad-hoc colors.

| Token                                   | CSS Var                            | Usage                                                   |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| `portal-bg`                             | `#f9fafb`                          | Page backgrounds, empty-state fills, secondary surfaces |
| `portal-card-border`                    | `#e1e4ea`                          | Card borders, table outer borders, filter-pill borders  |
| `portal-divider`                        | `#eceef2`                          | Row separators, header bottom borders, section dividers |
| `portal-icon`                           | `#525866`                          | Inactive icons, muted labels, secondary text            |
| `portal-note-text`                      | `rgba(0,0,0,0.6)`                  | Descriptions, metadata, hints                           |
| `secondary-500`                         | `#121936`                          | Active nav, titles, accent elements, progress fill      |
| `natural-100`                           | `#000000`                          | Primary headings                                        |
| `natural-0`                             | `#ffffff`                          | Card/surface backgrounds                                |
| `badge-gray-bg`                         | `rgba(18,25,54,0.05)`              | Icon-circle background, inactive state                  |
| `badge-green-bg` / `badge-green-text`   | `rgba(14,213,137,0.1)` / `#0ed589` | Success / completed / active status                     |
| `badge-yellow-bg` / `badge-yellow-text` | `#fef9eb` / `#f5b100`              | In-progress / pending / on-hold                         |
| `badge-orange-bg` / `badge-orange-text` | `#fff6f1` / `#f97316`              | Warning / action-required                               |
| `gauge-track`                           | `#f5f7fa`                          | Progress-bar background                                 |
| `gauge-fill`                            | `#121936`                          | Progress-bar fill                                       |
| `danger-200`                            | `#fecaca`                          | Error-state border                                      |
| `danger-100`                            | `#fef2f2`                          | Error-state background                                  |
| `danger-700`                            | `#b91c1c`                          | Error-state text                                        |

---

## 2. Component Specifications

### 2.1 Page Header — `PortalPageIntro`

**Location:** `apps/web/components/portal/PortalPageIntro.tsx` (already exists, expand)

**Every page must use this header except the Home dashboard.**

**Pattern:**

```tsx
<PortalPageIntro
  title="مشاريعي"
  description="..."
  icon={FolderOpen}
  actions={<OptionalButtons />}
/>
```

**Rendered output must match this exact markup and class names:**

```html
<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div class="flex items-start gap-4">
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg"
    >
      <svg class="lucide h-7 w-7 text-secondary-500">...</svg>
    </div>
    <div class="space-y-2">
      <h1
        class="text-[28px] font-semibold leading-[1.2] text-natural-100 lg:text-[32px]"
      >
        Title
      </h1>
      <p class="max-w-3xl text-base leading-7 text-portal-note-text">
        Description
      </p>
    </div>
  </div>
  <!-- actions area -->
</div>
```

**Rules:**

- Icon rendered inside `div.h-14.w-14.rounded-full.bg-badge-gray-bg`
- Title: `text-[28px] lg:text-[32px] font-semibold text-natural-100`
- Description: `max-w-3xl text-base leading-7 text-portal-note-text`
- `actions` prop is optional; when present it sits in a `flex flex-wrap items-center gap-3`

---

### 2.2 Content Container — `PortalSurfaceCard`

**Location:** `apps/web/components/portal/PortalSurfaceCard.tsx` (already exists)

**Use this for every list/table page.**

**Pattern:**

```tsx
<PortalSurfaceCard
  title="قائمة المشاريع"
  description="..."
  icon={Activity}
  action={<FilterBar />}
>
  {/* content */}
</PortalSurfaceCard>
```

**Rules:**

- `icon` is optional but strongly recommended
- `action` is where filter bars and top-level buttons live
- Content area auto-wraps with `p-5`
- Card style: `rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0`
- Header bottom border: `border-b-[1.5px] border-portal-divider`

---

### 2.3 Table — `PortalDataTable` (NEW)

**Location:** `apps/web/components/portal/PortalDataTable.tsx`

**Reusable component that wraps shadcn `Table` with portal styling.**

**Props interface:**

```ts
interface PortalDataTableProps<T> {
  columns: {
    id: string;
    label?: string;
    align?: "right" | "center" | "left";
    width?: string;
  }[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  skeletonRows?: number;
  emptyState: {
    icon: LucideIcon;
    message: string;
    hint: string;
  };
  renderRow: (row: T) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
}
```

**Styling rules:**

- Table outer wrapper: `overflow-x-auto`
- Table: `min-w-full` or explicit `min-w-*` based on content
- Header row: `border-portal-divider`, `hover:bg-transparent`
- Header cell: `h-14 px-5 text-right text-sm font-medium text-portal-note-text`
- Body row: `border-portal-divider hover:bg-black/3`
- Body cell: `px-5 py-5`
- Progress bars inside cells use `h-2.5 rounded-full bg-gauge-track` + `h-full rounded-full bg-gauge-fill`

**States:**

- **Loading:** Show `skeletonRows` rows using `Skeleton` components in the correct number of columns
- **Error:** Red bordered box with `danger-200` border, `danger-100` bg, centered text
- **Empty:** Dashed border box + icon circle + message + hint (see Projects page pattern)

---

### 2.4 Pagination — `PortalPagination` (NEW)

**Location:** `apps/web/components/portal/PortalPagination.tsx`

**Single shared pagination component for all list pages.**

**Props:**

```ts
interface PortalPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**Rendered output:**

```html
<div
  class="flex flex-wrap items-center justify-center gap-3 border-t-[1.5px] border-portal-divider pt-5"
>
  <button
    class="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
    disabled
  >
    السابق
  </button>

  <div
    class="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg px-5 py-3 text-sm font-medium text-secondary-500"
  >
    1 من 5
  </div>

  <button
    class="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
  >
    التالي
  </button>
</div>
```

**Rules:**

- Previous button labeled `السابق`, next labeled `التالي`
- Middle pill shows `{page} من {totalPages}`
- Disabled state uses `disabled:opacity-50`, `pointer-events-none` not needed when using HTML `disabled` attribute
- When `totalPages <= 1`, hide the entire pagination wrapper
- RTL: `السابق` goes on the RIGHT, `التالي` goes on the LEFT (standard Arabic pagination)

---

### 2.5 Filter Pills — `PortalFilterPills` (NEW)

**Location:** `apps/web/components/portal/PortalFilterPills.tsx`

**Reusable status/type filter bar.**

**Props:**

```ts
interface FilterOption {
  label: string;
  value: string;
}

interface PortalFilterPillsProps {
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}
```

**Active pill:**

```
rounded-2xl border-[1.5px] border-secondary-500 bg-secondary-500 text-white
hover:bg-secondary-600 hover:text-white
```

**Inactive pill:**

```
rounded-2xl border-[1.5px] border-portal-card-border bg-white text-portal-icon
hover:bg-badge-gray-bg hover:text-secondary-500
```

**Shared styling for every pill:**

```
h-12 px-5 text-base font-medium shadow-none transition-colors
```

**Rules:**

- First option should be "الكل" (all / no filter)
- On change, reset page to 1 (handled by the consuming page, not the component itself)
- Should wrap with `flex flex-wrap items-center justify-end gap-2`

---

### 2.6 Status Badge — `StatusBadge`

**Location:** `apps/web/components/portal/StatusBadge.tsx` (already exists, DO NOT replace)

**Use this component everywhere in the portal. No shadcn `Badge` in portal pages.**

**Rules:**

- `mapProjectStatusToUI()` or `mapTaskStatusToUI()` are the ONLY mapping utilities for status → UI type
- If a page needs a new status type not in the current `StatusType`, add it to `STATUS_CONFIG` here — do NOT create a new badge component
- If a page needs a completely different badge style (e.g., for non-status data), add the variant to `StatusBadge` instead of using shadcn Badge

---

## 3. Sidebar Navigation — Accordion Grouping

### 3.1 Structure

**File:** `apps/web/components/portal/PortalSidebar.tsx`

```
Logo (مسار / MSAR)

├─ الرئيسية                          → /portal                     [standalone]
│
├─ ▼ الطلبات والمشاريع               [group]
│   ├─ الطلبات                         → /portal/requests
│   ├─ المشاريع                        → /portal/projects
│   └─ إنشاء طلب جديد                   → /portal/new-order
│
├─ ▼ التواصل                          [group]
│   ├─ المحادثات                        → /portal/chat
│   ├─ الإشعارات                       → /portal/notifications
│   └─ إجراءاتي                        → /portal/actions
│
├─ ▼ المستندات                        [group]
│   ├─ العقود                          → /portal/contracts
│   ├─ العروض الفنية                   → /portal/proposals
│   └─ مراجعة التسليمات                → /portal/deliverables
│
├─ ▼ المالية والتسويق                  [group]
│   ├─ الفواتير والمدفوعات              → /portal/finance
│   ├─ الحملات الإعلانية               → /portal/campaigns
│   └─ التقارير                         → /portal/reports
│
├─ ⚙ الاعدادات                        → /portal/account              [standalone]
│
└─ ← تسجيل الخروج                     [onClick: logout]              [standalone]
```

### 3.2 Behavior Rules

- **Accordion:** Only one group open at a time.
- **Active auto-expand:** The group containing the currently active page is always expanded on mount and stays expanded.
- **Click behavior:** Clicking a group header toggles it. If another group is open, it closes first.
- **Standalone items** (Home, Settings, Logout) are always visible and not inside groups.
- **Chevron icon:** Group headers show `ChevronDown` when open, `ChevronLeft` when closed (RTL — use ChevronRight on LTR, but since portal is RTL, `ChevronLeft` points to sub-menu direction).
- **Active link styling:** Same as today — `bg-badge-gray-bg text-[#121936] font-bold`
- **Inactive link styling:** Same as today — `text-[#A8ABB2] hover:text-[#121936]`

### 3.3 Group Header Design

- The group header button itself should NOT be a link, just a toggle.
- It should use the same base row layout as links (icon + label + chevron on left).
- Font: same as current nav items (`text-[20px] font-500`)
- Top-level icon for each group stays as the first item's icon or a representative icon.
  - **الطلبات والمشاريع:** `ClipboardList`
  - **التواصل:** `MessageSquare`
  - **المستندات:** `FileText`
  - **المالية والتسويق:** `Receipt`

---

## 4. BottomNav — 4 Primary + "More" Menu

### 4.1 Structure

**File:** `apps/web/components/portal/BottomNav.tsx`

The 4 highest-value items (based on client UX priority):

| #   | Label    | Icon           | Route              | Reason                 |
| --- | -------- | -------------- | ------------------ | ---------------------- |
| 1   | الرئيسية | `Home`         | `/portal`          | Dashboard overview     |
| 2   | المشاريع | `FolderOpen`   | `/portal/projects` | Core work tracking     |
| 3   | الفواتير | `Receipt`      | `/portal/finance`  | Money matters          |
| 4   | إجراءاتي | `CheckCircle2` | `/portal/actions`  | Actionable to-do items |

5th item: **المزيد** (`MoreVertical` or `Menu`) — opens a bottom sheet or popover menu listing the remaining items.

### 4.2 "More" Menu Items

When "المزيد" is tapped, show a fullscreen or half-height bottom panel containing:

- المحادثات → /portal/chat
- الإشعارات → /portal/notifications
- طلبات جديدة → /portal/new-order
- الطلبات → /portal/requests
- العقود → /portal/contracts
- العروض → /portal/proposals
- مراجعة التسليمات → /portal/deliverables
- الحملات → /portal/campaigns
- التقارير → /portal/reports
- الإعدادات → /portal/account

### 4.3 Styling

- Current nav bar height and border styling stay the same.
- Make each item occupy equal width (`flex-1`).
- Active state same as before.
- "المزيد" shows a small red dot if any grouped item has an unread/new state (e.g., unread notifications count). Use a simple `div.w-2.h-2.rounded-full.bg-red-500` dot.

---

## 5. Page-by-Page Change Matrix

### Legend

- ✓ No change needed (already correct)
- □ Add PortalPageIntro header
- ○ Replace table with PortalDataTable or apply table styling rules
- ⬡ Add/replace pagination with PortalPagination
- ◆ Replace filter bar with PortalFilterPills (or standardize existing filter to portal style)
- ● Replace shadcn Badge with StatusBadge
- Δ Other specific changes listed

---

### Page: `/portal` (Home)

| Area       | Action | Notes                                           |
| ---------- | ------ | ----------------------------------------------- |
| Header     | ✓ N/A  | Dashboard layout, no intro header               |
| Cards      | ✓      | DashboardCard already follows portal tokens     |
| Badges     | ✓      | Already uses StatusBadge                        |
| Filters    | N/A    |                                                 |
| Pagination | N/A    |                                                 |
| Other      | ✓      | Gauges, KPI rows, timeline items all consistent |

**Decision:** Home page is the reference for dashboard cards. Leave unchanged.

---

### Page: `/portal/projects` ✅ (REFERENCE)

| Area       | Action | Notes                                                     |
| ---------- | ------ | --------------------------------------------------------- |
| Header     | ✓      | Uses PortalPageIntro                                      |
| Surface    | ✓      | Uses PortalSurfaceCard                                    |
| Table      | ✓      | Clean styled table with progress bars                     |
| Pagination | ✓      | Uses the correct pattern — reference for PortalPagination |
| Filters    | ✓      | Status pills — reference for PortalFilterPills            |
| Badges     | ✓      | Uses StatusBadge                                          |
| Error      | ✓      | Red bordered box pattern                                  |
| Empty      | ✓      | Icon circle + message + hint                              |

---

### Page: `/portal/requests`

| Area       | Action | Notes                                                                                                          |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Header     | ✓      | Already uses PortalPageIntro                                                                                   |
| Surface    | ✓      | Already uses PortalSurfaceCard                                                                                 |
| Table      | Δ      | Uses custom card-grid instead of a table — this is **acceptable** since requests are card-based, not row-based |
| Pagination | Δ      | Replace inline pagination with `PortalPagination`                                                              |
| Filters    | ✓      | None — no filter here, acceptable                                                                              |
| Badges     | ✓      | Already uses StatusBadge                                                                                       |
| Error      | Δ      | Verify error box matches Projects pattern (it does)                                                            |
| Empty      | ✓      | Already matches Projects pattern                                                                               |

---

### Page: `/portal/actions`

| Area       | Action | Notes                                                                                    |
| ---------- | ------ | ---------------------------------------------------------------------------------------- |
| Header     | **□**  | Add PortalPageIntro with `CheckCircle2` icon                                             |
| Surface    | **□**  | Wrap in PortalSurfaceCard                                                                |
| List       | ✓      | Card-grid style is acceptable                                                            |
| Pagination | **⬡**  | Replace plain prev/next + span with `PortalPagination`                                   |
| Filters    | **◆**  | Replace `variant="default"/"outline"` button group with `PortalFilterPills`              |
| Badges     | **●**  | Replace shadcn `Badge` (priority badges, type badges) with `StatusBadge` or `PortalPill` |
| Error      | **Δ**  | Add missing error state if not present                                                   |
| Empty      | **Δ**  | Add missing empty state with icon circle                                                 |

---

### Page: `/portal/deliverables`

| Area       | Action | Notes                                                            |
| ---------- | ------ | ---------------------------------------------------------------- |
| Header     | ✓      | Already uses PortalPageIntro with `Eye` icon                     |
| Surface    | ✓      | Already uses PortalSurfaceCard                                   |
| List       | ✓      | Card-grid of review items is acceptable                          |
| Pagination | ✓      | N/A (no pagination on this page)                                 |
| Filters    | ✓      | None                                                             |
| Badges     | ✓      | Already uses StatusBadge                                         |
| Error      | ✓      | Present                                                          |
| Empty      | **Δ**  | Verify empty state matches the Projects pattern with icon circle |

---

### Page: `/portal/contracts`

| Area       | Action | Notes                                                                                                                                                                                         |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header     | **□**  | Add PortalPageIntro with `FileText` icon                                                                                                                                                      |
| Surface    | **□**  | Wrap in PortalSurfaceCard                                                                                                                                                                     |
| Table      | **○**  | Replace table with `PortalDataTable`. Remove checkboxes (unless multi-select is truly needed, in which case add to DataTable spec). Fix `dir="ltr"` if present on table wrapper.              |
| Pagination | **⬡**  | Replace page-number-buttons pattern with `PortalPagination`                                                                                                                                   |
| Filters    | **Δ**  | Search input and date range can stay (they are content-specific), but style them with portal tokens. Remove standalone "تصفية" button; search should be inside the SurfaceCard `action` area. |
| Badges     | **●**  | Replace shadcn `Badge` status with `StatusBadge` — need to add contract statuses (DRAFT, SENT, SIGNED, EXPIRED, CANCELLED) to `StatusBadge` config                                            |
| Error      | **Δ**  | Standardize error state                                                                                                                                                                       |
| Empty      | **Δ**  | Standardize empty state                                                                                                                                                                       |

---

### Page: `/portal/finance`

| Area       | Action | Notes                                                                                                                                                |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header     | **□**  | Add PortalPageIntro with `Receipt` icon                                                                                                              |
| Surface    | **□**  | Wrap in PortalSurfaceCard                                                                                                                            |
| Table      | **○**  | Replace with `PortalDataTable`. REMOVE `dir="ltr"` from table wrapper. Content is Arabic; table should be RTL.                                       |
| Pagination | **⬡**  | Replace custom pagination bar with `PortalPagination`. Remove per-page selector if it exists, or keep it styled inside the SurfaceCard action area.  |
| Filters    | **◆**  | Replace collapsible status filter chips with `PortalFilterPills`. Search input goes in SurfaceCard `action` area.                                    |
| Badges     | **●**  | Replace status text in table with `StatusBadge` — map finance statuses (PAID, PARTIAL, DUE, SENT, LATE, PENDING, CANCELLED, UNPAID) to `StatusBadge` |
| Error      | **Δ**  | Standardize                                                                                                                                          |
| Empty      | **Δ**  | Standardize                                                                                                                                          |

---

### Page: `/portal/campaigns`

| Area       | Action | Notes                                                                                                                                              |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header     | **□**  | Add PortalPageIntro with `TrendingUp` icon                                                                                                         |
| Surface    | **□**  | Wrap card grid in PortalSurfaceCard                                                                                                                |
| List       | Δ      | Card-grid is acceptable for campaigns (they're showcase cards). But standardize the card styling to match `DashboardCard` or `PortalShowcaseCard`. |
| Pagination | ✓      | N/A                                                                                                                                                |
| Filters    | ✓      | None                                                                                                                                               |
| Badges     | **●**  | Replace shadcn `Badge` status with `StatusBadge` — add campaign statuses (PLANNING, ACTIVE, PAUSED, STOPPED, COMPLETED) to config                  |
| Error      | **Δ**  | Standardize                                                                                                                                        |
| Empty      | **Δ**  | Standardize — add empty state with icon circle                                                                                                     |

---

### Page: `/portal/proposals`

| Area       | Action | Notes                                                                                                                   |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Header     | **□**  | Add PortalPageIntro with `FileText` icon                                                                                |
| Surface    | **□**  | Wrap in PortalSurfaceCard                                                                                               |
| Table      | **○**  | Replace table with `PortalDataTable`                                                                                    |
| Pagination | **⬡**  | Add `PortalPagination` if proposals are paginated (currently not clear — add only if the endpoint supports pagination)  |
| Filters    | ✓      | None                                                                                                                    |
| Badges     | **●**  | Replace shadcn `Badge` with `StatusBadge` — map proposal statuses (DRAFT, SENT, APPROVED, REVISION_REQUESTED, REJECTED) |
| Error      | **Δ**  | Standardize                                                                                                             |
| Empty      | **Δ**  | Standardize                                                                                                             |

---

### Page: `/portal/reports`

| Area       | Action | Notes                                                                                                        |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Header     | **□**  | Add PortalPageIntro with `BarChart3` icon                                                                    |
| Surface    | ✓      | KPI cards and charts are fine as-is                                                                          |
| Charts     | Δ      | Keep existing charts (they already use portal tokens). Just ensure `PortalSurfaceCard` wraps chart sections. |
| Filters    | ✓      | `TimeRangeSelector` is correct for this page (time-based analytics)                                          |
| Pagination | N/A    |                                                                                                              |
| Error      | **Δ**  | Standardize                                                                                                  |
| Empty      | **Δ**  | Standardize                                                                                                  |

---

### Page: `/portal/notifications`

| Area       | Action | Notes                                                                                                                                                                                                                                                  |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header     | **□**  | Add PortalPageIntro with `Bell` icon                                                                                                                                                                                                                   |
| Surface    | **Δ**  | Wrap everything inside `PortalSurfaceCard`                                                                                                                                                                                                             |
| Tabs       | Δ      | Keep the 3-tab filter (الكل/إجراءات/معلومات) but style them as `PortalFilterPills` or keep their existing tab-style if that works better — they are already pills. Standardize their active/inactive colors to match `PortalFilterPills` token colors. |
| Pagination | ✓      | Uses limit=50 with no UI pagination — acceptable for now                                                                                                                                                                                               |
| Badges     | N/A    |                                                                                                                                                                                                                                                        |
| Error      | Δ      | Standardize                                                                                                                                                                                                                                            |
| Empty      | Δ      | Standardize                                                                                                                                                                                                                                            |

---

### Page: `/portal/account`

| Area       | Action | Notes                                                                                      |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| Header     | **□**  | Add PortalPageIntro with `Settings` icon                                                   |
| Surface    | **□**  | Replace raw shadcn `Card` with `PortalSurfaceCard`                                         |
| Form       | Δ      | Keep the form fields. But wrap sections in PortalSurfaceCard sections instead of raw Card. |
| Pagination | N/A    |                                                                                            |
| Filters    | N/A    |                                                                                            |
| Badges     | **●**  | Replace shadcn `Badge` "عميل" with `StatusBadge` or `PortalPill`                           |

---

### Page: `/portal/chat`

| Area   | Action | Notes                                                               |
| ------ | ------ | ------------------------------------------------------------------- |
| Header | **□**  | Add PortalPageIntro with `MessageSquare` icon above the chat layout |
| Layout | ✓      | The split-panel layout is inherently correct for chat               |
| Other  | Δ      | The custom empty state could be standardized to portal tokens.      |

---

### Page: `/portal/new-order`

| Area    | Action | Notes                                                                                                               |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Header  | **□**  | Add a PortalPageIntro above the wizard with `PlusCircle` icon                                                       |
| Wizard  | ✓      | Keep the 2-step wizard layout — it's correct for multi-step forms                                                   |
| Styling | Δ      | Use portal tokens for borders (`border-portal-card-border`), spacing (`gap-5`), and surface card for content areas. |

---

## 6. StatusBadge Status Type Additions

The following statuses must be added to `StatusBadge.tsx` because they are currently rendered with shadcn Badge on various pages:

### Contract Statuses

| Backend Value | UI Type                   | Arabic Label |
| ------------- | ------------------------- | ------------ |
| DRAFT         | `inactive` or add `draft` | مسودة        |
| SENT          | `awaiting-review`         | قيد التوقيع  |
| SIGNED        | `completed`               | موقّع        |
| ACTIVE        | `active`                  | نشط          |
| EXPIRED       | `cancelled`               | منتهي        |
| CANCELLED     | `cancelled`               | ملغى         |

### Proposal Statuses

| Backend Value      | UI Type           | Arabic Label |
| ------------------ | ----------------- | ------------ |
| SENT               | `awaiting-review` | بانتظار ردك  |
| APPROVED           | `completed`       | تمت الموافقة |
| REVISION_REQUESTED | `needs-revision`  | طلب تعديل    |
| REJECTED           | `cancelled`       | مرفوض        |

### Finance / Invoice Statuses

| Backend Value | UI Type     | Arabic Label  |
| ------------- | ----------- | ------------- |
| PAID          | `completed` | مدفوعة        |
| PARTIAL       | `pending`   | مدفوعة جزئياً |
| DUE           | `revision`  | قيد الانتظار  |
| SENT          | `active`    | مُرسلة        |
| LATE          | `cancelled` | متأخرة        |
| PENDING       | `pending`   | معلقة         |
| CANCELLED     | `cancelled` | ملغاة         |
| UNPAID        | `cancelled` | غير مدفوعة    |

### Campaign Statuses

| Backend Value | UI Type       | Arabic Label |
| ------------- | ------------- | ------------ |
| PLANNING      | `not-started` | تخطيط        |
| ACTIVE        | `active`      | نشطة         |
| PAUSED        | `on-hold`     | متوقفة       |
| STOPPED       | `on-hold`     | متوقفة       |
| COMPLETED     | `completed`   | مكتملة       |

---

## 7. Error & Empty State Standard Patterns

### Error State

```tsx
<div className="rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
  <p className="text-base font-medium text-danger-700">
    حدث خطأ أثناء تحميل [resource name].
  </p>
  <p className="mt-2 text-sm text-danger-600">
    يرجى المحاولة لاحقاً أو تحديث الصفحة.
  </p>
</div>
```

### Empty State

```tsx
<div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
    <Icon className="h-8 w-8 text-secondary-500" />
  </div>
  <p className="text-lg font-medium text-natural-100">
    [Contextual message — e.g., لا توجد مشاريع حالياً.]
  </p>
  <p className="max-w-md text-sm leading-6 text-portal-note-text">
    [Hint — e.g., ستظهر هنا جميع المشاريع...]
  </p>
</div>
```

### Loading State (non-table pages)

Use `Skeleton` with dimensions matching the actual content it replaces. Wrap skeletons in the same spacing structure as the final content.

---

## 8. Icon Mapping for Page Headers

| Page          | Icon          | Lucide Import  |
| ------------- | ------------- | -------------- |
| Home          | N/A           | No header      |
| Projects      | FolderOpen    | `lucide-react` |
| Requests      | ClipboardList | `lucide-react` |
| Actions       | CheckCircle2  | `lucide-react` |
| Deliverables  | Eye           | `lucide-react` |
| Contracts     | FileText      | `lucide-react` |
| Campaigns     | TrendingUp    | `lucide-react` |
| Proposals     | FileText      | `lucide-react` |
| Reports       | BarChart3     | `lucide-react` |
| Finance       | Receipt       | `lucide-react` |
| Notifications | Bell          | `lucide-react` |
| Account       | Settings      | `lucide-react` |
| Chat          | MessageSquare | `lucide-react` |
| New Order     | PlusCircle    | `lucide-react` |

---

## 9. Implementation Order

### Step 0: Create the plan file (this document)

Already done when this file exists in the repo root.

### Step 1: Build New Shared Components

1. `PortalPagination`
2. `PortalDataTable`
3. `PortalFilterPills`
4. Update `PortalPageIntro` to support the exact markup specified above (it already matches — verify)

**Verification:** Run `turbo build` after this step.

### Step 2: Update `StatusBadge`

1. Add all new status types listed in Section 6
2. Export a generic `mapStatusToUI` helper or extend existing mapping utilities

**Verification:** Run `turbo build`.

### Step 3: Refactor Sidebar

1. Rewrite `PortalSidebar.tsx` with accordion groups
2. Implement expand/collapse logic with only-one-open-at-a-time
3. Auto-expand the active page's parent group
4. Update BottomNav to 4+1 pattern

**Verification:** Run `turbo build`, then manual browser click test on sidebar and mobile nav.

### Step 4: Refactor Pages (in order of complexity — easiest first)

Recommended order so you catch patterns that need adjusting before hard pages:

1. **Chat** — just add PortalPageIntro above layout
2. **Account** — add PortalPageIntro, wrap forms in PortalSurfaceCard
3. **Reports** — add PortalPageIntro, ensure charts wrapped consistently
4. **Notifications** — add PortalPageIntro, wrap in PortalSurfaceCard, standardize tab pills
5. **Campaigns** — add PortalPageIntro + PortalSurfaceCard, replace Badge, standardize empty/error
6. **Proposals** — add PortalPageIntro + PortalSurfaceCard, replace table + pagination + Badge
7. **Actions** — add PortalPageIntro + PortalSurfaceCard, replace filter pills, pagination, badges
8. **Contracts** — add PortalPageIntro + PortalSurfaceCard, full table replacement, pagination, filters, badges
9. **Finance** — add PortalPageIntro + PortalSurfaceCard, full table replacement, remove `dir="ltr"`, pagination, filters, badges

### Step 5: Verify & Polish

1. Run `turbo build` clean
2. Spot-check every portal page visually
3. Check mobile BottomNav on all pages
4. Check sidebar accordion interactions on desktop

---

## 10. Global Rules (Read Before Any Change)

These rules prevent drift back into inconsistency:

1. **No shadcn `Badge` in portal pages.** Use `StatusBadge` or `PortalPill` only. Exception: dashboard-admin routes are allowed to use shadcn Badge.

2. **No shadcn `Card` in portal pages.** Use `PortalSurfaceCard` or `DashboardCard` only.

3. **Page headers MUST use `PortalPageIntro`.** The only exception is the Home dashboard (`/portal`), which uses a grid of `DashboardCard`s instead.

4. **Pagination MUST use `PortalPagination`.** Never implement inline pagination again.

5. **Status/type filter pills MUST use `PortalFilterPills`.** The only exception is the Notifications page's tab filter, which is a different UX pattern (tab vs. status filter).

6. **Tables MUST use `PortalDataTable`.** Never inline a raw `Table` in a portal page again.

7. **Error and empty states MUST use the standard patterns from Section 7.**

8. **Never mix LTR/RTL styling on tables.** Finance page currently has `dir="ltr"` on a table with Arabic text — this is a bug, not a design choice.

9. **No hard-coded hex values.** Reference `globals.css` tokens. If a needed color doesn't exist as a token, add it to `globals.css` first, then use it.

10. **If a page needs a new visual pattern not covered here**, add it to `StatusBadge`, `PortalSurfaceCard`, or create a new shared portal component — don't inline it in a page.

---

## 11. Appendix — File Inventory

### New Files to Create

- `apps/web/components/portal/PortalPagination.tsx`
- `apps/web/components/portal/PortalDataTable.tsx`
- `apps/web/components/portal/PortalFilterPills.tsx`
- `apps/web/components/portal/PortalMoreMenu.tsx` (for BottomNav "More" drawer)

### Existing Files to Modify

**Components:**

- `apps/web/components/portal/PortalSidebar.tsx`
- `apps/web/components/portal/BottomNav.tsx`
- `apps/web/components/portal/StatusBadge.tsx`
- `apps/web/components/portal/PortalPageIntro.tsx` (verify/expand if needed)
- `apps/web/components/portal/PortalSurfaceCard.tsx` (verify)

**Pages:**

- `apps/web/app/(portal)/portal/chat/page.tsx`
- `apps/web/app/(portal)/portal/account/page.tsx`
- `apps/web/app/(portal)/portal/reports/page.tsx`
- `apps/web/app/(portal)/portal/notifications/page.tsx`
- `apps/web/app/(portal)/portal/campaigns/page.tsx`
- `apps/web/app/(portal)/portal/proposals/page.tsx`
- `apps/web/app/(portal)/portal/actions/page.tsx`
- `apps/web/app/(portal)/portal/contracts/page.tsx`
- `apps/web/app/(portal)/portal/finance/page.tsx`
- `apps/web/app/(portal)/portal/new-order/page.tsx`

**Tokens:**

- `apps/web/app/globals.css` (if any new token needed)

**Leave Unchanged:**

- Home page (`apps/web/app/(portal)/portal/page.tsx`) — correct as reference
- Projects page (`apps/web/app/(portal)/portal/projects/page.tsx`) — correct as reference
- Requests page (`apps/web/app/(portal)/portal/requests/page.tsx`) — mostly correct as reference
- Deliverables page (`apps/web/app/(portal)/portal/deliverables/page.tsx`) — mostly correct as reference
- All chart components (they already follow portal tokens)
- `PortalHeader`, `PortalNotificationBell`, `PortalNotificationsDropdown`
- Layout file (`apps/web/app/(portal)/layout.tsx`)

---

_End of plan._
