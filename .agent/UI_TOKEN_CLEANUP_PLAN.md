# UI Token Cleanup Plan — `apps/web/app/globals.css`

Status: Phase 1 working plan
Scope: `apps/web/app/globals.css` and token consumers in `apps/web/**`

## Goal

Refactor the current token setup into one maintainable theme system that:

- keeps **shadcn/ui** as the primitive source of truth
- keeps `app/globals.css` as the only token source of truth
- supports dark mode cleanly
- removes route/domain-specific token leakage from the foundation
- reduces hardcoded styling pressure in components

---

## What is wrong today

Current `globals.css` mixes all layers together:

1. **reference palette tokens**
   - `--color-primary-100`
   - `--color-secondary-500`
   - `--color-success-500`

2. **semantic shadcn tokens**
   - `--background`
   - `--foreground`
   - `--primary`
   - `--muted`
   - `--border`

3. **semantic custom app tokens**
   - `--color-surface`
   - `--color-text-muted`
   - `--color-border-subtle`

4. **route/domain-specific tokens in the foundation**
   - `--color-portal-*`
   - `--color-pm-*`

5. **component/special-case tokens**
   - `--color-notification-badge`
   - `--color-gauge-fill`
   - `--min-h-field-*`
   - `--radius-card`

6. **duplicated theme definitions**
   - `@theme`
   - `:root`
   - `.dark`
   - extra `:root` / `.dark` sidebar blocks

This makes dark mode, redesign, and cleanup much harder than necessary.

---

## Current facts from shadcn

From `apps/web`:

- `npx shadcn@latest info --json`
- Tailwind: **v4**
- Base: **radix**
- Global CSS file: **`app/globals.css`**
- Installed primitives include:
  - `button`, `card`, `input`, `table`, `tabs`, `dialog`, `sheet`, `sidebar`, etc.

From the installed shadcn skill:

- CSS variables should drive theming
- dark mode should override **semantic tokens**
- components should consume semantic utilities like `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`

---

## Important findings before editing

### 1) The repo already depends on `next-themes`
But the current app provider does **not** wrap the app with `ThemeProvider` yet.

So token cleanup can start now, but full dark-mode runtime switching is still a later step.

### 2) `components/ui/sidebar.tsx` already expects shadcn sidebar tokens
It uses:

- `bg-sidebar`
- `text-sidebar-foreground`
- `border-sidebar-border`
- `ring-sidebar-ring`

So sidebar tokens should stay, but be normalized into the same semantic architecture.

### 3) Old route-specific tokens are heavily used
Examples used widely today:

- `portal-*`
- `natural-*`
- `secondary-*`
- `neutral-*`
- `badge-*`

This means token cleanup must be **incremental**, with temporary compatibility aliases during migration.

---

## Target token architecture

## Layer 1 — Reference tokens
Raw values only.

Prefix:
- `--ref-*`

Examples:
- `--ref-color-navy-500`
- `--ref-color-gold-500`
- `--ref-color-success-500`
- `--ref-space-4`
- `--ref-radius-lg`

Rules:
- no component meaning
- no route meaning
- no direct component consumption in TSX

---

## Layer 2 — Semantic tokens
The real source of theme meaning.

Prefixes:
- shadcn-native variables: `--background`, `--foreground`, `--card`, etc.
- custom semantic aliases: `--surface`, `--surface-muted`, `--text-muted`, etc.

Examples:
- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--primary`
- `--primary-foreground`
- `--muted`
- `--muted-foreground`
- `--border`
- `--input`
- `--ring`
- `--sidebar-*`
- `--surface`
- `--surface-muted`
- `--surface-subtle`
- `--text-muted`
- `--text-subtle`
- `--border-subtle`

Rules:
- dark mode changes this layer
- components should consume this layer via Tailwind utilities
- route/domain names are forbidden here

---

## Layer 3 — Shared component tokens
Only if broadly shared and justified.

Examples:
- `--radius-card`
- `--radius-dialog`
- `--field-height-sm`
- `--sidebar-width`

Rules:
- allowed only when reused
- not for one page or one dashboard

---

## Layer 4 — Tailwind v4 mapping
Use `@theme inline` to expose semantic variables as utilities.

Examples:
- `--color-background: var(--background)`
- `--color-foreground: var(--foreground)`
- `--color-surface: var(--surface)`
- `--color-text-muted: var(--text-muted)`

---

## What we will remove from the foundation

These names should disappear from the global foundation over time:

- `--color-portal-*`
- `--color-pm-*`
- other route/domain-specific names in shared tokens

These should be replaced by semantic names such as:

- `portal-bg` → `surface-muted`
- `portal-card-border` → `border-default`
- `portal-divider` → `border-subtle`
- `portal-note-text` → `text-muted`
- `portal-icon` → `text-subtle`
- `portal-nav-inactive` → `text-subtle` or `muted-foreground`
- `pm-button-bg` → button variant token/semantic surface
- `pm-button-text` → button variant foreground

---

## Cleanup strategy

## Step 1 — Rebuild `globals.css` structure without changing behavior yet

Target file order:

1. `@import`
2. `@custom-variant dark`
3. base numeric/font rules
4. `:root` reference tokens
5. `:root` semantic light tokens
6. `.dark` semantic dark tokens
7. `@theme inline` mapping
8. shared scales (`radius`, shadows, spacing, typography)
9. minimal base layer

This step is mostly **reorganization + naming discipline**.

---

## Step 2 — Normalize semantic names

Create the stable semantic set first:

### Required core set
- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--destructive`
- `--destructive-foreground`
- `--border`
- `--input`
- `--ring`

### Required custom semantic set
- `--surface`
- `--surface-muted`
- `--surface-subtle`
- `--text`
- `--text-muted`
- `--text-subtle`
- `--border-default`
- `--border-subtle`
- `--success`
- `--success-foreground`
- `--warning`
- `--warning-foreground`
- `--info`
- `--info-foreground`

### Sidebar semantic set
Keep and normalize:
- `--sidebar`
- `--sidebar-foreground`
- `--sidebar-primary`
- `--sidebar-primary-foreground`
- `--sidebar-accent`
- `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-ring`

---

## Step 3 — Add temporary compatibility aliases

Because current components still use old names, we should keep temporary aliases during migration.

Examples:
- `--color-portal-bg: var(--surface-muted)`
- `--color-portal-card-border: var(--border-default)`
- `--color-portal-divider: var(--border-subtle)`
- `--color-portal-note-text: var(--text-muted)`
- `--color-portal-icon: var(--text-subtle)`
- `--color-brand: var(--primary)`

Rule:
- compatibility aliases are temporary only
- new code must not use them

---

## Step 4 — Move raw palettes to `--ref-*`

Current palette groups:
- primary
- secondary
- alert
- success
- danger
- neutral
- natural

These should become reference tokens.

Example direction:
- `--color-secondary-500` → `--ref-color-navy-500`
- `--color-natural-0` → `--ref-color-white`
- `--color-danger-500` → `--ref-color-red-500`

This is not required to land in one commit if too risky, but it is the target.

---

## Step 5 — Remove duplicate theme blocks

Collapse all duplicated definitions into:

- one `:root` light semantic block
- one `.dark` semantic block
- one sidebar section integrated with the same semantic model

Delete drift-prone duplicate blocks after compatibility is secured.

---

## Step 6 — Migrate consumers gradually

Consumer replacement order:

1. shared shell/patterns
2. CRM / Sales dashboard
3. PM dashboard
4. Team / Employee dashboard
5. Marketing dashboard
6. Finance dashboard
7. Admin dashboard
8. Client dashboard

For each migration:
- replace old route-specific token classes/usages with semantic ones
- remove compatibility aliases only after all consumers are gone

---

## Proposed first-pass token mapping

### Surfaces
- `portal-bg` → `surface-muted`
- `portal-table-row-alt` → `surface-subtle`
- `natural-0` → `background` or `surface`
- `card` → `card`

### Text
- `portal-note-title` → `text`
- `portal-note-text` → `text-muted`
- `portal-icon` → `text-subtle`
- `portal-nav-inactive` → `text-subtle`
- `badge-gray-text` → `text`

### Borders
- `portal-card-border` → `border-default`
- `portal-divider` → `border-subtle`

### Brand / actions
- `brand` → `primary`
- `brand-hover` → custom primary hover alias or component variant handling
- `action-blue` / `action-purple` → likely temporary custom semantic action tokens until button variants are normalized

### Status
- `badge-green-*` → success semantic / badge variant
- `badge-yellow-*` → warning semantic / badge variant
- `danger-*` → destructive semantic / status variant

---

## Deliverables for the actual implementation

## Deliverable A — `globals.css` restructured
- cleaner file order
- no duplicate light/dark blocks
- normalized semantic groups
- temporary compatibility aliases preserved

## Deliverable B — migration notes
- list of deprecated token names
- list of replacement semantic names
- list of consumers still using old names

## Deliverable C — enforcement
- no new route-specific token names in foundation
- no new raw color TSX usage

---

## Rules during implementation

1. Do **not** rewrite all consumers in the same step as the token restructure.
2. Keep temporary aliases so the app remains stable while dashboards migrate.
3. New work must use semantic names only.
4. Use shadcn docs and token conventions first; do not invent parallel naming.
5. Do not add new visual values to TSX while cleaning tokens.

---

## Exit criteria for Phase 1

Phase 1 is complete when:

- `globals.css` has one clear token architecture
- route/domain-specific token names are deprecated and compatibility-only
- `.dark` overrides semantic tokens cleanly
- shared UI can begin migrating away from old token names safely

---

## Recommended next implementation step

After this plan, the next code task should be:

**Refactor `apps/web/app/globals.css` structure only, while preserving temporary aliases.**

That gives us a safe foundation before starting the **CRM / Sales dashboard** migration.
