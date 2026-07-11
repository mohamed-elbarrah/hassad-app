# Portal Dashboard Refactor Plan

> **Goal:** Aggressive restructure of the client portal (`app/(portal)/**` + supporting `components/portal/**`, `features/portal/**`, `lib/**`, `hooks/**`, and required `apps/api` portal endpoints) into a clean, reusable, type-safe, scalable architecture — with **zero behavior breaks**.
>
> **Scope:** Client portal only. Internal dashboard (`app/(dashboard)/**`) is untouched. Public share pages (`app/proposal/[token]`, `app/contract/[token]`) are untouched.
>
> **Verified ground truth (not agent hearsay):**
>
> - Backend `PortalController` `@Controller()` has **no class prefix**; routes are `portal/...` and `deliverables/...` inline. So `portalApi.approveDeliverable` → `/deliverables/${id}/approve` is **CORRECT** (not a bug). Real issue there = cache invalidation only.
> - Backend `getPortalCampaigns` / `getReviewProjects` / `getClientStrategies` return raw arrays with no pagination params — **backend work required**.
> - Contract signing uses token endpoint `/contracts/share/:token/sign` (intentional) — real bug is tag mismatch (`contractsApi` invalidates `Contract`/`Proposal` tags, portal detail uses `PortalContracts` tag → no refresh → `window.location.reload()` workaround at `contracts/[id]/page.tsx:223`).
> - Branch `feat/dispute-ticket-system`, working tree clean.
>
> **Constraint:** Every change must account for dependents. A change to a shared component/constant/hook/type ripples to every importer — each task lists its blast radius and the verification command.

---

## Execution discipline

1. **One phase at a time.** After each phase: `npx turbo run build --filter=web --filter=shared` (and `--filter=api` when API touched) must pass, plus manual smoke-test of the affected routes. Do not start the next phase until green.
2. **No `db push`.** Any schema change → `prisma migrate dev` + commit the migration file (per AGENTS.md). None planned here, but noted.
3. **Type strictness stays lenient** (`strict: false`, `strictNullChecks: false`, `noImplicitAny: false`) — match existing config. Do not add strict flags.
4. **No new tests** (repo has none). Verify via build + manual inspection.
5. **Commits** follow `.agent/PROBLEM_SOLVING.md` format:

   ```
   refactor(portal): <short>

   Why: ...
   Change: ...
   Impact: ...
   ```

6. **Branch:** create `refactor/portal-cleanup` off current branch before starting.

---

## Phase 0 — Dead code & safe cleanup (zero behavior change)

**Risk:** Lowest. Every deletion is verified unused via grep before removal.

### 0.1 Delete dead files

- `apps/web/features/portal/portalApi.ts.backup` (17.8KB, 0 importers — grep `portalApi.backup` = 0 hits).
- `apps/web/lib/finance-mock.ts` (245 LOC, 0 importers — grep `FINANCE_DATA` = 0 hits outside def).
- `apps/web/lib/baseQuery.ts.backup` (72 LOC, 0 importers).

**Impact:** None — not imported. **Verify:** `npx turbo run build --filter=web`.

### 0.2 Delete deprecated IntakeFormV2 steps

- `apps/web/components/portal/IntakeFormV2/steps/Step1_Communication.tsx` … `Step7_VisualIdentity.tsx` (≈1,872 LOC, self-documented `@deprecated`, not rendered by `IntakeFormV2.tsx`).
- Remove their exports from `apps/web/components/portal/IntakeFormV2/index.ts`.
- **Before deleting:** grep each step name across `apps/web` (excluding `.next`) to confirm 0 importers.

**Impact:** `IntakeFormV2.tsx` already uses `ProfileSections/sections/*` — no render change. **Verify:** build + navigate to `/portal/profile/setup`.

### 0.3 Remove unused imports & dead code in pages

- `app/(portal)/portal/page.tsx:34-36` — remove `useApproveProjectMutation`, `useRejectDeliverableMutation`, `useApproveDeliverableMutation` (imported, never invoked — grep `approveProject(`/`rejectDeliverable(`/`approveDeliverable(` in file = only import lines).
- `app/(portal)/portal/page.tsx:455-494` — delete commented-out `DashboardCard` "ملخص سريع" block.
- `app/(portal)/portal/campaigns/[id]/page.tsx:38` — remove unused `fmtAmount, fmtNumber, currency` from `useCurrency` destructure.
- `app/(portal)/portal/marketing-strategies/page.tsx:9` — remove unused `MARKETING_STRATEGY_STATUS_AR` import + unused `useApproveStrategyMutation`/`useRequestStrategyRevisionMutation` imports.
- `app/(portal)/portal/marketing-strategies/[id]/page.tsx:104` — remove unused `color` variable.
- `app/(portal)/portal/invoices/[id]/page.tsx:64` — remove unused `router` import.
- `notifications/page.tsx:6` — remove stray `// NEW` comment.

**Impact:** Pure dead-code removal. **Verify:** build + eslint.

### 0.4 Remove unused exports

- `lib/utils/requestStatus.ts:154-165` — `getRequestActionTone` (0 call sites; grep confirms).
- `components/portal/requests/RequestRow.tsx` — `RequestRowSkeleton` export (re-exported via `index.ts` but never rendered; DataTable uses its own `skeletonRows`). Keep the function if used internally; drop the export + `index.ts` re-export.
- `components/portal/IntakeFormV2/components/StepProgressBar.tsx` — unused `StepIndicator` export.
- `portalApi.ts:1105` — `useGetProjectRevisionsQuery` endpoint (verify 0 call sites via grep first; if truly unused, remove endpoint + `getProjectRevisions` builder + `ProjectReviewRevision[]` type if local).

**Impact:** Removes surface area. **Verify:** build + grep each removed symbol = 0 hits.

### 0.5 Fix trivial bugs

- `proposals/[token]/page.tsx:197` — `<MessageSquare className="w-4 w-4">` → `w-4 h-4` (typo; icon may render oversized).

**Phase 0 exit criteria:** build green, all portal routes still render identically.

---

## Phase 1 — Shared foundations (no UI change, drop-in)

**Risk:** Low–medium. Each new module is additive; migration is one importer at a time with build check between.

### 1.1 `lib/portal-constants.ts` (NEW)

Centralize every hardcoded constant in one typed module:

```ts
export const PORTAL_POLLING_INTERVAL_MS = 120_000 as const;
export const PORTAL_PAGE_SIZES = { actions: 6, requests: 6, projects: 9, disputes: 9, finance: 7, contracts: 10 } as const;
export const AR_LOCALE = "ar-SA-u-nu-latn" as const;       // fixes the ar-SA Arabic-Indic-digit drift
export const PORTAL_ROUTES = {
  home: "/portal",
  account: "/portal/account",
  actions: "/portal/actions",
  campaigns: "/portal/campaigns",
  campaignDetail: (id: string) => `/portal/campaigns/${id}`,
  chat: "/portal/chat",
  chatWithSales: "/portal/chat?openSales=true",
  chatWithUser: (id: string) => `/portal/chat?userId=${id}`,
  contracts: "/portal/contracts",
  contractDetail: (id: string) => `/portal/contracts/${id}`,
  deliverables: "/portal/deliverables",
  deliverableFocus: (projectId: string) => `/portal/deliverables?focus=${projectId}`,
  disputes: "/portal/disputes",
  disputeDetail: (id: string) => `/portal/disputes/${id}`,
  finance: "/portal/finance",
  invoiceDetail: (id: string) => `/portal/finance/${id}`,   // after Phase 5 route move
  marketingStrategies: "/portal/marketing-strategies",
  strategyDetail: (id: string) => `/portal/marketing-strategies/${id}`,
  newOrder: "/portal/new-order",
  notifications: "/portal/notifications",
  profile: "/portal/profile",
  profileSetup: "/portal/profile/setup",
  projects: "/portal/projects",
  projectDetail: (id: string) => `/portal/projects/${id}`,
  proposals: "/portal/proposals",
  proposalDetail: (id: string) => `/portal/proposals/${id}`,
  reports: "/portal/reports",
  requests: "/portal/requests",
} as const;
export const SNOOZE_PREFIX_RE = /^(del|inv|prop|con|strat)-/;
export const SNOOZE_FALLBACK_LABEL = "بعد 24 ساعة";
export const FILE_UPLOAD_DEFAULTS = { maxFiles: 5, maxSizeMB: 10, acceptedTypes: [...] } as const;
export const DEFAULT_CURRENCY = "SAR";
export const CURRENCY_SYMBOLS: Record<string, string> = { SAR: "ر.س" };   // consolidate w/ format.ts
export const NOTIFICATION_PAGE_SIZE = 20;  // sane default for new pagination UI
```

**Blast radius:** Every page that hardcodes a route/locale/polling/page-size. Migration: replace literals one file at a time; build after each. The `PORTAL_ROUTES` object is `as const` so TypeScript narrows keys — typos caught at compile time.

### 1.2 Extend `lib/format.ts` (absorb parallel formatters)

Add (don't break existing exports):

- `formatCompactNumber(n, locale=AR_LOCALE)` — replaces `fmtCompact`/`fmtSpend` in `reports/page.tsx` and `formatNumber` in `CampaignRow.tsx`.
- `formatReminderTime(date, locale=AR_LOCALE)` — replaces `formatReminderTime` in `actions/page.tsx` and inline version in `portal/page.tsx`.
- Timezone-safe `formatShortDateLongTZ(date)` etc. — **absorb `components/portal/project-detail/helpers.ts`** (keep the private `ARABIC_MONTHS_SHORT` + `parseCalendarDate` since `Intl.DateTimeFormat` mis-handles UTC midnight). Delete `helpers.ts` after migration; update its 8 importers (`GoalsTab`, `MeetingsTab`, `InvoiceTab`, `FilesTab`, `HeroCard`, `ReportsTab`, `StatCards`, `CampaignsTab`).

**Blast radius:** 5 files w/ inline formatters + 8 project-detail importers. Migrate one-by-one; build after each. Keep old export names as thin re-exports during migration if needed, remove at end of phase.

### 1.3 `lib/utils/errorHandler.ts` (NEW)

```ts
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
export interface NormalizedApiError {
  status: number;
  message: string;
  details?: unknown;
}
export function normalizeApiError(err: unknown): NormalizedApiError; // handles FetchBaseQueryError {data:{message}|{error:{message}}}, plain Error, unknown
export function handleMutationError(
  err: unknown,
  fallback: string,
  toast?: typeof import("sonner").toast,
): void; // toast.error(normalizeApiError(err).message || fallback)
```

Replaces ~12 `catch (err: any) { toast.error(err?.data?.message || "…") }` + the `err?.data?.error?.message` variant in disputes. **Blast radius:** 12 catch sites. Each migration is a 1-line swap; build after each.

### 1.4 `hooks/usePortalDownload.ts` (NEW)

```ts
export function usePortalDownload(
  scope: "invoice" | "strategy" | "periodReport" | "periodFile",
): {
  download: (
    id: string,
    extra?: { periodId?: string; fileId?: string },
  ) => Promise<void>;
  isDownloading: boolean;
};
```

Implementation: uses RTK Query lazy triggers (`useLazyDownloadPeriodReportQuery`, `useLazyDownloadPeriodFileQuery` already exist; **add** `downloadInvoice` + `downloadStrategy` lazy endpoints to `portalApi.ts`) so auth refresh works. Returns the URL from the response; opens via `window.open(url, "_blank", "noopener,noreferrer")`. Toasts on failure via `handleMutationError`.
Replaces:

- `invoices/[id]/page.tsx:131-144` raw `fetch(...)` (bypasses refresh).
- `marketing-strategies/[id]/page.tsx:81` raw `window.open(...)` (no credentials guarantee).

**Blast radius:** 2 pages + 2 new endpoints in `portalApi.ts`. Verify: download an invoice + a strategy with a valid session, then with an expired session (should refresh + retry, not silently fail).

### 1.5 `hooks/useApiToast.ts` (NEW)

Thin wrapper: `const { onError } = useApiToast();` → `onError(err, "fallback")` calls `toast.error(normalizeApiError(err).message || fallback)`. Convenience over calling `handleMutationError` directly. Optional — can be folded into 1.3.

### 1.6 Migrate hardcoded enum strings → `@hassad/shared`

For each domain, replace raw string literals with the shared enum **member** (not just the type import):

- `contracts/[id].tsx`: `"SENT"/"PAID"/"SIGNED"` → `ContractStatus.SENT`/`InvoiceStatus.PAID`/`ContractStatus.SIGNED`.
- `invoices/[id].tsx`: `"DUE"/"SENT"/"PARTIAL"/"LATE"/"PENDING"` (delete the `PAYABLE_STATUSES` Set, use `isInvoicePayable` from `lib/format.ts`) + `"PAID"/"PARTIAL"/"LATE"/"SUCCESS"` → `InvoiceStatus.*`/`PaymentStatus.SUCCESS`.
- `disputes/page.tsx` filter option values → `DisputeStatus.*` (enum already imported).
- `disputes/[id].tsx`: `"PENDING_CLIENT"/"APPROVED"/"IN_PROGRESS"/"ESCALATED"/"REJECTED"/"RESOLVED"` → `DisputeStatus.*`.
- `marketing-strategies/*`: `STATUS_ICON`/`STATUS_COLOR` keys → `MarketingStrategyStatus.*`; status comparisons likewise.
- `campaigns/[id].tsx:230-238`: `CampaignStatus.*`.
- `notifications/page.tsx:298-306`: `actionTypes` array → `NotificationEventType.*` values.
- `project-detail/*`: period status labels → `ProjectPeriodStatus.*`.
- `lib/utils/statusMapping.ts`: rewrite using enum imports (currently raw strings; `getStatusLabel` already drifted vs `task-status.ts` — fix the drift by sourcing labels from `TASK_STATUS_AR`).
- `portalApi.ts` type defs: `PortalCampaign.platform/status: string` → `CampaignPlatform`/`CampaignStatus`; `PortalInvoiceSummary.status: string` → `InvoiceStatus`; `ProjectSummary.status: string` → `ProjectStatus`; `PortalPeriodSummary.status` union → `ProjectPeriodStatus`.

**Blast radius:** compile-time — TS will flag any miss. Build is the safety net.

### 1.7 Centralize `PAYABLE_STATUSES` & `INVOICE_STATUS_CONFIG`

- Delete the 3 duplicate `PAYABLE_STATUSES` Sets (`invoices/[id]:30`, `ContractPaymentSummary:35`, `ContractInvoicesList:35`). All three import `isInvoicePayable` from `lib/format.ts` (already exists, already encodes the rule).
- Create `lib/utils/invoiceStatus.ts` exporting `INVOICE_STATUS_CONFIG` (label + icon + color) sourced from `@hassad/shared` `InvoiceStatus` + `INVOICE_STATUS_AR` (add Arabic label map to shared if missing). Replace the byte-identical `STATUS_CONFIG` in `ContractPaymentSummary.tsx:18-33` and `ContractInvoicesList.tsx:18-33` + the label-only `FinanceToolbar.STATUS_LABEL`.
- Migrate the `en-US` number formatting in `ContractInvoicesList`/`ContractPaymentSummary`/`ContractServicesTable` to `useCurrency`/`formatCurrency` (currently `toLocaleString("en-US") + " ر.س"` — inconsistent with portal's `ar-SA-u-nu-latn`).

**Blast radius:** 5 files. Verify: contract detail + finance pages render identical labels.

### 1.8 Centralize `MARKETING_STRATEGY_STATUS_ICON/COLOR`

`lib/utils/strategyStatus.ts` (NEW) — single source; replace the byte-identical maps in `marketing-strategies/page.tsx:24-38` and `[id]/page.tsx:28-42`. Use `MarketingStrategyStatus` enum keys + `MARKETING_STRATEGY_STATUS_AR` for labels.

### 1.9 Centralize action-item type config

`lib/utils/actionItem.ts` (NEW) — `ACTION_ITEM_TYPES` enum-like + `ACTION_TYPE_CONFIG` (label + color + icon + primaryAction). Replace `portal/page.tsx:49-82` `ACTION_TYPE_CONFIG` and `actions/page.tsx:53-62` `TYPE_CONFIG`. Add a shared enum to `@hassad/shared` if `ActionItemType` doesn't exist there (verify first; if backend uses raw strings, add the enum to shared and use it in both NestJS DTO + frontend).

### 1.10 Centralize `CONTRACT_TYPE_LABELS`

Already in `lib/format.ts:218-222` — delete the duplicate `TYPE_LABELS` in `contracts/[id]/page.tsx:33-37`; import from `lib/format`. Use `ContractType` enum keys.

### 1.11 Fix `baseQuery.retryWithDelay`

`lib/baseQuery.ts:41-62`: change retry condition from "any error" to `isNetworkError(err) || isServerError(err) || err.status === 408 || err.status === 429`. Add exponential backoff + jitter (`delay = min(cap, base * 2^attempt) * (0.5 + random()*0.5)`). Skip retry for non-idempotent methods (POST/DELETE/PATCH) unless 429. Keep max 3 attempts.

**Blast radius:** all RTK Query consumers (portal + dashboard). Behavior change: 400/403/404 surface immediately (good). Verify: trigger a validation error (e.g. invalid dispute create) — should toast on first failure, not after 3s.

**Phase 1 exit criteria:** build green; no route renders differently; error toasts show server messages; downloads work with expired sessions.

---

## Phase 2 — Shared components (drop-in replacements)

**Risk:** Medium. Each new component is built, then pages migrated one-by-one with build + visual check. Old components deleted only after all importers migrate.

### 2.1 `components/portal/shared/DomainStatusPill.tsx`

```tsx
type Domain = "contract" | "campaign" | "invoice" | "proposal" | "project";
<DomainStatusPill domain={domain} status={status} />;
```

Collapses `CampaignStatusPill`, `ContractStatusPill`, `InvoiceStatusPill`, `ProposalStatusPill` (4 byte-identical 20-line wrappers) + fixes `ProjectStatusPill` (the outlier that self-rolls `STATUS_PRESET` instead of using `StatusBadge`). Internally dispatches to the correct `mapXStatusToUI`.
**Migration:** swap imports in all row components (`CampaignRow`, `ContractRow`, `InvoiceRow`, `ProposalRow`, `ProjectRow`); delete the 5 old files. **Verify:** list pages render identical badges.

### 2.2 `components/portal/shared/QueueToolbar.tsx`

```tsx
<QueueToolbar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="ابحث..."
  filterGroups={filterGroups}
  activeFilters={activeFilters}
  onFilterChange={handleFilterChange}
  countLabel="حملة"
  count={total}
/>
```

Collapses `CampaignsToolbar`, `ContractsToolbar`, `FinanceToolbar`, `ProposalsToolbar`, deliverables `Toolbar` (5 near-identical ~70-line files). Extracts `ContractsToolbar`'s `DateRangePopover` into a separate `components/portal/shared/DateRangeFilter.tsx` (reusable). `RequestsToolbar` migrates to use `useFilterGroups` (currently hand-rolls `FilterGroup[]`).
**Migration:** one toolbar at a time; delete old file after its page builds. **Verify:** each list page's toolbar behaves identically (search, filter, count chip).

### 2.3 `components/portal/shared/DetailBreadcrumb.tsx`

```tsx
<DetailBreadcrumb
  backHref={PORTAL_ROUTES.contracts}
  backLabel="العقود"
  title={data.title}
/>
```

Replaces the 4 hand-built breadcrumb blocks (`campaigns/[id]`, `contracts/[id]`, `invoices/[id]`, `proposals/[token]`). **Verify:** detail pages render identical breadcrumb.

### 2.4 `components/portal/shared/DetailErrorState.tsx` + `DetailSkeleton.tsx`

```tsx
<DetailErrorState title="تعذر تحميل العقد" onRetry={refetch} backHref={...} backLabel={...} />
<DetailSkeleton variant="contract|invoice|proposal|project|campaign" />
```

Replaces the 5 hand-built `SurfaceCard` "تعذر تحميل..." fallbacks + ~6 hand-built `Skeleton` stacks. `variant` picks the right skeleton shape.

### 2.5 `components/portal/shared/PortalEmptyState.tsx`

```tsx
<PortalEmptyState icon={...} title="لا توجد فواتير حالياً" hint="..." actionLabel="..." onAction={...} />
```

Unifies the 6 empty-state impls (DataTable `emptyState` prop, design-system `EmptyState`, portal-local `project-detail/EmptyState`, `DisputeEmptyState`, `ChatEmptyState`, inline ad-hoc). DataTable's `emptyState` prop stays (it's a good API) but internally renders `<PortalEmptyState>`.
**Migration:** the design-system `EmptyState` and `common/EmptyState` may have dashboard importers — **do NOT delete them**. Only the portal-local ones (`project-detail/EmptyState`, `DisputeEmptyState`, `ChatEmptyState`) get deleted after their importers migrate. **Verify:** empty lists, chat with no conversations, disputes with no tickets.

### 2.6 Add `isError` branches where missing

- `disputes/page.tsx` — add `if (isError) return <DetailErrorState ... onRetry={refetch} />` before the empty-state branch.
- `disputes/[id]/page.tsx` — distinguish 404 (`notFound()`) from 500 (`DetailErrorState`); replace emoji 🔍 with `DetailErrorState`.
- `marketing-strategies/page.tsx` + `[id]/page.tsx` — same.
- `notifications/page.tsx` — same.
- **`finance/page.tsx:121`**: change `isError={false}` → `isError={isInvoicesError}`. This is the silent-swallow P0.
- `chat/page.tsx:67,89`: replace `.catch(() => {})` with `handleMutationError` + toast.

### 2.7 Migrate `disputes/[id]/page.tsx:13` from shadcn `ui/button` → `ActionButton`

Only portal page using a different button library. Swap the 2 button usages (L99, L173) to `<ActionButton variant="...">`. **Verify:** dispute detail action buttons render identically.

### 2.8 Extract inline sub-components (oversized files)

- `ReviewModal.tsx` (723 LOC) → split into `ReviewModal/index.tsx` + `Header.tsx` + `FilesSection.tsx` + `ImageLightbox.tsx` + `RevisionHistory.tsx` + `ModalSkeleton.tsx`. Fix the nested `<Dialog>` focus-trap issue (inner lightbox re-registers global arrow-key handlers at L91-106 — scope them to the lightbox container).
- `RequestRow.tsx` (350 LOC) → extract `RequestActionCell`, `RequestDetail`, `RequestRowSkeleton` (if kept), `getRequestDescription` (move business logic to `lib/utils/requestStatus.ts`).
- `CampaignRow.tsx`/`ProjectRow.tsx`/`ContractRow.tsx` → extract inline cell subcomponents into the row file (keep co-located) or a `cells/` subfolder if reused.
- `AudienceSection.tsx` (502), `VisualSection.tsx` (553), `PerformanceSection.tsx` (387), `ProductSection.tsx` (394) → split each into `*Section/index.tsx` + `*Form.tsx` + `*View.tsx` (the three-mode render is why they're huge).

### 2.9 Replace `notifications/page.tsx` 11 inline `<svg>`s with lucide imports

Map each inline SVG to its lucide equivalent (`FileText`, `Receipt`, `Package`, etc.). Move the `ENTITY_ICON_MAP` color values from hardcoded hex (`#7A13E8`, `#2684FC`, `rgba(...)`) to `action-purple`/`action-blue`/`action-blue-soft` tokens. Fix the duplicate `invoice`/`INVOICE` and `payment`/`PAYMENT` keys (normalize to one casing).

### 2.10 Extract `useSnoozeActionItem` hook

`hooks/useSnoozeActionItem.ts` — wraps `stripPrefix` + `useSnoozeActionItemMutation` + `formatReminderTime` + toast. Replaces the duplicated logic in `portal/page.tsx:142-160` and `actions/page.tsx:76-176`.

### 2.11 Fix `FileDropzone.tsx` memory leak

`components/shared/FileDropzone.tsx:167` — track created object URLs and `URL.revokeObjectURL` them on file removal/unmount. Also: add `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) to the dropzone div (currently keyboard-inaccessible). Replace the inline `formatSize` with `formatFileSize` from `lib/format.ts`.

### 2.12 Fix `PersonalInfoSection` data-flow inconsistency

`components/shared/ProfileSections/sections/PersonalInfoSection.tsx:82-129` — currently the section calls `useUpdateUserMutation` directly while every other section raises data via `onDataChange`. Two options:

- (a) Make it consistent: raise data up like the others (parent owns the save).
- (b) Document it as the exception (it writes to `User`, not `ClientProfileV2`).
  Recommend (a) for consistency. **Blast radius:** `ProfileEditV2.tsx` (parent) + intake wizard. Verify save still works.

**Phase 2 exit criteria:** build green; every list/detail page renders identically; errors surface (not swallowed); downloads work post-session-expiry.

---

## Phase 3 — Token system hardening (no dark mode)

**Risk:** Low. Purely class-name swaps. Build is the safety net; visual diff each affected page.

### 3.1 Add missing tokens to `app/globals.css` `@theme {}`

- Typography scale: `--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-title`, `--text-body`, `--text-sm`, `--text-xs`, `--text-caption`, `--text-micro` + matching `--leading-*` pairs. Map the 15 arbitrary `text-[Npx]` sizes to these.
- Radius: `--radius-card` (30px), `--radius-card-sm` (16px), `--radius-dialog` (24px), `--radius-pill-sm` (10px).
- Border width: `--border-width-card` (1.5px) → expose as Tailwind v4 `--border-width-*` so `border-card` works.
- Z-index: `--z-base`, `--z-sticky`, `--z-dropdown`, `--z-overlay` (50), `--z-modal` (60), `--z-toast`.
- Field heights: `--min-h-field-sm` (60px), `-md` (80px), `-lg` (120px).
- Truncation: `--max-w-name-sm` (200px), `-md` (260px), `-lg` (300px).
- `--font-mono` (for the one `font-mono` usage in `PaymentModal.tsx:178`).
- Expose `--color-logout-text`, `--color-notification-badge`, `--color-verified-badge` as utilities via `@theme inline` (currently declared but not consumable as classes).
- `--color-secondary-soft` (the `#1219360d` / `rgba(18,25,54,0.05)` used by `Tabs.tsx:25`, `badge-gray-bg`, sidebar active — unify).
- `--color-table-row-alt` (`#f0f2f5` from `DataTable.tsx:167` — distinct from existing `--color-portal-table-row-alt: #f5f7fa`; decide canonical or merge).
- `--color-file-preview-dark` (`#10172f` from `FilePreview.tsx:51` — map to `secondary-600` or add token).
- `--color-secondary-500-hover` (`#1a234a` from `NotificationDropdown.tsx:530`).
- Info/review semantic tokens OR formally map `action-blue`/`action-purple` + soft variants for `StatusBadge` use (replace the raw `blue-*`/`purple-*` in `StatusBadge.tsx:38-79,193-259`).

### 3.2 Replace arbitrary values with tokens (file-by-file)

For each occurrence catalogued in the audit:

- `text-[Npx]`/`leading-[Npx]` → typography scale tokens.
- `rounded-[30px]/[24px]/[16px]/[10px]` → radius tokens.
- `border-[1.5px]` (42×) → `border-card`.
- `min-w-[20px]` → count-badge token; `min-h-[60/80/120px]` → field-height tokens; `max-w-[140-300px]` → truncation tokens.
- `w-[373px]` (search input, duplicated in `AppHeader` + `DashboardAppHeader`) → `w-header-search` token.
- `z-10/z-40/z-50/z-[60]` → z-index tokens; fix the `NotificationDropdown` (z-[60]) vs `Dialog` (z-50) collision.
- Arbitrary icon sizes via inline `style={{width,height}}` → lucide `className="w-N h-N"` convention.
- `top-[22px]`, `aspect-[4/3]`, `grid-cols-[140px_1fr_180px]`, `max-w-[min(96vw,1100px)]` → evaluate per-case (some legitimate; tokenize the repeated ones).

### 3.3 Replace hardcoded hex with token classes

For each `text-[#...]`/`bg-[#...]`/`style={{color/background: "#..."}}`:

- Navy `#121936` → `text-secondary-500` / `bg-secondary-500` (4 spellings → 1).
- Divider `#eceef2`/`#ECEEF2` → `border-portal-divider` / `bg-portal-divider` (case mismatch fixed).
- Card border `#e1e4ea` → `border-portal-card-border`.
- Nav inactive `#a8abb2` → `text-portal-nav-inactive`.
- Black `#000000` → `text-natural-100`.
- `rgba(0,0,0,0.6)` → `text-portal-note-text`.
- Logout red `#ff6161` → `text-logout` (after exposing utility).
- Action blue/purple → `text-action-blue`/`text-action-purple`.
- Portal bg `#F9FAFB` (layout.tsx:70, profile/setup:42 inline style) → `bg-portal-bg` class (delete inline style).

### 3.4 Unify `StatusBadge.tsx` to one color system

Rewrite the proposal/contract/project status branches (L38-79, 193-259) to use semantic tokens (`success-*`/`alert-*`/`danger-*`/`neutral-*` + `action-blue`/`action-purple`) instead of raw `blue-*`/`purple-*`/`orange-*`. Match the finance-status branch style (L5-35) which already uses tokens.

### 3.5 Replace `bg-white` containers with `bg-card`/`bg-background`

~25 components hardcode `bg-white` (see audit list). Swap to `bg-card` (semantic). **Verify:** each affected page renders identical background (light mode unchanged; this just makes it token-driven).

### 3.6 Normalize hex case

All hex literals → lowercase (`#ECEEF2` → `#eceef2`). Cosmetic; do during 3.3.

### 3.7 Resolve dead `--spacing-space-*` scale

Decision: **delete** the 11 unused `--spacing-space-*` tokens (they're dead weight; the portal uses Tailwind's default scale consistently). Document in commit.

### 3.8 Fix `SmartTips.tsx` color maps

Replace the untokenized literals (`#FFF7ED`, `#FEF2F2`, `#F0FDF4`, `#F43F5E`, `#10B981`, `#6B7280`) with `alert-*`/`danger-*`/`success-*`/`neutral-*` tokens.

### 3.9 Replace `bg-amber-50 border-amber-200 text-amber-800` etc. in `disputes/[id]`, `marketing-strategies/[id]`, `new-order`, `HeroCard`, `MeetingsTab`, `StatCards`, `GoalsTab`, `InvoiceTab` with `alert-*`/`danger-*`/`success-*`/`neutral-*`/`action-blue`/`action-purple` tokens.

**Phase 3 exit criteria:** build green; grep for arbitrary `text-[`, `bg-[#`, `border-[1.5px]`, `bg-white` in portal scope = near-zero (allow documented exceptions); visual diff every affected page.

---

## Phase 4 — Data layer correctness

**Risk:** High. Touches cache behavior + backend. Each change verified with a real flow (sign → refresh, pay → refresh, approve deliverable → queue refresh).

### 4.1 Fix tag invalidation in `portalApi.ts`

- `getPortalFinanceSummary` (L628-631): change `providesTags: ["PortalInvoices"]` → `providesTags: ["PortalFinanceSummary"]` (new tag). Add to `tagTypes`.
- `getPortalInvoices` (L695-706): keep `PortalInvoices` list tag. Add per-id `[{PortalInvoices, id}]` to detail (already correct at L890-893).
- `signContract` (L799-805): add `"PortalInvoices"` to `invalidatesTags` (signing may generate invoices).
- `approveDeliverable`/`rejectDeliverable` (L782-796): add `"ReviewProjects"` + `[{PortalProjects, id}]` (the id isn't available in the arg — pass the projectId via a new arg shape `{ id, projectId }` and invalidate `[{PortalProjects, projectId}]`).
- `createDispute` (L994-1008): add `[{ClientDispute, "NEW"}]` pattern is wrong — just invalidate `ClientDisputes` (already does). Fine. But also invalidate `PortalRequests` if disputes link to requests (verify in schema).
- `addDisputeMessage` (L1010-1027): add `"ClientDisputes"` to `invalidatesTags` (so list message counts refresh).
- `getProjectRevisions` (L868-870): add `providesTags: [{PortalProjects, id: "LIST" }]` pattern or a dedicated `ProjectRevisions` tag + invalidate on `requestProjectRevision`. (Or delete the endpoint if Phase 0 confirmed it's unused.)
- `getDeliverableRedirect` (L901-904): remove `providesTags: [{ReviewProjects, id}]` (wrong tag — a redirect resolver has nothing to do with review projects).

### 4.2 Fix contract-signing cross-slice coherence

Two options:

- (a) **Add a portal-side signing endpoint** to `portalApi.ts` (`signContractByToken` → `/portal/contracts/:token/sign`) and use it in `contracts/[id]` instead of `contractsApi`. Requires backend route (or confirm `/contracts/share/:token/sign` is the intended one and add a portal-aliased path).
- (b) **Keep `contractsApi` mutation but add cross-slice invalidation**: in the page's `onSuccess`, manually `dispatch(portalApi.util.invalidateTags(["PortalContracts"]))` after `signContract` succeeds. Remove `window.location.reload()`.

Recommend (b) — minimal, no backend change. **Verify:** sign a contract → portal detail refreshes showing "SIGNED" without page reload.

### 4.3 Consolidate portal proposals/contracts/clients behind `features/portal/`

Stop portal pages importing `features/proposals/proposalsApi`, `features/contracts/contractsApi`, `features/clients/clientsApi` directly. Options:

- (a) Add portal-aliased endpoints to `portalApi.ts` (`getPortalProposals`, `getPortalProposalByToken`, `approvePortalProposalByToken`, etc.) hitting the same backend routes. Re-tag with portal tags.
- (b) Thin re-exports from `features/portal/index.ts` with portal tag invalidation adapters.

Recommend (a) — clean boundary. **Backend:** no change needed (same routes). **Verify:** proposals list + token detail + approve + revision all work via portal slice only.

### 4.4 Backend: add pagination to the 5 unbounded endpoints

NestJS `PortalController` + `PortalService` changes:

- `getPortalCampaigns` (`portal.controller.ts:520`): accept `@Query("page") page?, @Query("limit") limit?, @Query("search") search?`. Service returns `{ data, total, page, limit }`. Update the `@hassad/shared` `PortalCampaignsResponse` type (or add).
- `getReviewProjects` (L727): same.
- `getClientStrategies` (L847): same. Fix the `any[]` return — type it as `MarketingStrategySummary[]` (add to shared if missing).
- `getSnoozedActionItems` (the snoozed endpoint): accept `page/limit`.
- Notifications: `portal-notifications.controller.ts` already accepts `page/limit` — frontend just needs to wire pagination UI (Phase 5).

**Migration safety:** keep backward-compat — if `page/limit` omitted, return all (so old client builds don't break during deploy). Frontend sends `page/limit` only after Phase 5 UI lands. **DB:** add `prisma.$queryRaw` COUNT + `skip/take` — no schema change, no migration.

**Verify:** hit each endpoint with `?page=1&limit=5` via curl/browser devtools → paginated response. Hit without params → still returns all (backward compat).

### 4.5 Frontend: wire server-side pagination to the 5 list pages

- `campaigns/page.tsx`, `proposals/page.tsx`, `deliverables/page.tsx`, `marketing-strategies/page.tsx`: replace `useMemo` client-filter with `useGet...Query({page, limit, search, status})` server params. Add `<Pagination>` (exists in design-system). Move `search`/`status` from local filter state to query args (debounced).
- `actions/page.tsx` snoozed tab: pass `page/limit` to `useGetSnoozedActionItemsQuery`.
- **Cross-page search bug fix** (`projects`, `requests`, `finance`, `disputes`): backend `getPortalProjects` (L535) already accepts `page/limit/status` but **not `search`**. Add `@Query("search") search?` to `getPortalProjects`, `getPortalInvoices`, `getClientDisputes`, `getPortalRequests`. Service does `WHERE name ILIKE %search%`. Frontend moves `search` from `useMemo` to query arg.

**Verify:** each list page — search returns matches across all pages; pagination reflects total.

### 4.6 Fix avatar upload

`account/page.tsx:43-63` — replace the fake `URL.createObjectURL` with a real upload. Options:

- (a) Add a `POST /portal/users/avatar` endpoint (NestJS) using `@UploadedFile` + Multer, store to R2 or local, return the persistent URL.
- (b) Use an existing user-avatar endpoint if one exists in `features/users/usersApi` (grep `avatar` in `apps/api/src/modules/users`).

Recommend (a) if none exists. **Verify:** upload avatar → reload page → avatar persists.

### 4.7 Unify sockets

- Make `useNotificationSocket` + `useDashboardNotificationSocket` use the `lib/socket.ts` singleton (not create their own `io()`). Fix the URL mismatch (`lib/socket.ts` strips `/v1`; the per-component ones use `getApiBaseUrl()` which adds `/v1` — standardize on one).
- Fix `useSocket.ts:28` `disconnectSocket()` on unmount — change to ref-count or only disconnect on app teardown. A single unmount must not tear down the shared socket.
- Wire `useChatSocket` to invalidate `chatApi` cache on new message (currently merges into local state at `chat/page.tsx:127-135` — lost on remount).

**Verify:** open two browser tabs on chat → message in tab A appears in tab B; close one tab → other tab's socket stays connected.

### 4.8 Fix `notifications/page.tsx` pagination

Replace `useGetMyNotificationsQuery({page:1, limit:50, isRead})` with `{page, limit: NOTIFICATION_PAGE_SIZE, isRead}` + `<Pagination>` or infinite scroll. Remove the redundant `data as unknown as {...}` cast (L343-350) — fix the API slice types so the cast is unnecessary.

### 4.9 Type the marketing-strategies API

`getClientStrategies`/`getClientStrategy` return `any`/`any[]` (`portalApi.ts:929-934`). Define `PortalStrategySummary` + `PortalStrategyDetail` types (mirror backend DTO; add to `@hassad/shared` if reusable). Replace `any` throughout. **Verify:** build catches the status-string drift that's currently silent.

### 4.10 Fix `proposals/[token]/page.tsx` `servicesList` cast

`data.servicesList as {name;price}[]` (L141, 147) — type `servicesList` correctly in the API slice (`ServiceItem[]` from shared; if `ServiceItem` lacks `price`, extend shared). Delete the casts.

**Phase 4 exit criteria:** build green (web + api + shared); each data flow verified end-to-end (sign/pay/approve/create/download); expired-session download refreshes; chat syncs across tabs; avatar persists.

---

## Phase 5 — Architecture (Next 16 idioms)

**Risk:** Highest — routing/layout changes. Do last, after foundations are solid. Each layout change verified by navigating every affected route.

### 5.1 Split `app/(portal)/layout.tsx` into server shell + client guard

- `app/(portal)/layout.tsx` → **server component**: renders `Sidebar` (client child) + `AppHeader` (client child) + `BottomNav` (client child) + `{children}`. No auth logic here.
- **NEW** `app/(portal)/portal/layout.tsx` → **client component, thin**: the `RequireRole(CLIENT)` guard + intake gate, extracted from the old `layout.tsx:26-42`. Renders `<>{children}</>` on success, spinner/redirect on failure.
- `profile/setup` carve-out: instead of `pathname === "/portal/profile/setup"` string compare, move `profile/setup/` **out** of the `portal/` folder's guard scope — e.g. `app/(portal)/portal/profile/setup/` gets its own `layout.tsx` that overrides the guard (or move it to `app/(portal)/setup/` as a sibling route group). **Verify:** non-client user hitting `/portal/...` redirects without shell flash; setup page renders without shell.

### 5.2 Add per-segment `loading.tsx` + `error.tsx`

For the 6 table-heavy routes + 5 detail routes:

- `portal/contracts/loading.tsx`, `portal/campaigns/loading.tsx`, `portal/finance/loading.tsx`, `portal/projects/loading.tsx`, `portal/disputes/loading.tsx`, `portal/requests/loading.tsx` — table-shaped skeletons (header row + N body rows).
- `portal/contracts/[id]/loading.tsx`, `portal/invoices/[id]/loading.tsx`, `portal/proposals/[token]/loading.tsx`, `portal/projects/[id]/loading.tsx`, `portal/disputes/[id]/loading.tsx` — `DetailSkeleton variant=...`.
- Keep the segment-level `loading.tsx` as the outer fallback but make it route-aware (or leave generic — the per-route ones take precedence).
- Add `error.tsx` per detail route with route-specific `backHref`.

**Verify:** navigate to each route → correct skeleton shape flashes (not the generic 3-card).

### 5.3 Standardize `params` typing

Migrate the 4 legacy pages to Next 16 idiom:

- `deliverables/[id]/page.tsx:29-31` → `interface PageProps { params: Promise<{id: string}> }` + `const { id } = use(params)`.
- `invoices/[id]/page.tsx:62-65` → same.
- `marketing-strategies/[id]/page.tsx:45-47` → same.
- `projects/[id]/page.tsx:93-94` → same.

**Verify:** build green; each detail route renders.

### 5.4 Add metadata

- `app/(portal)/portal/template.tsx` (NEW) — `export const metadata = { title: { default: "حصاد", template: "%s | حصاد" } }`. Every page that sets `title` gets the suffix automatically.
- Add `export const metadata = { title: "..." }` (static) or `export async function generateMetadata({params}): Promise<Metadata>` (dynamic, for detail pages) to every portal page. Arabic titles: `"الفواتير"`, `"العقد #{id}"`, etc.
- Fix root `app/layout.tsx:14-17` description to Arabic or make it portal/dashboard-aware (root is shared — keep English generic, portal template overrides).

**Verify:** browser tab shows "الفواتير | حصاد" on finance page, "العقد #abc123 | حصاد" on contract detail.

### 5.5 Convert static/list pages to server components

For each page where the only interactivity is a small toolbar/pagination:

- `new-order/page.tsx` — drop `"use client"` (zero hooks). Pure server. **Verify:** renders.
- `marketing-strategies/page.tsx` — server page renders the list shell + `<StrategiesListClient>` child (client, owns the query + toolbar + pagination). Pass initial data via `await apiFetch` if you want streaming; otherwise let the client child fetch.
- `proposals/page.tsx` — same pattern: server page + `<ProposalsListClient>`.
- `contracts/page.tsx` — same.
- `campaigns/page.tsx` — same.
- `invoices/page.tsx` — already server (redirect). Keep.
- Detail pages (`[id]`): keep client (they have mutations + complex state) but extract the server-fetchable parts (header, static sections) into server children where possible. Lower priority.

**Verify:** each converted page — initial HTML in view-source is server-rendered (not just a client spinner); Lighthouse TTFB improves.

### 5.6 Centralize nav config in `lib/navigation.ts`

Add `portalNavSections` export (mirror the structure currently hardcoded in `components/design-system/Sidebar.tsx:30-91` + `BottomNav.tsx:10-15`). Both `Sidebar` and `BottomNav` import from `lib/navigation.ts` — single source of truth. Delete the hardcoded arrays in the components.

**Verify:** sidebar + bottom nav render identical items/links.

### 5.7 Add root `app/not-found.tsx`

Branded Arabic 404 for non-grouped routes (`/`, `/foobar`). Server component. **Verify:** hit `/foobar` → branded 404 (not Next default).

### 5.8 Resolve `invoices` segment asymmetry

Decision: keep `/portal/finance` as the list and move invoice detail under `/portal/finance/[id]` (rename `invoices/[id]/page.tsx` → `finance/[id]/page.tsx`). Add a redirect from `/portal/invoices/[id]` → `/portal/finance/[id]` for old links. Delete `invoices/page.tsx` redirect stub (replaced by the finance list). Update `PORTAL_ROUTES.invoiceDetail` (already set in 1.1).

**Verify:** `/portal/finance/abc` renders invoice detail; `/portal/invoices/abc` redirects; `/portal/invoices` redirects to `/portal/finance`.

### 5.9 Delete dead shadcn scaffolding (portal scope)

`components/app-sidebar.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `team-switcher.tsx` — verify 0 portal importers (grep), then delete. `nav-user.tsx` may be dashboard-only — leave it. **Verify:** build green.

### 5.10 (Optional) Intercepting routes for modals

- `deliverables/[id]` → replace the redirect-resolver with `deliverables/@modal/[id]/page.tsx` (intercepting) rendering `ReviewModal` over the list. Preserves URL + back-button. Lower priority — only if the current `?focus=` flow is causing UX complaints.
- `finance/@modal/[id]/pay` → payment sheet as intercepting route. Optional.

**Phase 5 exit criteria:** build green; server-rendered HTML visible in view-source for converted pages; tab titles correct; per-route skeletons; non-client users redirect cleanly; all old URLs redirect to new ones.

---

## Cross-cutting verification checklist (run after each phase)

```bash
# Build
npx turbo run build --filter=shared --filter=api --filter=web

# Typecheck (if a tsc --noEmit script exists; else build is the check)
npx turbo run build --filter=web

# Lint (if configured)
npx turbo run lint --filter=web

# Grep guards (should be near-zero in portal scope after Phase 3)
rg "text-\[#|bg-\[#|border-\[1\.5px\]|bg-white\b" apps/web/app/\(portal\) apps/web/components/portal
rg "catch \(err: any\)|catch \(error: any\)|as any" apps/web/app/\(portal\) apps/web/components/portal
rg "pollingInterval: 120_000|pollingInterval: 60_000|pollingInterval: 30_000" apps/web/app/\(portal\)  # should be 0 — all use PORTAL_POLLING_INTERVAL_MS
rg "\"ar-SA\"[^-]" apps/web/app/\(portal\)  # should be 0 — all use AR_LOCALE
rg "useParams\(\)" apps/web/app/\(portal\)  # should be 0 — all use Promise+use()
rg "from \"@/features/proposals/proposalsApi\"|from \"@/features/contracts/contractsApi\"|from \"@/features/clients/clientsApi\"" apps/web/app/\(portal\)  # should be 0
```

**Manual smoke (after each phase):**

1. Login as `client@hassad.com` → portal home renders.
2. Navigate every portal route → renders, no console errors.
3. Open a contract detail → sign → refreshes without page reload.
4. Open finance → pay an invoice → summary + list refresh.
5. Open deliverables → approve → queue refreshes (no manual refetch).
6. Open notifications → mark all read → unread count updates.
7. Open chat in two tabs → message syncs.
8. Expire session (delete `token` cookie in devtools) → trigger any action → refresh + retry, not silent fail.
9. Upload avatar → reload → persists.
10. Hit `/foobar` → branded 404. Hit `/portal/xyz` → branded portal 404.

---

## Sequencing summary

| Phase | Focus                                                                        | Risk    | Backend?                      | Est. files touched     |
| ----- | ---------------------------------------------------------------------------- | ------- | ----------------------------- | ---------------------- |
| 0     | Dead code cleanup                                                            | Lowest  | No                            | ~15                    |
| 1     | Shared foundations (constants, formatters, error handler, enums, cache tags) | Low–Med | Yes (4.4, 4.5, 4.6 endpoints) | ~30                    |
| 2     | Shared components (drop-in replacements)                                     | Med     | No                            | ~25                    |
| 3     | Token system hardening                                                       | Low     | No                            | ~40 (class-name swaps) |
| 4     | Data layer correctness (cache, pagination, sockets, avatar)                  | High    | Yes                           | ~20 web + ~8 api       |
| 5     | Architecture (server/client split, layouts, metadata, routing)               | Highest | No                            | ~30                    |

**Total:** ~165 file touches across 6 phases. Each phase independently shippable. Pause + review between phases.

---

## Open questions to resolve before execution

1. **Action-item types enum**: does `@hassad/shared` have `ActionItemType`? (Verify; if not, add — used by both frontend config maps + likely the NestJS DTO.)
2. **`ServiceItem.price`**: does the shared `ServiceItem` type include `price`? (If not, extend it — fixes the `proposals/[token]` cast.)
3. **Avatar upload endpoint**: does one already exist in `apps/api/src/modules/users`? (grep `avatar` in users module.)
4. **`getClientStrategies` return shape**: what does `PortalService.getClientStrategies` actually return? (Read the service to define the correct `PortalStrategySummary` type.)
5. **`/portal/contracts/:token/sign` vs `/contracts/share/:token/sign`**: is the token endpoint intentionally shared, or should a portal-aliased route exist? (Decision affects 4.3.)
6. **`ProfileSections/types.ts`**: should it import from `@hassad/shared` `IntakeFormV2Input` instead of redeclaring? (Verify shared exports the shape; if yes, delete the local redeclaration — removes a drift source.)

Resolve these in Phase 1's first commit (read + verify), then proceed.
