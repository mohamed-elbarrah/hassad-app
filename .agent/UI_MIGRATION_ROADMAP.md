# UI Migration Roadmap — shadcn as the Single Source of Truth

Status: active migration plan  
Scope: `apps/web/**`

## Goal

Migrate the frontend from the current legacy wrapper/design-token setup to a clean **shadcn-first UI** that is:

- scalable
- maintainable
- theme-driven
- page-by-page migratable
- safe to keep the old UI until the very end
- strict enough that future work does not reintroduce the same mess

---

## Current snapshot

From the current `apps/web` analysis:

- **272 files** still import from `@/components/design-system/*`
- only **33 direct `@/components/ui/*` imports** exist in app/feature code
- `apps/web/app/globals.css` still contains:
  - semantic shadcn tokens
  - legacy compatibility aliases
  - route/domain-specific tokens like `portal-*` and `pm-*`
- the old `components/design-system/README.md` still says the opposite of the new goal
- dashboard and portal routes are still heavily tied to wrapper components

This is not a rewrite candidate. It is a **migration**.

---

## Non-negotiable rules

1. **Old UI stays until replacement is complete.**
2. **No new code may be added to the legacy design-system layer.**
3. **New UI must use shadcn primitives only.**
4. **`app/globals.css` is the only token source of truth.**
5. **Shared patterns must be composed from shadcn primitives only.**
6. **No hardcoded visual styling in new shared UI.**
7. **Always check shadcn docs/CLI before adding or changing primitives.**
8. **If a shadcn primitive exists, do not replace it with raw HTML.**
9. **If a value is visual, it must come from tokens or an approved shadcn variant.**
10. **Legacy wrapper code is migration-only; it must be deleted or retired after replacement.**

---

## Operating rules for every UI change

Before editing any file in `apps/web`:

1. decide whether the change is **primitive**, **shared pattern**, or **feature/page UI**
2. check shadcn docs for every component you will use
3. reuse an existing shadcn primitive whenever possible
4. use semantic tokens/utilities from `app/globals.css`
5. avoid raw hex colors, spacing constants, border widths, radii, shadows, and sizing in TSX
6. avoid creating a new wrapper API unless it is truly shared and narrow
7. delete the legacy version after the replacement lands

---

## Target architecture

### Layer 1 — Tokens
File: `apps/web/app/globals.css`

Owns:
- reference palette tokens
- semantic tokens
- dark mode overrides
- shadcn mapping
- minimal shared scales

### Layer 2 — Primitives
Folder: `apps/web/components/ui/*`

Owns:
- official shadcn components
- local shadcn-compatible customizations

### Layer 3 — Shared patterns
Folder suggestion: `apps/web/components/patterns/*`

Owns:
- app header
- app sidebar
- page header
- list toolbar
- table shell
- metric card
- detail shell

### Layer 4 — Feature/page code
Folders:
- `apps/web/app/**`
- `apps/web/features/**`
- feature-local components

Owns:
- business logic
- route composition
- page-specific UI only

---

## Migration phases

## Phase 0 — Freeze the old system

### Do now
- stop creating new files in `components/design-system/*`
- stop introducing new legacy wrapper APIs
- stop adding new route-specific tokens in shared foundation code
- mark the old design-system README as legacy
- treat legacy wrappers as read-only migration adapters

### Exit criteria
- all new UI work goes through shadcn primitives
- no new legacy wrapper files are added
- no new hardcoded visual styling is introduced in shared UI

---

## Phase 1 — Token cleanup first

### Goal
Make `globals.css` stable before moving screens.

### Work
- keep shadcn semantic variables intact
- group tokens into:
  - reference
  - semantic
  - shared scale
  - temporary compatibility aliases
- remove duplicate / confusing token names over time
- keep compatibility aliases only for old consumers

### Exit criteria
- one readable token system
- dark mode handled through semantic tokens
- no new token names are introduced without a clear reason

---

## Phase 2 — Primitive baseline

### Goal
Make `components/ui/*` trustworthy enough for broad migration.

### Work
- inspect installed shadcn components
- add missing primitives through shadcn CLI only
- normalize imports and usage to project aliases
- use official composition patterns for forms, overlays, menus, tables, cards, tabs, etc.

### Exit criteria
- main primitives are available and used
- no missing-core-component excuses remain

---

## Phase 3 — Shared shell replacement

### Goal
Remove duplicated app-shell and layout wrappers.

### Replace with shared shadcn-based patterns:
- sidebar family
- header family
- page title / intro family
- notification bell/dropdown family
- loading/error/skeleton family

### Exit criteria
- one shared shell per app area
- no duplicate dashboard shell variants for the same job

---

## Phase 4 — Migrate in this route order

### 4.1 Sales first
Why:
- highest leverage
- lots of tables, forms, dialogs, details
- good foundation for reusable patterns

### 4.2 PM
Why:
- heavy nested detail flows
- task/project/status patterns

### 4.3 Team / Employee
Why:
- compact dashboards and update flows

### 4.4 Marketing
Why:
- cards, stats, charts, task/detail pages

### 4.5 Finance
Why:
- tables, payments, invoices, ledgers, currency display

### 4.6 Admin
Why:
- most complex area, should consume the system not define it

### 4.7 Portal / Client
Why:
- public/client-facing pages and nested details

---

## Phase 5 — Page migration order inside each route group

For every dashboard/portal section, migrate in this order:

1. **layout shell**
2. **page header / toolbar**
3. **tables / lists**
4. **forms / dialogs**
5. **detail pages / tabs**
6. **charts / metrics / special widgets**
7. **loading / empty / error states**
8. **delete old wrappers and dead imports**

This order matters. Do not jump straight into small details before the shell is stable.

---

## Phase 6 — Remove legacy wrappers for good

### Delete or retire
- thin wrappers that only re-export shadcn primitives
- duplicate components with the same job
- old design-system-only primitives
- old compatibility aliases once all consumers are gone

### Keep only if truly needed
- feature-local business components
- shared patterns with real reuse

### Exit criteria
- `components/design-system/*` is empty or only contains temporary migration leftovers
- all active UI comes from shadcn primitives or shared shadcn-based patterns
- no page still imports legacy wrappers when a shadcn primitive/pattern exists

---

## Phase 7 — Final cleanup and hardening

### Work
- remove remaining legacy token aliases
- normalize remaining hardcoded styles
- fix any route-specific UI drift
- verify dark mode and responsive behavior
- document final conventions for new work

### Exit criteria
- one UI system
- one theme system
- one set of primitives
- one way to build new screens

---

## What to migrate first in practice

Start with the highest-reuse primitives and patterns:

1. `Button`
2. `Card`
3. `Input`
4. `Dialog`
5. `Select`
6. `Tabs`
7. `Form`
8. `Table`
9. `DropdownMenu`
10. `Badge`
11. `Skeleton`
12. `Sidebar`

Then move to the shared patterns built from them.

---

## What to avoid

- do not rewrite the whole app at once
- do not keep two parallel UI systems forever
- do not add new wrappers because an existing one feels inconvenient
- do not hardcode visual values in shared components
- do not invent APIs without checking shadcn docs

---

## Definition of done

The migration is complete when:

- `components/ui/*` is the primitive source of truth
- `app/globals.css` is the token source of truth
- legacy wrappers are removed or fully retired
- pages use shadcn primitives directly or via approved shared patterns
- new UI no longer depends on `components/design-system/*`
- old compatibility tokens can be deleted safely

---

## Best way to use this roadmap

When working on the frontend, always ask:

1. Is this a primitive, a shared pattern, or feature-only UI?
2. Does shadcn already provide it?
3. Can I compose it from existing primitives?
4. Can I delete the old version after replacing it?
5. Did I introduce any hardcoded visual value that should be tokenized instead?

If the answer is unclear, stop and simplify.
