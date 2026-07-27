# UI Sales Audit and Migration Map

Status: Phase 2 start
Scope: CRM / Sales dashboard only

## Goal

Migrate the full Sales dashboard to the new UI rules without skipping:

- main pages
- nested detail pages
- forms
- dialogs
- tables
- kanban
- shared sales UI

This audit is the execution map for the Sales phase.

---

## 1) Sales route inventory

### Main routes
- `app/(dashboard)/dashboard/sales/page.tsx`
- `app/(dashboard)/dashboard/sales/pipeline/page.tsx`
- `app/(dashboard)/dashboard/sales/clients/page.tsx`
- `app/(dashboard)/dashboard/sales/contracts/page.tsx`
- `app/(dashboard)/dashboard/sales/proposals/page.tsx`
- `app/(dashboard)/dashboard/sales/requests/new/page.tsx`

### Nested detail routes
- `app/(dashboard)/dashboard/sales/requests/[id]/page.tsx`
- `app/(dashboard)/dashboard/sales/clients/[id]/page.tsx`
- `app/(dashboard)/dashboard/sales/contracts/[id]/page.tsx`

### Nested client tabs
- `clients/[id]/overview-tab.tsx`
- `clients/[id]/projects-tab.tsx`
- `clients/[id]/finance-tab.tsx`
- `clients/[id]/activity-tab.tsx`
- `clients/[id]/profile-edit-tab.tsx`

### Loading/error surfaces
- route-level `loading.tsx`
- route-level `error.tsx`
- sales shared loading/error wrappers

---

## 2) Sales component inventory

### Sales-specific shared layer
- `components/dashboard/sales/shared/SalesPageHeader.tsx`
- `components/dashboard/sales/shared/SalesListToolbar.tsx`
- `components/dashboard/sales/shared/SalesEmptyState.tsx`
- `components/dashboard/sales/shared/SalesDetailBreadcrumb.tsx`
- `components/dashboard/sales/shared/SalesDetailError.tsx`
- `components/dashboard/sales/shared/SalesDetailSkeleton.tsx`
- `components/dashboard/sales/shared/SalesStatusBadge.tsx`

### Page/content components
- `ClientRow.tsx`
- `ContractRow.tsx`
- `ProposalRow.tsx`
- `ProposalFormDialog.tsx`
- `CreateContractDialog.tsx`
- `SalesPipelineKanban.tsx`

### Kanban config
- `components/dashboard/kanban/configs/sales-pipeline.ts`

---

## 3) Current UI debt in Sales

## A. Direct dependency on legacy wrapper layer
Sales still depends heavily on `components/design-system/*`.

High-usage wrappers in Sales:
- `ActionButton`
- `Input`
- `FormInput`
- `FormTextarea`
- `Checkbox`
- `Tabs`
- `PageIntro`
- `MetricCard`
- `Select`
- `FilterBar`
- `Skeleton`
- `DataTable`
- `Pagination`
- `SurfaceCard`
- `InfoPanel`
- `Dialog`
- `Pill`
- `CurrencyDisplay`
- `StatusBadge`

## B. Thin wrapper duplication
Examples:
- `SalesPageHeader` is only a thin wrapper over `PageIntro`
- `SalesStatusBadge` is only a sales adapter over `StatusBadge`
- sales list/detail helpers depend on generic wrappers instead of shadcn primitives

## C. Hardcoded visual styling
Major hotspots:
- `ProposalFormDialog.tsx`
- `CreateContractDialog.tsx`
- `requests/new/page.tsx`
- `requests/[id]/page.tsx`
- `shared/SalesListToolbar.tsx`
- `kanban/configs/sales-pipeline.ts`

Patterns found:
- arbitrary sizes: `w-[130px]`, `rounded-[24px]`, `h-[132px]`
- custom borders: `border-[1.5px]`
- route-specific tokens: `portal-*`, `natural-*`, `secondary-*`
- inline `style` in form dialog
- custom scrollbar styling in dialogs
- hardcoded status colors in kanban config

---

## 4) Replacement strategy by area

## A. Page shell and page header
### Current
- `PageIntro`
- `SalesPageHeader`

### Target
- one shared pattern built from shadcn primitives only
- likely `components/patterns/page-header.tsx`
- compose from:
  - `Card` or plain semantic container only if needed
  - `Button`
  - semantic text utilities

### Action
- replace `SalesPageHeader`
- delete wrapper dependency on `PageIntro`

---

## B. List toolbars
### Current
- `SalesListToolbar`
- wrapper `Input`
- wrapper `FilterBar`
- hardcoded search icon positioning and borders

### Target
- shared pattern built from:
  - `Input`
  - `Button`
  - `Popover` / `DropdownMenu` / `Checkbox` / `Badge` as needed
  - `Separator` if needed

### Action
- rebuild `SalesListToolbar` on top of `components/ui/*`
- remove design-system `Input` and `FilterBar` dependency

---

## C. Tables and rows
### Current
- wrapper `DataTable`
- wrapper `Pagination`
- row render helpers in `ClientRow`, `ContractRow`, `ProposalRow`

### Target
- use shadcn `Table`
- use shadcn `Skeleton`, `Badge`, `Button`, `DropdownMenu` where needed
- introduce one reusable table pattern only if truly shared

### Action
- audit whether `DataTable` wrapper is worth keeping as a pattern or should be replaced directly
- row actions should use shadcn `Button`/`DropdownMenu`
- pagination should be rebuilt on top of shadcn primitives or kept as a small pattern if shared broadly

---

## D. Detail pages
### Current
- `SurfaceCard`
- `InfoPanel`
- `Pill`
- `ActionButton`
- `Dialog`
- mixed custom blocks

### Target
Use shadcn composition directly:
- `Card`
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `Tabs`
- `Dialog`
- `Button`
- `Badge`
- `Separator`
- `Table`
- `Textarea`
- `Alert` where needed

### Action
Refactor detail pages by section, not by file explosion:
1. request detail
2. client detail + tabs
3. contract detail

---

## E. Forms and dialogs
### Current
- `ProposalFormDialog.tsx`
- `CreateContractDialog.tsx`
- `requests/new/page.tsx`
- mix of wrapper form components + hardcoded HTML + custom inputs

### Target
Use shadcn form composition:
- `Form`
- `FormField`
- `FormItem`
- `FormLabel`
- `FormControl`
- `FormMessage`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Dialog`
- `Button`
- `Tabs` only where structurally necessary

### Action
These are the highest-priority cleanup files:
1. `ProposalFormDialog.tsx`
2. `CreateContractDialog.tsx`
3. `requests/new/page.tsx`

Reason:
- biggest hardcoded markup debt
- highest UI inconsistency risk
- biggest blocker to single-source-of-truth UI

---

## F. Kanban
### Current
- `SalesPipelineKanban.tsx`
- `SALES_PIPELINE_CONFIG` contains hardcoded hex colors
- page shell still uses wrapper metrics/input/select/filter

### Target
- keep business logic in sales kanban
- move visuals to semantic tokens and shadcn primitives where applicable
- replace hardcoded colors in config with token-driven values or semantic stage mapping

### Action
- migrate pipeline page shell first
- then normalize card/stage visuals
- do not skip drag-and-drop behavior or dialog flows

---

## 5) File-by-file migration map

## Keep business logic, replace UI composition

### Pipeline
- `sales/pipeline/page.tsx`
  - replace `PageIntro`, `ActionButton`, `MetricCard`, `Input`, `Select`, `FilterBar`, `Skeleton`
- `components/dashboard/sales/SalesPipelineKanban.tsx`
  - keep logic
  - review dialog usage
- `components/dashboard/kanban/configs/sales-pipeline.ts`
  - remove hardcoded hex values

### Clients list/detail
- `sales/clients/page.tsx`
  - replace `DataTable`, `Pagination`, `SalesListToolbar`, `SalesPageHeader`
- `sales/clients/[id]/page.tsx`
  - replace wrapper `Tabs`, `ActionButton`
- `clients/[id]/overview-tab.tsx`
- `clients/[id]/projects-tab.tsx`
- `clients/[id]/finance-tab.tsx`
- `clients/[id]/activity-tab.tsx`
- `clients/[id]/profile-edit-tab.tsx`
  - convert each tab to shadcn-first composition

### Contracts list/detail
- `sales/contracts/page.tsx`
  - replace list wrappers
- `sales/contracts/[id]/page.tsx`
  - replace `SurfaceCard`, `ActionButton`, `DataTable`, `CurrencyDisplay`, `InfoPanel`
- `CreateContractDialog.tsx`
  - full form/dialog cleanup

### Proposals list/form
- `sales/proposals/page.tsx`
  - replace list wrappers
- `ProposalFormDialog.tsx`
  - full form/dialog cleanup
- `ProposalRow.tsx`
  - action/button cleanup

### Requests new/detail
- `sales/requests/new/page.tsx`
  - rebuild client picker + service picker with shadcn primitives
- `sales/requests/[id]/page.tsx`
  - rebuild detail sections and contact log dialog on shadcn

---

## 6) Deletion / rebuild decisions

## Delete after replacement
- `SalesPageHeader`
- any sales helper that only adapts a design-system wrapper API

## Rebuild as small shared patterns if reused after Sales
Possible candidates:
- page header
- list toolbar
- detail breadcrumb
- detail error state
- detail skeleton
- pagination

Rule:
- only keep them if built from shadcn primitives and used beyond one file meaningfully

## Keep temporarily
- sales business logic components
- API wiring
- kanban behavior
- route structure

---

## 7) Migration order inside Sales

### Step 1 — shared sales scaffolding
- `SalesPageHeader`
- `SalesListToolbar`
- `SalesDetailError`
- `SalesDetailSkeleton`
- `SalesDetailBreadcrumb`
- `SalesStatusBadge`

### Step 2 — main list pages
- pipeline
- clients list
- contracts list
- proposals list

### Step 3 — request creation and heavy forms
- `requests/new/page.tsx`
- `ProposalFormDialog.tsx`
- `CreateContractDialog.tsx`

### Step 4 — nested detail pages
- request detail
- client detail + tabs
- contract detail

### Step 5 — kanban visual normalization
- stage config
- card surfaces
- action buttons

### Step 6 — cleanup
- remove obsolete design-system imports used by Sales
- remove dead sales wrappers
- update docs with what was removed

---

## 8) Rules for Sales execution

1. Do not skip nested pages.
2. Do not skip forms.
3. Do not skip kanban.
4. Do not leave wrapper and shadcn versions side by side longer than necessary.
5. Keep business logic stable while replacing UI composition.
6. Every new shared piece must be composed from `components/ui/*`.
7. No new hardcoded visual styles during migration.

---

## 9) Immediate next coding task

Start with:
- rebuild shared Sales scaffolding on top of shadcn primitives
- then migrate the Sales pipeline page shell

This gives the highest leverage for the rest of Sales without skipping the deeper work later.
