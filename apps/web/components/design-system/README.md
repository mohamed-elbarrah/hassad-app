# Design System Components

## Rule

**All UI across the entire app — client dashboard (`/portal/*`) and internal dashboards (`/dashboard/*`) — must import from `@/components/design-system/*`.**

Raw `@/components/ui/*` imports are **only** allowed inside wrapper component definitions (the files in this directory that re-export or wrap shadcn primitives).

## Available Wrappers

| Component | Replaces | Purpose |
|---|---|---|
| `ActionButton` | `Button` | All actions: primary, secondary, outline, ghost, toggle, submit, pm, action-purple, action-blue |
| `Skeleton` | `Skeleton` | Loading placeholders with design-system colors |
| `Input` | `Input` | Search bars and generic text inputs |
| `Checkbox` | `Checkbox` | Form checkboxes with design-system focus ring |
| `Form` | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | Form composition layer |
| `Popover` | `Popover` | Filter menus, date pickers |
| `Dialog` | `Dialog` | Modals and payment flows |
| `UserMenu` | `DropdownMenu` | Sidebar user dropdown |
| `Divider` | `Separator` | Visual dividers |
| `Select` | `Select` | Dropdowns with label + error |
| `SelectItem` | `SelectItem` | Re-export for use inside `Select` |
| `UserAvatar` | `Avatar` | User avatars with initials |
| `DataTable` | `Table` | Tables with loading, empty, error states |
| `SurfaceCard` | `Card` | Shell card — `rounded-[30px]`, border, shadow |
| `DashboardCard` | `Card` | Card with title, icon, optional "عرض الكل" action |
| `PageIntro` | header boilerplate | Page hero header with icon circle |
| `StatusBadge` | `Badge` | Status badge with icons & colors |
| `KpiPill` | `Badge` | Stat / KPI pill |
| `IconCircle` | icon wrapper | Decorative icon circle |
| `InfoPanel` | info block | Reusable info/visual block |
| `NotificationsDropdown` | notification panel | Dropdown notification list |
| `NotificationBell` | bell icon | Bell button + dropdown wrapper |
| `Pagination` | pagination | Page navigation |
| `StatusBanner` | banner | Success / warning / danger banner |
| `FilterPills` | filter chips | Horizontal filter pills |
| `Pill` | pill | Tag / badge pill |
| `AppHeader` | header | Top app header (currently portal-specific) |
| `Sidebar` | sidebar | Navigation sidebar (currently portal-specific) |
| `BottomNav` | bottom nav | Mobile bottom nav (currently portal-specific) |

## Creating a New Page or Feature

1. Import from `@/components/design-system/*` only.
2. If you need a primitive that doesn't have a wrapper yet, create one in this directory first.
3. Never import `@/components/ui/*` in page files, dashboard pages, or feature components.

## Enforcement (Optional)

Add an ESLint `no-restricted-imports` rule targeting `app/(portal)/`, `app/(dashboard)/`, `components/dashboard/`, and `components/design-system/` to block `@/components/ui/*` imports automatically in consumer code.
