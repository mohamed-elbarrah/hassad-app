# Portal Design System Components

## Rule

**All UI in the client dashboard must import from `@/components/portal/*`.**

Raw `@/components/ui/*` imports are **only** allowed inside wrapper component definitions (the files in this directory that re-export or wrap shadcn primitives).

## Available Wrappers

| Component | Replaces | Purpose |
|---|---|---|
| `PortalActionButton` | `Button` | All actions: primary, secondary, outline, ghost, toggle, submit, pm, action-purple, action-blue |
| `PortalSkeleton` | `Skeleton` | Loading placeholders with portal colors |
| `PortalInput` | `Input` | Search bars and generic text inputs |
| `PortalCheckbox` | `Checkbox` | Form checkboxes with portal focus ring |
| `PortalForm` | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | Form composition layer |
| `PortalPopover` | `Popover` | Filter menus, date pickers |
| `PortalDialog` | `Dialog` | Modals and payment flows |
| `PortalUserMenu` | `DropdownMenu` | Sidebar user dropdown |
| `PortalDivider` | `Separator` | Visual dividers |
| `PortalSelect` | `Select` | Dropdowns with label + error |
| `PortalSelectItem` | `SelectItem` | Re-export for use inside `PortalSelect` |
| `UserAvatar` | `Avatar` | User avatars with initials |
| `PortalDataTable` | `Table` | Tables with loading, empty, error states |

## Creating a New Page or Feature

1. Import from `@/components/portal/*` only.
2. If you need a primitive that doesn't have a wrapper yet, create one in this directory first.
3. Never import `@/components/ui/*` in page files under `app/(portal)/`.

## Enforcement (Optional)

Add an ESLint `no-restricted-imports` rule targeting `app/(portal)/` and `components/portal/` to block `@/components/ui/*` imports automatically.
