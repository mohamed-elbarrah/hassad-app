# Frontend cleanup — 2026-09-27

Branch: `cleanup/web-unused-code`

## Scope and result

This is the first, deletion-focused cleanup batch, not a claim that every unused
export or duplicate implementation has been removed. No backend files, routes,
API contracts, package manifests, or lockfiles were changed.

- Removed 81 orphan component modules: 35 portal/shared modules and 46 legacy
  design-system modules.
- Removed two unused hooks (`useFilterGroups`, `useNotifications`) and the unused
  `features/notifications/index.ts` barrel.
- Removed eight unconsumed frontend API client slices and their imports, reducers,
  middleware, and logout cache-reset entries from `lib/store.ts`.
- Removed tracked `apps/web/tsconfig.tsbuildinfo` and ignored future web compiler
  metadata.
- Updated the legacy component and notification documentation inventories.

Total: 92 source modules and one generated artifact removed. The Git diff is the
exact deletion inventory.

## UI removals

Paths below are relative to `apps/web/components/`.

| Area                   | Removed modules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth/`                | `AuthDivider`, `AuthSocialRow`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `common/`              | `NotificationBell`, `PageLayout`, `RoleGuard`, `SearchCombobox`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `dashboard/crm/`       | `ClientFiltersBar`, `ClientTimeline`, `ClientsTable`, `ClientsTableSkeleton`, `ContactAttemptDialog`, `CreateClientDialog`, `IntakeForm`, `IntakeFormModal`, `KanbanCard`, `KanbanColumn`, `KanbanGroup`, `NewRequestForClientModal`, `RequirementsForm`, `StageSelect`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dashboard/pm/`        | `ProjectActivityFeed`, `ProjectKanbanCard`, `ProjectKanbanColumn`, `TaskCard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `dashboard/pm/shared/` | `PmEmptyState`, `PmListToolbar`, `index.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `dashboard/team/`      | `CommentItem`, `FileItem`, `StatsCard`, `TeamTaskRow`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dashboard/marketing/` | `AlertList`, `CampaignPerformanceList`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `shared/`              | `ContractInvoicesList`, `ContractServicesTable`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `design-system/`       | `ActionItemCard`, `AlertCard`, `AmountBreakdown`, `Checkbox`, `CircularProgress`, `CountChip`, `CurrencyDisplay`, `DashboardCard`, `DashboardNotificationBell`, `DashboardNotificationsDropdown`, `DataTable`, `DeliverableItem`, `Divider`, `FileAttachmentRow`, `FilePreview`, `FilterBar`, `Form`, `FormInputControl`, `FormSelectControl`, `FormTextarea`, `FormTextareaControl`, `GaugeChart`, `IconCircle`, `InfoPanel`, `Input`, `MetricSwitcher`, `NotificationDropdown`, `PageIntro`, `PageSection`, `PageToolbar`, `Pagination`, `PaymentModal`, `PmCard`, `Popover`, `Primitives`, `QuickLinkCard`, `Select`, `ShowcaseCard`, `SmartTips`, `StatusBanner`, `Switch`, `Tabs`, `TimeRangeSelector`, `Timeline`, `TimelineItem`, `TopCampaignsTable` |

These modules either had no incoming imports or belonged to a cluster with no
path from application entrypoints. Exact-path verification distinguished the
orphan CRM `ClientsTable` from the active local admin overview table, and the
orphan CRM request modal from the active Sales modal.

## Logic removals

Deleted API client slices under `apps/web/features/`:

- `leads/leadsApi.ts`
- `intakeForm/intakeFormApi.ts`
- `deliverables/deliverablesApi.ts`
- `departments/departmentsApi.ts`
- `roles/rolesApi.ts`
- `permissions/permissionsApi.ts`
- `health/healthApi.ts`
- `notification-templates/notificationTemplatesApi.ts`

Checks covered hooks, lazy hooks, endpoint `initiate`/`select`/prefetch references,
exported types, and indexed state references. No feature consumers were found.
Store registration alone was not treated as proof of usage or non-usage.

All retained slices still have reducer, middleware, and logout cache-reset
registration. Authentication, `setupListeners`, and store configuration were
preserved.

## Intentionally retained / later batches

- All route entrypoints, redirects, placeholder pages, public share links, and
  `proxy.ts`.
- Five currently unconsumed installed UI primitives: `attachment`, `bubble`,
  `marker`, `message-scroller`, and `message`.
- Active shared patterns and duplicate chat/client/request/notification UI.
  Consolidation requires behavior-specific review, not deletion by similarity.
- Unused exports inside active shared files and barrel-reachable components such
  as `AdminListToolbar`, `PmDisputeCard`, and `CompactTimer`. This batch was scoped
  to whole orphan modules and isolated unused API slices.
- Individual unused endpoint candidates inside active API slices. They need a
  separate endpoint-by-endpoint removal pass after this component cleanup.
- Dependencies and lockfiles, including `react-icons` and the direct
  `@dnd-kit/utilities` declaration. Package ownership/transitive dependencies need
  a separate verified dependency batch.
- `common/NotificationsDropdown.tsx`: the notification page still imports its
  `resolveEntityUrl` helper.

## Verification

Three implementation agents worked on disjoint file sets; a separate scout
checked further candidates, and an independent reviewer audited the integrated
diff. Findings from stale documentation were corrected.

Static TypeScript AST import-graph checks included import/export declarations,
literal dynamic imports, and `require` calls, conservatively retaining barrel
edges and type imports. Framework roots included Next.js app special files,
proxy, and configuration files.

| Check                          | Before | After                               |
| ------------------------------ | ------ | ----------------------------------- |
| Tracked code modules in graph  | 714    | 622                                 |
| Route/config roots             | 310    | 310, unchanged                      |
| Unresolved local code imports  | 0      | 0                                   |
| Modules unreachable from roots | 89     | 5 installed UI primitives, retained |
| TypeScript errors              | 0      | 0                                   |
| ESLint errors                  | 0      | 0                                   |
| ESLint warnings                | 71     | 63, all pre-existing                |

Commands run from the repository root:

```sh
./node_modules/.bin/tsc -p apps/web/tsconfig.json --noEmit --incremental false
./node_modules/.bin/eslint apps/web --format json
./node_modules/.bin/prettier --check apps/web/lib/store.ts \
  apps/web/components/design-system/README.md docs/notification-migration-plan.md \
  docs/frontend-cleanup.md
git diff --check
```

No E2E tests, production build, or browser/runtime smoke test were run. Static
checks cannot guarantee behavior of external consumers or non-static module
loading; no such frontend references were found during the audit.

## Compliance Check

- Fixed: unreachable legacy frontend implementations and unused global API slice
  registrations; generated compiler metadata tracking; stale documentation.
- Deferred: the existing CRM backend staff-provided-password issue remains open
  in `docs/violations-backlog.md`. Its unused frontend form was removed; changing
  the backend invitation contract is outside this frontend-only cleanup and
  requires coordinated consumer migration. No new implementation deferrals.
- Verified clean: deletion references, route preservation, retained store
  lifecycle, frontend-only change scope, TypeScript, lint, and diff checks. No
  backend contract or full-application compliance claim is made.
