# Design System Components

## Status

**Legacy migration layer only. Do not add new UI here.**

`@/components/ui/*` is the only source of truth for new UI.
This folder exists only to document and retire legacy wrappers during migration.

## Retained Components

The 2026-09-27 frontend cleanup removed 46 modules with no application import
path. The following files remain because existing screens still use them; this
is a compatibility inventory, not a recommendation for new imports.

| File                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `AccountForm.tsx`        | Existing account-editing form               |
| `ActionButton.tsx`       | Legacy button variants                      |
| `ColorPickerControl.tsx` | Color selection control                     |
| `CurrencySymbol.tsx`     | Currency symbol presentation                |
| `Dialog.tsx`             | Existing dialog composition                 |
| `EmptyState.tsx`         | Empty and error states                      |
| `FormInput.tsx`          | Existing labeled form input                 |
| `MetricCard.tsx`         | Existing metric presentation                |
| `PageState.tsx`          | Loading, error, and empty-state composition |
| `Pill.tsx`               | Legacy status/tag presentation              |
| `ProgressBar.tsx`        | Progress presentation                       |
| `Skeleton.tsx`           | Loading placeholders                        |
| `StatusBadge.tsx`        | Legacy status presentation                  |
| `SurfaceCard.tsx`        | Existing card wrapper                       |
| `UserAvatar.tsx`         | User avatar and initials                    |

Keep existing consumers working until each replacement is verified. Shared UI
primitives remain in `@/components/ui/*`; active notification navigation lives in
the dashboard shell and portal navigation, not in the removed legacy wrappers.

## Creating a New Page or Feature

1. Prefer `@/components/ui/*` primitives directly.
2. If a shared pattern is needed, compose it from shadcn primitives in a dedicated shared pattern file.
3. Do not create new wrappers in this directory.
4. Do not import this directory from new UI work.

## Enforcement

Add an ESLint `no-restricted-imports` rule if needed to prevent _legacy_ imports from spreading further, but do not block `@/components/ui/*` in consumer code.
