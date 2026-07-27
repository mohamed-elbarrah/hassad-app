# UI Strict Rules — Single Source of Truth

Status: Active immediately
Scope: `apps/web/**`

## Goal

Build and maintain the UI from one source of truth:

- **shadcn/ui primitives in `apps/web/components/ui/*`**
- **one token system in `apps/web/app/globals.css`**
- **small app patterns composed from shadcn primitives only**

No second custom design system. No guessing. No hardcoded visual decisions scattered across pages.

---

## Core principles

1. **shadcn/ui is the primitive layer.**
2. **`globals.css` is the token source of truth.**
3. **App patterns must be composed from shadcn primitives, not raw HTML-first styling.**
4. **Semantic tokens drive theming; components never own theme values.**
5. **No new wrapper/design-system layer is allowed.**
6. **Always use shadcn docs/skill/CLI before inventing a pattern or API.**

---

## Allowed

### 1) Primitive UI usage
Allowed imports in app code:

- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/dialog`
- `@/components/ui/card`
- `@/components/ui/table`
- `@/components/ui/tabs`
- `@/components/ui/form`
- `@/components/ui/select`
- `@/components/ui/sidebar`
- other official shadcn primitives installed in this project

### 2) App patterns
Allowed only when the component is a **real shared pattern** reused across routes, such as:

- `AppSidebar`
- `AppHeader`
- `PageHeader`
- `FilterToolbar`
- `DataTableShell`
- `MetricCard`

Rule:

- must be built from shadcn primitives
- must use semantic tokens
- must avoid raw hardcoded visual values unless tokenized
- must have a narrow, stable API

### 3) Styling
Allowed:

- Tailwind utility classes
- shadcn variants
- `cva` for reusable variants
- semantic CSS variables from `globals.css`
- responsive classes
- state classes (`data-*`, `aria-*`, Radix states)

### 4) Theming
Allowed token layers:

1. **Reference tokens**: raw palette/scale values
2. **Semantic tokens**: background, foreground, border, surface, primary, muted, destructive, etc.
3. **Component tokens**: only when necessary and shared

Dark mode must override **semantic tokens**, not rewrite component code.

### 5) Documentation workflow
Before adding or changing UI primitives/patterns:

1. read `apps/web/components.json`
2. use shadcn docs/skill/CLI
3. follow official composition patterns
4. only then implement

Useful commands:

```bash
cd apps/web
npx shadcn@latest info
npx shadcn@latest search <query>
npx shadcn@latest view <component>
npx shadcn@latest add <component>
```

If the project adopts skills:

```bash
npx skills add shadcn/ui
```

---

## Not allowed

### 1) No new `components/design-system/*`
Forbidden:

- adding new files under `apps/web/components/design-system/*`
- expanding the old wrapper layer
- creating alternate custom APIs over existing shadcn primitives without a strong reason

### 2) No HTML-first custom primitives
Forbidden for shared UI building blocks:

- custom button built from bare `button` + long class string when shadcn `Button` should be used
- custom dialog built from raw div overlays
- custom tabs, select, checkbox, popover, sheet, table, form controls, etc.

### 3) No hardcoded visual values in components
Forbidden unless truly one-off and approved:

- inline `style={{ ... }}` for colors, spacing, sizing, borders, radii, shadows
- raw hex, rgba, hsl, oklch inside TSX
- repeated arbitrary Tailwind values like `w-[336px]`, `border-[1.5px]`, `rounded-[30px]` without tokenization
- hardcoded typography values in component code

### 4) No page/domain-specific token names in shared UI
Forbidden in shared foundations:

- `portal-*`
- `pm-*`
- `sales-*`
- `admin-*`
- any route/domain-specific visual token name

Use semantic names instead:

- `surface`
- `surface-muted`
- `text-muted`
- `border-subtle`
- `primary`
- `accent`

### 5) No duplicate component families
Forbidden:

- separate sidebar/header/bell components for each dashboard when one shared pattern can handle variants
- multiple components with nearly identical markup and styles

### 6) No guessing on shadcn APIs
Forbidden:

- inventing component APIs without checking docs
- manually approximating component structure when shadcn already defines it
- editing component markup against official Radix/shadcn composition without reason

---

## Required architecture

## Layer 1 — Tokens
File: `apps/web/app/globals.css`

Owns:

- reference palette
- semantic tokens
- light/dark theme mapping
- radius/shadow/spacing/type scales

## Layer 2 — Primitives
Folder: `apps/web/components/ui/*`

Owns:

- official shadcn components
- local shadcn customizations aligned with docs
- stable primitive APIs

## Layer 3 — Shared app patterns
Suggested folder:

- `apps/web/components/patterns/*`

Owns only:

- layout/pattern components built from shadcn primitives
- shared route-independent structures

## Layer 4 — Features/routes
Folders:

- `apps/web/app/**`
- `apps/web/features/**`

Owns:

- business-specific screens
- route composition
- data wiring

Must not own new primitive styling systems.

---

## Naming rules

### Tokens
Use:

- `--ref-*` for raw values
- `--color-*` for semantic tokens
- `--radius-*`, `--space-*`, `--shadow-*` for scales
- `--component-*` only when shared and justified

### Components
Use:

- `ui/*` for primitives
- `patterns/*` for shared compositions
- feature-specific names near the feature when not globally shared

Do not use `design-system` as a second primitive layer.

---

## Decision rules

Before creating a component, ask in order:

1. **Does shadcn already provide this primitive?**
   - If yes, use or install it.
2. **Is this only a composition of existing primitives?**
   - If yes, create a small shared pattern.
3. **Is it only used in one feature/page?**
   - If yes, keep it near that feature/page.
4. **Does it introduce new visual values?**
   - If yes, add tokens first.

---

## Migration enforcement rules

From now on:

1. No new design-system wrappers.
2. No new inline visual styles.
3. No route-specific token naming in foundations.
4. No duplicate dashboard shell components.
5. Any new UI work must use shadcn docs/skill first.
6. Each migration step must delete or replace old code, not leave parallel systems forever.

---

## Review checklist

Every UI PR/change must satisfy:

- Uses `components/ui/*` primitives where applicable
- Uses semantic tokens only
- No inline visual styles
- No duplicate component introduced
- No route-specific token leakage into shared foundations
- Dark mode compatibility preserved or improved
- Checked against shadcn docs/skill/CLI before implementation

---

## Current project baseline

Project facts from `apps/web/components.json`:

- style: `default`
- RSC: `true`
- TSX: `true`
- Tailwind: v4 + CSS variables
- aliases:
  - `@/components`
  - `@/components/ui`
  - `@/lib/utils`
- icon library: `lucide`

These project settings must be respected in all UI changes.
