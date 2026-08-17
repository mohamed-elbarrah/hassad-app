# Design System Components

## Status

**Legacy migration layer only. Do not add new UI here.**

`@/components/ui/*` is the only source of truth for new UI.
This folder exists only to document and retire legacy wrappers during migration.

## Available Wrappers

| Component               | Replaces                                                                   | Purpose                                                                                         |
| ----------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ActionButton`          | `Button`                                                                   | All actions: primary, secondary, outline, ghost, toggle, submit, pm, action-purple, action-blue |
| `Skeleton`              | `Skeleton`                                                                 | Loading placeholders with design-system colors                                                  |
| `Input`                 | `Input`                                                                    | Search bars and generic text inputs                                                             |
| `Checkbox`              | `Checkbox`                                                                 | Form checkboxes with design-system focus ring                                                   |
| `Form`                  | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | Form composition layer                                                                          |
| `Popover`               | `Popover`                                                                  | Filter menus, date pickers                                                                      |
| `Dialog`                | `Dialog`                                                                   | Modals and payment flows                                                                        |
| `UserMenu`              | `DropdownMenu`                                                             | Sidebar user dropdown                                                                           |
| `Divider`               | `Separator`                                                                | Visual dividers                                                                                 |
| `Select`                | `Select`                                                                   | Dropdowns with label + error                                                                    |
| `SelectItem`            | `SelectItem`                                                               | Re-export for use inside `Select`                                                               |
| `UserAvatar`            | `Avatar`                                                                   | User avatars with initials                                                                      |
| `DataTable`             | `Table`                                                                    | Tables with loading, empty, error states                                                        |
| `SurfaceCard`           | `Card`                                                                     | Shell card — `rounded-[30px]`, border, shadow                                                   |
| `DashboardCard`         | `Card`                                                                     | Card with title, icon, optional "عرض الكل" action                                               |
| `PageIntro`             | header boilerplate                                                         | Page hero header with icon circle                                                               |
| `StatusBadge`           | `Badge`                                                                    | Status badge with icons & colors                                                                |
| `MetricCard`            | `StatCard`, `KpiPill`, `KpiRow`, `ProgressCard`                        | المقياس الموحد — sm/lg، عملة، أيقونة، اتجاه، pill، رابط، KpiCurrency |
| `IconCircle`            | icon wrapper                                                               | Decorative icon circle                                                                          |
| `InfoPanel`             | info block                                                                 | Reusable info/visual block                                                                      |
| `NotificationsDropdown` | notification panel                                                         | Dropdown notification list                                                                      |
| `NotificationBell`      | bell icon                                                                  | Bell button + dropdown wrapper                                                                  |
| `Pagination`            | pagination                                                                 | Page navigation                                                                                 |
| `StatusBanner`          | banner                                                                     | Success / warning / danger banner                                                               |
| `FilterBar`             | popover filter                                                             | Multi-group, multi-select filter with checkboxes, count badge, clear-all button                 |
| `Pill`                  | pill                                                                       | Tag / badge pill                                                                                |
| `AppHeader`             | header                                                                     | Top app header (currently portal-specific)                                                      |
| `Sidebar`               | sidebar                                                                    | Navigation sidebar (currently portal-specific)                                                  |
| `BottomNav`             | bottom nav                                                                 | Mobile bottom nav (currently portal-specific)                                                   |

## Creating a New Page or Feature

1. Prefer `@/components/ui/*` primitives directly.
2. If a shared pattern is needed, compose it from shadcn primitives in a dedicated shared pattern file.
3. Do not create new wrappers in this directory.
4. Do not import this directory from new UI work.

## Enforcement

Add an ESLint `no-restricted-imports` rule if needed to prevent *legacy* imports from spreading further, but do not block `@/components/ui/*` in consumer code.
