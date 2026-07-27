# UI Refactor Plan — Remove Wrapper Layer, Standardize on shadcn/ui

Status: Planned migration
Scope: `apps/web/**`

## Goal

Refactor the frontend into a clean, scalable UI architecture with:

- **one primitive source of truth: `apps/web/components/ui/*`**
- **one token source of truth: `apps/web/app/globals.css`**
- **shared app patterns composed from shadcn primitives only**
- **no parallel wrapper/design-system system**
- **step-by-step migration with no guessing**

---

## Problem summary

Current UI debt comes from five main issues:

1. **Two competing UI layers**
   - `components/ui/*` (shadcn)
   - `components/design-system/*` (custom wrapper layer)

2. **Mixed token levels in `globals.css`**
   - palette tokens
   - semantic tokens
   - page/domain-specific tokens
   - duplicate dark mode blocks
   - duplicate sidebar/theme sections

3. **Hardcoded HTML/styling in shared components**
   - inline styles
   - fixed pixel decisions
   - route-specific visual assumptions

4. **Duplicated app shell components**
   - sidebar/header/notification variants split per dashboard instead of shared composition

5. **No strict source-of-truth rule**
   - primitives, patterns, and feature UI are mixed together

---

## Target architecture

## 1) Tokens
File: `apps/web/app/globals.css`

Keep one token architecture:

- reference tokens
- semantic tokens
- dark mode semantic overrides
- shadcn variable mapping

Remove:

- duplicate token definitions
- route/domain-specific naming in foundations
- repeated light/dark blocks that drift apart

## 2) Primitives
Folder: `apps/web/components/ui/*`

This becomes the only primitive layer.

Use official shadcn components and customize them carefully when needed.

## 3) Shared app patterns
Suggested folder:

- `apps/web/components/patterns/*`

Examples:

- `app-header.tsx`
- `app-sidebar.tsx`
- `page-header.tsx`
- `filter-toolbar.tsx`
- `metric-card.tsx`
- `data-table-shell.tsx`

Rule: patterns are composed from shadcn primitives only.

## 4) Feature UI
Keep route/business-specific UI near features and routes:

- `apps/web/app/**`
- `apps/web/features/**`

---

## Non-goals

This plan does **not** do a big-bang rewrite.

We will **not**:

- replace the whole frontend in one pass
- add dark mode before cleanup
- keep two UI systems permanently
- invent custom primitives when shadcn already solves them

---

## Mandatory implementation workflow

For every UI task during this migration:

1. inspect `apps/web/components.json`
2. check shadcn docs/skill/CLI first
3. decide whether the need is:
   - primitive
   - shared pattern
   - feature-specific composition
4. implement using shadcn primitives
5. delete/repoint old wrapper usage
6. run verification

Suggested commands:

```bash
cd apps/web
npx shadcn@latest info
npx shadcn@latest search <query>
npx shadcn@latest view <component>
npx shadcn@latest add <component>
```

Recommended skill setup:

```bash
npx skills add shadcn/ui
```

---

## Migration phases

## Phase 0 — Governance and freeze

### Deliverables
- add strict UI rules doc
- stop new `components/design-system/*` additions
- stop new inline visual styles
- stop new duplicate dashboard shells

### Actions
- adopt `.agent/UI_STRICT_RULES.md`
- announce `components/ui/*` as the primitive source of truth
- require shadcn docs/skill usage before new UI implementation

### Exit criteria
- no new wrapper files added
- team follows source-of-truth rule

---

## Phase 1 — Foundation cleanup

### Goal
Clean tokens before migrating screens.

### Actions
1. audit `apps/web/app/globals.css`
2. classify tokens into:
   - reference
   - semantic
   - component
   - dead/route-specific
3. remove duplicated dark/light definitions
4. rename route/domain-specific tokens to semantic names
5. keep shadcn-compatible variable mapping clean and minimal

### Output
A single maintainable token system that supports future dark mode cleanly.

### Exit criteria
- no duplicate theme blocks
- no route-specific token names in shared foundations
- semantic token map is stable

---

## Phase 2 — Primitive normalization

### Goal
Standardize on shadcn primitives.

### Actions
1. audit `apps/web/components/ui/*`
2. compare against shadcn docs and installed components
3. add missing primitives through CLI instead of custom-building them
4. normalize local customizations to follow shadcn composition
5. define which legacy design-system components are actually shared patterns and which are obsolete

### Expected outcomes
- `ui/*` is trusted and complete enough for dashboard migration
- fewer excuses to keep custom wrappers

### Exit criteria
- main primitives exist in `ui/*`
- primitive APIs align with shadcn patterns

---

## Phase 3 — Replace shared shell duplication

### Goal
Remove duplicated layout families before dashboard-by-dashboard migration.

### Priority targets
1. `Sidebar` + `DashboardSidebar` → one `AppSidebar`
2. `AppHeader` + `DashboardAppHeader` → one `AppHeader`
3. `NotificationBell` + `DashboardNotificationBell` → one shared pattern
4. any duplicate shell/card/table/header family discovered during migration

### Rules
- build from shadcn primitives only
- use semantic tokens only
- no inline styles
- support variants through props/data, not copied files

### Exit criteria
- one sidebar family
- one header family
- one notification bell family

---

## Dashboard migration order

We will migrate **step by step** in this exact order:

1. **CRM / Sales dashboard**
2. **PM dashboard**
3. **Team / Employee dashboard**
4. **Marketing dashboard**
5. **Finance dashboard**
6. **Admin dashboard**
7. **Client dashboard**

For each dashboard, the same sub-plan applies.

---

## Per-dashboard migration template

### Step A — Audit current dashboard
For the selected dashboard:

- list pages/layouts/components used
- list `components/design-system/*` usage
- list direct hardcoded HTML/styling hotspots
- list duplicate patterns that should be replaced by `ui/*` or shared patterns

### Step B — Define replacement map
For each legacy component, choose one of:

- **replace with shadcn primitive directly**
- **replace with shared app pattern composed from shadcn**
- **move into feature-local component**
- **delete as dead code**

### Step C — Migrate shell first
Refactor in this order:

1. layout shell
2. header/sidebar/toolbar
3. cards/forms/tables/tabs/dialogs
4. page-level compositions
5. cleanup and delete old imports/files

### Step D — Verify
Run:

```bash
npm run verify --filter=web
```

If needed later at integration:

```bash
turbo build --filter=web
```

### Step E — Cleanup gate
Before moving to the next dashboard:

- remove replaced wrappers
- remove dead imports
- remove dead tokens introduced only for old components
- ensure no parallel implementation remains without reason

---

## Dashboard-specific objectives

## 1) CRM / Sales dashboard
First migration target.

### Why first
- strong business importance
- likely many repeated list/detail/form/table patterns
- good place to define reusable sales/CRM-friendly shared patterns

### Focus
- shell and navigation usage
- lead list tables
- filters/search/toolbars
- lead detail tabs/cards/forms
- status badges/actions using shadcn primitives

### Expected output
- clean baseline for subsequent dashboards

---

## 2) PM dashboard

### Focus
- project/task list patterns
- kanban/list/status UI
- detail side panels/dialogs
- activity/history patterns

### Reuse expected from CRM phase
- header/sidebar
- table/filter shells
- card and detail patterns

---

## 3) Team / Employee dashboard

### Focus
- personal task/workload views
- compact cards
- status widgets
- forms/dialogs for updates

### Goal
Reduce one-off employee-specific UI and reuse normalized patterns.

---

## 4) Marketing dashboard

### Focus
- campaign cards
- analytics tiles
- report tables
- date/filter controls

### Goal
Ensure metrics and chart containers follow the same shared shell rules.

---

## 5) Finance dashboard

### Focus
- invoices/payment tables
- financial summaries
- detail dialogs
- status and amount display

### Goal
Use the same table/card/form primitives without creating finance-only primitives.

---

## 6) Admin dashboard

### Focus
- broadest and most complex area
- permissions/settings/management tables and forms
- reuse all shared patterns matured in prior phases

### Goal
Admin should consume the system, not define a separate one.

---

## 7) Client dashboard

### Focus
- portal/client shell
- shared public-facing cards/tables/status panels
- simplified navigation and content areas

### Goal
Finish by folding portal/client UI into the same clean system.

---

## Legacy component disposition rules

Each existing `components/design-system/*` item must end in one of four states:

1. **Delete**
   - dead code
   - thin wrapper with no value
   - duplicate of shadcn primitive

2. **Replace with `ui/*` directly**
   - buttons, inputs, dialogs, tabs, checkbox, select, card, table, etc.

3. **Rebuild as shared pattern**
   - app shell pieces used across multiple routes

4. **Move to feature-local component**
   - business-specific rendering not suitable as a shared pattern

No component should remain in a vague middle state forever.

---

## Quality gates

A dashboard phase is complete only when:

- its routes no longer depend on legacy wrapper patterns unnecessarily
- shared UI comes from `ui/*` or approved shared patterns only
- no new inline visual styles were introduced
- tokens used are semantic and central
- duplicate shell components were not recreated
- `npm run verify --filter=web` passes

---

## Risks and controls

## Risk 1 — Replacing wrappers with random raw HTML
Control:
- require shadcn primitive usage first
- patterns must be composed from `ui/*`

## Risk 2 — Token cleanup breaks many screens
Control:
- do token cleanup in a dedicated phase
- rename/migrate tokens deliberately
- avoid mixing token refactor with broad screen rewrites in one commit

## Risk 3 — Parallel systems survive too long
Control:
- every dashboard phase includes cleanup and deletion
- no “temporary forever” wrappers

## Risk 4 — Guessing component structure
Control:
- require shadcn docs/skill/CLI before implementing

---

## Definition of success

The refactor succeeds when:

- `components/ui/*` is the only primitive UI source of truth
- `globals.css` is the only theme/token source of truth
- shared app patterns are few, clear, and built from shadcn primitives
- dashboards reuse the same structure instead of forking UI logic
- dark mode becomes a semantic-token problem, not a full rewrite problem
- future UI work no longer requires guessing or one-off styling

---

## Immediate next steps

1. adopt `.agent/UI_STRICT_RULES.md`
2. install/use shadcn skill and CLI workflow
3. start **Phase 1: token cleanup plan for `apps/web/app/globals.css`**
4. then start **CRM / Sales dashboard** migration first
