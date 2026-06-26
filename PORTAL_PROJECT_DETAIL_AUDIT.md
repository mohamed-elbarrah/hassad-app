# 📋 Full Architectural & Code Review Report
## Page: `/portal/projects/[id]` and Related Sub-Flows

I traced the page end-to-end (component → RTK Query → API controller → service → Prisma → storage) plus all nested pages, dialogs, auth, and design-system primitives. Below is a single-source-of-truth report of every silent failure surface I found, ordered by severity.

---

## 🔴 CRITICAL — Will bite you in production

### 1. Silent error swallowing on the page (no `isError` handling)
**File:** `apps/web/app/(portal)/portal/projects/[id]/page.tsx`

The page only checks `isLoading` and `data?.length === 0`. There is **no `isError` branch** for `getPortalProjectDetail` or `getPortalProjectPeriods`. Consequences:

- Backend returns **404** (project not found / not owned by current client) → `data` is `undefined`, `isError` is `true` → page renders the skeleton one moment then renders the **"لا توجد فترات بعد / No periods yet"** empty state with no error indication. The user thinks "this project simply has no periods" — which is the **worst possible UX** because the real reason (project doesn't belong to them, or admin deleted it) is hidden.
- Backend returns **500** (DB failure, bad UUID format hitting Prisma `findUnique`) → same silent empty state.

No toast, no error boundary, no retry button, no 404 page. The `error.tsx` exists at `(portal)/error.tsx` but is **never triggered** because RTK Query failures don't bubble to React error boundaries.

**Fix direction:** Distinguish "loading" / "loaded-empty" / "error" / "forbidden" / "not-found". Render a proper error UI with a retry CTA.

---

### 2. Stale `selectedPeriodId` after client-side navigation between projects
**File:** `apps/web/app/(portal)/portal/projects/[id]/page.tsx` (lines 82-87)

```ts
const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
useEffect(() => {
  if (periods && periods.length > 0 && !selectedPeriodId) {
    setSelectedPeriodId(pickInitialPeriod(periods));
  }
}, [periods, selectedPeriodId]);
```

When the user navigates from `/portal/projects/A` → `/portal/projects/B` via the App Router, Next.js **reuses the same component instance** (same dynamic route, same file). The component-level `useState` persists:

1. `projectId` changes → RTK Query refetches periods for project B
2. `selectedPeriodId` is still project A's period ID
3. `periods.find(p => p.id === selectedPeriodId)` → `undefined`
4. `selectedPeriod = null`
5. `useEffect` does NOT fire (the guard `!selectedPeriodId` is false)
6. **Result: only the project header renders. No HeroCard, no timeline, no tabs. The user thinks the page is broken.**

Confirmed by reading every render branch: there is no fallback when `selectedPeriod === null` after periods have loaded.

**Fix direction:** Reset `selectedPeriodId` when `projectId` changes (e.g. `useEffect(() => setSelectedPeriodId(null), [projectId])` — but be careful about the double-effect with the auto-select).

---

### 3. Authorization does NOT validate project ownership for file / report downloads
**Files:**
- `apps/api/src/modules/portal/controllers/portal.controller.ts` lines 708, 719
- `apps/api/src/modules/portal/services/portal.service.ts` lines 623, 639

```ts
async downloadPeriodReport(@Param("periodId") periodId, @CurrentUser() user) {
  return this.portalService.getPeriodReportDownloadUrl(clientId, periodId);
}

async getPeriodReportDownloadUrl(clientId, periodId) {
  const period = await prisma.projectPeriod.findUnique({
    where: { id: periodId },
    select: { reportFilePath: true, project: { select: { clientId: true } } },
  });
  if (!period || period.project.clientId !== clientId || !period.reportFilePath) {
    throw new NotFoundException("Report not available");
  }
  ...
}
```

The `:id` URL parameter (`/portal/projects/:id/periods/:periodId/...`) is **never validated** against the period's actual projectId. Any client can hit `/portal/projects/{anything}/periods/{anyPeriodIdFromTheirOwnProjects}/report/download` — and authorization is identical to using the real projectId. This is the **classic IDOR surface** — the URL parameter is decorative.

It works today only because the frontend hardcodes `_` (see issue #4). Any future endpoint that does check `:id` against the period's project will diverge.

**Fix direction:** Validate `period.project.id === :id` server-side; better, drop the `:id` from the URL entirely.

---

### 4. Frontend/backend URL mismatch hardcoded `_` (works by accident)
**File:** `apps/web/features/portal/portalApi.ts` lines 757-766

```ts
downloadPeriodReport: builder.query<DownloadUrlResponse, string>({
  query: (periodId) => `/portal/projects/_/periods/${periodId}/report/download`,
}),
downloadPeriodFile: builder.query<DownloadUrlResponse, ...>({
  query: ({ periodId, fileId }) =>
    `/portal/projects/_/periods/${periodId}/files/${fileId}/download`,
}),
```

The controller accepts `:id` so `_` is technically a valid value. But this is **misleading code** — anyone reading the frontend will assume the backend ignores the projectId segment (correct) or that there's a special "wildcard" route (incorrect). This is fragile and undocumented.

**Fix direction:** Either remove `:id` from the backend route, or pass `projectId` from the page.

---

### 5. Time zone bug: dates displayed in wrong day for KSA users
**File:** `apps/web/components/portal/project-detail/helpers.ts`

```ts
new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", { ... })
```

The backend stores `DateTime` (not `Date`) at `00:00:00.000Z` UTC. When KSA users (UTC+3) view this in `ar-SA` locale:
- `2026-06-26T00:00:00.000Z` (midnight UTC) = `2026-06-26T03:00:00+03:00` → displays "26 يونيو" ✅
- `2026-06-26T22:00:00.000Z` (PM typed 23:00 local) = `2026-06-27T01:00:00+03:00` → displays "27 يونيو" ❌

This is silent because the displayed value still **looks** like a valid date, just shifted by one day. Period start/end dates, file upload dates, meeting dates — all affected.

**Fix direction:** Server should normalize all `Date`-typed fields to midnight UTC, OR frontend should slice the YYYY-MM-DD and format without timezone conversion.

---

### 6. Next.js Edge proxy falls back to cookie-existence auth if `JWT_SECRET` is missing
**File:** `apps/web/proxy.ts` lines 13-32

```ts
const isAuthenticated = JWT_SECRET_RAW ? !!payload : !!token;
```

If `JWT_SECRET` is not configured in production (e.g. ops team set up the API env but forgot the web env, or used a different name), the proxy accepts **any request with a cookie named `token`** — even with garbage value. The role-based redirect (admin → dashboard, client → portal) **also silently disables**.

The API still validates JWT (defense-in-depth), so data is safe. But:
- Anyone can hit `/portal/anything` and the page renders the loading spinner → then the client-side layout check redirects to `/login` after a flash.
- Bypasses all role-based edge routing.

**Fix direction:** Refuse to start the proxy if `JWT_SECRET` is missing in production (`NODE_ENV === "production"`). Throw at module load.

---

## 🟠 HIGH — Will produce visible bugs under normal traffic

### 7. Silent NaN rendering if `completionPercentage` is ever null/undefined
**Files:** `CircularProgress.tsx`, `ProgressBar.tsx`, `StatCards.tsx`

```ts
const clampedValue = Math.min(100, Math.max(0, value)); // value=undefined → NaN
```

The schema marks `completionPercentage: Float @default(0)` — default is 0, so usually safe. But if a migration ever allows null, or if a JSON merge leaves it undefined, the UI silently renders **"NaN%"** with a broken SVG circle (`strokeDashoffset=NaN`).

**Fix direction:** Default the prop to `0` at every consumer: `value={period.completionPercentage ?? 0}`.

---

### 8. Campaign tab shows ALL client campaigns regardless of selected period/project
**File:** `apps/web/components/portal/project-detail/CampaignsTab.tsx`

```ts
const { data: campaigns, isLoading } = useGetPortalCampaignsQuery();
```

Comment in the file says "period filtering deferred". A client looking at Period 1 sees campaigns from Period 3. UX confusion. Also: if a client has 50 campaigns, this fires for every period selection (cached, but data transfer on first visit).

**Fix direction:** Filter by `campaign.projectId === projectId` or add a `?projectId=` query param to `getPortalCampaigns`.

---

### 9. Inconsistent error responses for unauthorized access
**File:** `apps/api/src/modules/portal/services/portal.service.ts`

| Endpoint | Unauthorized response |
|---|---|
| `getPortalProjectDetail` | **404** NotFoundException |
| `getPortalProjectPeriods` | **`[]`** silent empty array |
| `downloadPeriodReport` | **404** NotFoundException |
| `downloadPeriodFile` | **404** NotFoundException |

A client trying to access another client's project detail gets a clear 404, but trying to access periods of that project gets `[]` (looks like "no periods yet"). This leaks the difference between "not found" and "empty" and lets attackers probe.

**Fix direction:** Standardize on 403/404 with same response shape.

---

### 10. Dispute dialog form state lost on outside click
**File:** `apps/web/components/disputes/NewDisputeDialog.tsx`

The dialog uses the basic `components/ui/dialog` wrapper which has **no `onInteractOutside` blocker**. While typing a 20+ char description, accidentally clicking outside resets all state. Also no warning on Escape key.

**Fix direction:** Block `onInteractOutside` and `onEscapeKeyDown` while `isLoading` (or always for forms with required content).

---

### 11. No UUID validation on path parameters
**File:** `apps/api/src/modules/portal/controllers/portal.controller.ts`

No `@Param("id", ParseUUIDPipe)` on any endpoint. Hitting `/portal/projects/not-a-uuid` sends `not-a-uuid` to Prisma which throws on `findUnique({where:{id:"not-a-uuid"}})` → 500 → silently swallowed by frontend (issue #1).

**Fix direction:** Add `ParseUUIDPipe` to every `:id` and `:periodId` and `:fileId` parameter.

---

## 🟡 MEDIUM — Will produce confusing behavior, not crashes

### 12. The `useEffect` dependency on `selectedPeriodId` causes unnecessary re-fires
**File:** `apps/web/app/(portal)/portal/projects/[id]/page.tsx` line 86

```ts
useEffect(() => {
  if (periods && periods.length > 0 && !selectedPeriodId) {
    setSelectedPeriodId(pickInitialPeriod(periods));
  }
}, [periods, selectedPeriodId]); // re-fires every time user picks a period
```

Cosmetic — the `!selectedPeriodId` guard prevents infinite loops, but the effect re-evaluates on every period click. Split into two effects.

---

### 13. The `useGetPortalProjectDetailQuery` and `useGetPortalProjectPeriodsQuery` provide the same tag shape as the parent list
**File:** `apps/web/features/portal/portalApi.ts` lines 744, 749

Both provide `[{ type: "PortalProjects", id }]` — the **same** keyed tag as `useGetPortalProjectsQuery`. Mutations like `approveProject` that invalidate `["PortalProjects"]` correctly trigger refetch of all three (list + detail + periods). But if a future mutation only invalidates the bare `["PortalProjects"]` without id and someone refactors to use a different tag, this will silently break consistency.

Document the tag relationship explicitly.

---

### 14. `getPortalContractById` is typed as `any`
**File:** `apps/web/features/portal/portalApi.ts` line 625

```ts
getPortalContractById: builder.query<any, string>({ ... })
```

Not used on this page, but lives in the same `portalApi` module. All callers lose type safety.

**Fix direction:** Define a `PortalContractDetail` interface and use it.

---

### 15. XSS surface in `CurrencySymbol` via `dangerouslySetInnerHTML`
**File:** `apps/web/components/design-system/CurrencySymbol.tsx`

```ts
if (symbolType === "SVG_INLINE" && svgKey) {
  return <span dangerouslySetInnerHTML={{ __html: svgKey }} />
}
```

If an admin uploads a malicious SVG via currency settings, it executes in any page that displays currency. SVG can contain `<script>` and event handlers. Risk is low (admin-only), but defense-in-depth says sanitize server-side (DOMPurify on backend before storage).

---

### 16. XSS surface in meeting link
**File:** `apps/web/components/portal/project-detail/MeetingsTab.tsx`

```ts
<a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
```

No URL validation. A PM could (maliciously or by mistake) set `meetingLink = "javascript:alert(1)"` → executes on click. Also no `rel="noreferrer"`.

**Fix direction:** Validate URL protocol server-side (`https?://` only) and add `noreferrer`.

---

### 17. Silent broken download if R2 key is missing
**File:** `apps/api/src/common/storage/storage.service.ts` line 273

`getSignedUrl` is a pure client-side URL generator — **it never checks if the file exists in R2**. If `reportFilePath` references a deleted key, the user clicks "Download", browser opens the URL, R2 returns 403 XML. No feedback. The frontend's `window.open(url, "_blank")` opens a blank tab with cryptic XML.

**Fix direction:** Add a `headObject` check before signing, OR have the API return a 404 if `headObject` fails.

---

### 18. `MeetingRow.notes` and `Period.summary` displayed with `whitespace-pre-line` — XSS safe but layout-shift risk
**Files:** `MeetingsTab.tsx`, `ReportsTab.tsx`

Long notes without max-height cause the page to scroll-jump when switching tabs. Minor UX issue.

---

### 19. The `formatFileSize` helper doesn't handle negative numbers
**File:** `apps/web/components/portal/project-detail/helpers.ts`

`bytes = -1` → `Math.log(-1) = NaN`, returns "NaN B". Unlikely but defensive default would be safer.

---

### 20. Two different `formatDate` implementations exist
**Files:** `lib/utils.ts` line 8, `components/portal/project-detail/helpers.ts` line 12

Both export `formatDate` with different signatures. Mixing imports causes inconsistency.

---

### 21. `useCurrency` is called inside `CampaignCard` (per-card) — N hook instances
**File:** `apps/web/components/portal/project-detail/CampaignsTab.tsx`

RTK Query dedupes the underlying API call, so this is mostly cosmetic. But each `CampaignCard` calls `useCurrency()` which itself calls `useGetDefaultCurrencyQuery`. With 50 campaigns, that's 50 React hook subscriptions to one query. Move the hook to the parent.

---

## 🟢 LOW — Code-smell, future-proofing

### 22. `PortalPeriodMeeting` includes fields that are never used by the UI
The `MeetingStatus` enum is shown twice — once via the colored icon box and once via `<StatusBadge>`. Redundant.

---

### 23. `useGetPortalProjectPeriodsQuery` and the parent projects page poll differently
**Files:** `projects/page.tsx` (pollingInterval: 120_000), `projects/[id]/page.tsx` (no polling)

The detail page never refreshes. If PM updates goals / marks period as ACTIVE → CLOSED, the client must refresh manually. Inconsistent.

---

### 24. `next.config.ts` has no `images.remotePatterns`
**File:** `apps/web/next.config.ts`

Not used on this page (all `<img>` not Next `<Image>`), but if anyone refactors CurrencySymbol to use `<Image>`, R2 URLs won't load.

---

### 25. No `not-found.tsx` for `[id]` route
Missing at `apps/web/app/(portal)/portal/projects/[id]/`. Combined with issue #1, 404 cases show silent empty state instead of a clear "project not found" page.

---

### 26. Empty `<div>` between `ProjectHeader` and `HeroCard`
**File:** `page.tsx` line 142

There's a stray empty `<div>` (looking at the structure — confirmed in the source):

```tsx
<div className="flex items-center gap-3">
  <ActionButton ...>
  </ActionButton>
  
</div>
```

The trailing empty `<div>` from `ProjectHeader.tsx` is a leftover from removed action buttons. Visual no-op but reveals incomplete refactoring.

---

### 27. `StatCards` icon swap logic is fragile
**File:** `StatCards.tsx` line 62

```ts
icon={nextMeeting ? Calendar : Clock}
```

Two different icon types for the same card slot. If design wants consistency, lock to one.

---

### 28. The `TABS` array uses `LucideIcon` as type but is duplicated in two places
Only used once on this page — fine. But if a sibling page (e.g. project review detail) needs the same tabs, will be duplicated.

---

## ✅ What's solid (no action needed)

- **Auth on the API side** (`JwtAuthGuard` + `PermissionsGuard` + per-resource ownership checks) is consistent.
- **API response envelope unwrapping** is centralized in `baseQuery.ts` — single source of truth.
- **Edge proxy** has clean fallback semantics — only issue is silent degradation (issue #6).
- **State machines** for periods (UPCOMING/ACTIVE/CLOSED/SUSPENDED) are handled in the UI cleanly.
- **TypeScript interfaces** in `portalApi.ts` are mostly well-defined (exception: `any` for `getPortalContractById`).
- **Polling** on the projects list keeps it fresh.
- **Empty states** for every tab are intentional and well-written.
- **Design system primitives** (`SurfaceCard`, `StatusBadge`, `Tabs`, etc.) are consistent and accessible.
- **Dispute dialog** correctly skips the project selector when called from a specific project.

---

## 🎯 Priority fix order

1. **Issue #1** (no error handling) — user-facing silent failure
2. **Issue #2** (stale selectedPeriodId on navigation) — user-facing silent failure
3. **Issue #3** (no projectId validation on downloads) — security defense-in-depth
4. **Issue #4** (URL `_` hardcode) — clarity, prevents future refactor regressions
5. **Issue #5** (time zone bug) — visible to all KSA users
6. **Issue #6** (Edge proxy JWT_SECRET fallback) — production hardening
7. **Issue #7** (NaN rendering) — defensive
8. **Issues #8-11** — UX and hardening
9. **Issues #12-21** — code health

---

*Audit generated without modifying any code. Read-only review.*