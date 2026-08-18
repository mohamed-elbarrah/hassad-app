# Purpose

This repository is a large monorepo containing multiple dashboards:

- Admin
- Sales / CRM
- PM
- Team
- Marketing
- Finance
- portal / client

Work is performed incrementally, portal by portal and page by page.
The goal is to improve the existing system without introducing new inconsistencies. Do not perform broad unrelated refactors or rewrite the system unnecessarily.

When modifying existing code, always check whether the part being modified follows the rules below. **This check is mandatory, not optional** — see Section 0 for exactly what "the part being modified" means, and Section 16 for how it must be reported.

---

# Important

Please don't use e2e test!! our app not stable yet. just review your changes to make sure everything ok and clean.
In UI/UX and endpoints/API, detect any bad practices, architecture issues, or anti-patterns and replace them with the best available option instead of the bad one.
You can use subagents when it can help and accelerate the process, acting as orchestrator. Section 16 describes a specific subagent role (compliance auditor) that should be used on every non-trivial task.

---

# 0. Scope of Enforcement ("the touched area")

Everything in this document applies within the **touched scope** of a task. The touched scope is:

- Every file directly edited to complete the task.
- Every file those edited files directly call or import to do their job for this feature — e.g. the API route handler a page calls, the hooks/services a component uses, the shared components it renders, the domain/application logic an endpoint invokes.

The touched scope is **not**:

- The entire portal.
- Unrelated pages or endpoints that happen to live nearby.
- Files that only coincidentally share a folder with what you're editing.

**Inside the touched scope, compliance with every rule in this document is mandatory — regardless of whether the violation is related to the feature or bug being worked on.** This applies equally when:

- adding a new feature,
- fixing a bug,
- refactoring,
- or doing anything else that causes you to open and read one of these files.

"I wasn't asked to fix this" is not a valid reason to leave a detected violation unaddressed. See Section 11 for the only valid reason to defer a fix, and Section 16 for how deferrals must be reported — deferring silently is never acceptable.

---

# 1. Portal and API Ownership

Each portal owns its own frontend pages and API endpoints.

Examples:

```text
/api/admin/*
/api/crm/*
/api/pm/*
/api/team/*
/api/marketing/*
/api/finance/*
```

A portal must not use an API endpoint owned by another portal simply because that endpoint already exists.

For example:

```text
❌ CRM page → /api/admin/customers
```

If CRM needs the same capability, create an appropriate CRM-owned endpoint:

```text
✅ CRM page → /api/crm/customers
```

The new endpoint should reuse the existing domain/application/service logic where appropriate.
Do not duplicate business logic just to create a portal-specific endpoint.
The goal is to separate **API ownership**, not to duplicate the underlying business domain.

When modifying a page or endpoint, check whether it depends on another portal's API. If it does, and it falls in the touched scope (Section 0), correct the ownership.

---

# 2. API Contract

All API endpoints must follow one consistent response contract so that any API consumer can consume the API predictably.

## Success

Use the standard success structure:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` may be omitted when it is not needed.

## Error

Use the standard error structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Do not introduce alternative response formats such as:

```json
{ "message": "..." }
```

or:

```json
{ "error": "..." }
```

for standardized API errors.

HTTP status codes and application/business error codes are separate concerns. Use the appropriate HTTP status together with a stable application error code.

## Validation

Validation errors must use the same error contract and provide structured details when field-level errors are required.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": {
        "email": { "code": "INVALID_EMAIL" },
        "name": { "code": "REQUIRED" }
      }
    }
  }
}
```

The exact error codes used by the project must remain consistent.

### Existing endpoints

When modifying an existing endpoint (i.e. it's in the touched scope), inspect its current response format.
If it violates this contract, **fix the endpoint as part of the work**. Do not preserve an inconsistent response merely because it is old.

---

# 3. Backend Messages and Localization

The backend must not be responsible for writing user-facing messages or choosing their language.

Do not return or hard-code messages such as:

```text
"المستخدم غير موجود"
"User not found"
"تم الحفظ بنجاح"
"حدث خطأ"
```

The backend must return machine-readable codes and structured data:

```text
USER_NOT_FOUND
USER_CREATED
PERMISSION_DENIED
VALIDATION_ERROR
```

The frontend is responsible for converting these codes into user-facing messages through the project's localization system.

Therefore:

```text
Backend
→ business meaning
→ error/success code
→ structured data

Frontend
→ translation
→ presentation
→ user-facing message
```

The backend must not contain Arabic, English, or other human-language versions of system messages.

When modifying an endpoint that currently returns human-readable messages (touched scope), change it to the standardized contract.

---

# 4. Frontend API Handling

The frontend must consume the standardized API contract.
Do not depend on the text of a backend message.

For example:

```text
CUSTOMER_NOT_FOUND
```

must be handled through the frontend's localization/presentation layer.

Do not create page-specific error handling or message formats when the existing centralized mechanism can handle them.

The frontend is responsible for:

- translating API codes
- displaying messages
- displaying validation errors
- displaying success/error feedback

The frontend must not recreate business logic that belongs to the backend.
If the frontend needs information to make a correct presentation decision, the backend/API must provide that information instead of requiring the frontend to infer or duplicate business rules.

---

# 5. Frontend UI: Reuse First

Before creating any UI component, follow this order:

```text
1. Existing shared project component?
        ↓
      Reuse it
2. No existing component?
        ↓
   Check shadcn using shadcn MCP
3. shadcn provides the component?
        ↓
   Install/use it
4. shadcn does not provide it?
        ↓
   Create a custom component only when necessary
```

Use the `shadcn MCP` when working with shadcn components.
Do not create a custom implementation when an appropriate existing project component or shadcn component already exists.
Do not use raw HTML as a replacement for an available shadcn component.
A custom component should be rare and should be created only when there is a genuine requirement that is not covered by the existing project components or shadcn.

---

# 6. Shared Project Components

shadcn provides the base UI primitives. The project also has higher-level components that are shared across portals.

Examples include:

```text
KpiCard
Kanban
Charts
DataTable
StatusBadge
DateDisplay
CurrencyDisplay
NumberDisplay
PercentageDisplay
EmptyState
LoadingState
ErrorState
```

These concepts must be implemented once and reused where applicable.

Do not create separate copies such as:

```text
AdminKpiCard
CrmKpiCard
FinanceKpiCard
```

when they represent the same reusable concept.

Instead:

```text
Shared KpiCard
    ├── Admin
    ├── CRM
    └── Finance
```

If a newly created custom component is generally reusable across portals, place it in the appropriate shared UI area rather than inside a single page.
Before creating a component inside a portal, always ask whether it is actually a shared project component.

---

# 7. Styling and Design System

Do not introduce unnecessary inline styles or hard-coded visual values.

Avoid patterns such as:

```tsx
style={{ color: "#2563eb" }}
```

or arbitrary repeated values such as:

```text
#2563eb
#22c55e
17px
23px
```

Use the project's established:

- shadcn components
- Tailwind
- design tokens
- shared components
- semantic variants

Do not create page-specific styling systems.

## Semantic states

UI states with semantic meaning must use the project's shared semantic variants.

Examples:

```text
success
warning
destructive
info
muted
```

Do not choose arbitrary colors independently in each page.

For example, prefer:

```tsx
<Badge variant="success" />
<Badge variant="warning" />
<Badge variant="destructive" />
```

over choosing a different color directly inside every page.

If the required shared variant does not exist, update the appropriate shared component/system rather than creating an isolated page-specific solution.

---

# 8. Common Formatting

Common formatting must be reused rather than implemented repeatedly in individual pages.

This includes:

- dates
- times
- currencies
- numbers
- percentages
- other common display formats

Use the existing shared utilities or components.
Do not independently implement date or currency formatting inside each portal.
If a common formatter or display component does not exist and the requirement is genuinely shared, create it in the shared layer so it can be reused by all applicable portals.

---

# 9. Next.js

When working with Next.js, use the project's `Next.js MCP` to verify the appropriate APIs, patterns, and implementation.
Follow the Next.js version and conventions used by the project.
Do not rely on outdated patterns or invent an implementation when the MCP can verify the correct approach.

---

# 10. Required Workflow When Modifying Code

When starting work on a page, endpoint, component, or related feature:

### 1. Inspect

Understand the existing implementation and its dependencies. Check `docs/violations-backlog.md` for any open entries covering the files you're about to touch — if one exists, it's part of this task's touched scope (Section 0).

### 2. Check ownership

Verify that the page uses the correct portal-owned API.

### 3. Check the API contract

Verify success, error, and validation responses.

### 4. Check localization

Verify that backend messages are not being used as user-facing text and that frontend messages use the project's localization mechanism.

### 5. Check UI reuse

Look for existing shared components first, then use shadcn through the shadcn MCP when appropriate.

### 6. Check styling

Look for inline styles, hard-coded colors/sizes, and page-specific styling that should use the shared design system.

### 7. Check common functionality

Look for duplicated KPI cards, Kanban boards, charts, formatting, status components, and other reusable functionality.

### 8. Fix violations — mandatory

Every violation detected anywhere in the touched scope (Section 0) must be fixed, across all applicable layers (Section 15), **whether or not it relates to the requested change.**
The only exception is a violation that qualifies as a large migration under Section 11 — and even then it must be logged, never silently skipped (Section 16).

### 9. Implement the requested change

Do not introduce new patterns that contradict these rules.

### 10. Validate and report

Verify that the implementation still follows the API, UI, localization, ownership, and reuse rules, then produce the Compliance Check report described in Section 16. A task is not finished until this report exists.

---

# 11. Handling Existing Violations

Existing code is not automatically a valid pattern to follow.

If a violation is found anywhere in the touched scope (Section 0):

- **Fix it immediately** when the change is small and safe. This is the default — most violations fall here.
- **Refactor it** when the violation is in a file you are already editing or that directly feeds the current task, even if the violation itself isn't what you were asked to change.
- **Defer it only** when the correction requires a large migration — meaning it spans many files or portals, or changes a shared contract that many other consumers depend on in ways that go beyond what you can safely verify in this task. Deferring still requires writing a short entry in the Compliance Check report **and** appending it to the persistent violations backlog (Section 16): what the violation is, where it is, and why it wasn't fixed now.

Do not perform unrelated large-scale refactoring beyond the touched scope.

Most importantly:

> Do not introduce new code that violates an established rule simply because similar violations already exist elsewhere.
> The existence of the same violation elsewhere in the codebase is never a reason to skip fixing it in the touched scope.

---

# 12. Architectural Decision During Work

When an existing implementation conflicts with these rules, prefer correcting the structure rather than creating another workaround.

For example:

```text
❌ CRM
   ↓
Admin API
```

should move toward:

```text
CRM
   ↓
CRM API
   ↓
Shared domain/application logic
```

Similarly:

```text
❌ Backend
   ↓
"المستخدم غير موجود"
```

should move toward:

```text
Backend
   ↓
USER_NOT_FOUND
   ↓
Frontend localization
   ↓
User-facing message
```

And:

```text
❌ Page
   ↓
Custom UI implementation
```

should move toward:

```text
Existing shared component
        ↓
or
shadcn component
        ↓
or, only when necessary,
shared custom component
```

---

# 13. Core Rule

For every change, follow these principles:

```text
Correct portal ownership
        ↓
Standard API contract
        ↓
Backend returns codes/data, not user-facing messages
        ↓
Frontend handles localization and presentation
        ↓
Reuse existing project components
        ↓
Use shadcn through shadcn MCP
        ↓
Use shared components for common concepts
        ↓
Use shared design tokens and semantic variants
        ↓
Avoid unnecessary custom styling
        ↓
Avoid duplicated functionality
```

The objective is not to make the entire existing codebase perfect in one pass.
The objective is:

> **Every area we touch should move toward the established architecture, and no new work should introduce another violation — and nothing detected along the way should be silently left as-is.**

---

# 14. Global Frontend, Backend, API, And UI Rules

These rules apply to all portals, pages, components, and API endpoints.

## Backend API responses

- Every successful endpoint must return `{ success: true, data: {}, meta?: {} }`.
- Every error must return `{ success: false, error: { code, details } }`.
- Backend responses must never contain user-facing Arabic, English, or other human-language messages.
- Backend must return stable machine-readable success/error codes and structured details.
- Validation errors must use `VALIDATION_ERROR` with structured field or issue details.
- HTTP status codes and application error codes are separate concerns; use both correctly.
- Existing endpoints that are touched must be migrated away from legacy `{ message }`, `{ error: "..." }`, or raw payload response formats.

## Frontend API consumption

- Feature code must use the shared frontend transport layer; do not create page-specific `fetch`, `axios`, or `fetchBaseQuery` implementations.
- The transport layer owns base URLs, credentials, JSON handling, envelope validation, success unwrapping, typed errors, refresh/retry behavior, and normalized status handling.
- The success envelope must be unwrapped exactly once. Feature code receives `data`, never the raw `{ success, data }` envelope.
- Frontend code must consume machine-readable API codes and structured data, never backend message text.
- Do not read or display `error.message`, `data.message`, or any legacy backend message field.
- API success/error codes must be translated centrally through the frontend localization/presentation layer.
- Components must not provide per-call language fallbacks for API codes; unknown codes use one centralized localized fallback.
- `401` must represent unauthenticated/expired session handling; `403` must remain a permission-denied state and must not redirect to login.
- Token-based authentication must use the project's secure cookie/session mechanism. Do not store JWTs or session tokens in localStorage, sessionStorage, Redux, or component state.
- Permission and capability decisions must come from backend-provided permission data; do not recreate authorization rules in page components.

## UI and design system

- Reuse an existing shared project component first.
- If no project component exists, check and use the appropriate shadcn component through shadcn tooling before creating custom markup.
- Do not replace available shadcn/project components with raw HTML controls.
- Use semantic shadcn design tokens and variants (`text-foreground`, `text-muted-foreground`, `bg-primary`, `border-input`, `destructive`, etc.).
- Do not use undefined legacy color classes, arbitrary hard-coded colors, or page-specific styling systems.
- Do not duplicate common components, layouts, forms, status displays, formatters, or interaction patterns inside individual portals.
- Use shared icon components with accessible labels; avoid inline SVG when an existing icon component is available.
- Navigation actions must be semantic links. Buttons are for actions such as submit, toggle, delete, open, or execute.
- Form controls must have associated labels, stable IDs, keyboard support, and accessible validation state.
- Use `gap-*` and shared layout components instead of `space-y-*`, duplicate wrapper markup, or nested page-specific layout systems.

## Frontend architecture

- Shared route layouts should own common shell, branding, navigation, and page structure.
- Pages should contain page-specific content, not duplicate global layout/header/branding markup.
- Client components must be used only where state, effects, event handlers, or browser APIs are required.
- Do not move secrets, tokens, or server-only data into client bundles.

## Verification

- Do not run E2E tests by default in this repository because the application is not stable enough for them; run them only when explicitly requested.
- Use targeted TypeScript checks, lint, formatting, diff review, and focused static contract checks.
- Report unrelated existing verification failures separately instead of changing unrelated code.

---

# 15. Layer Coverage Matrix

For every file in the touched scope (Section 0), check compliance across every layer below — not only the layer relevant to the feature being built. A frontend-only feature can still surface a backend contract violation in the endpoint it calls; a backend-only fix can still surface a frontend layer that's reading `error.message` instead of an error code.

## Frontend

| Layer            | Checks                                                                                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture** | Correct portal ownership (Section 1); uses shared transport layer, not page-local fetch/axios; correct client vs. server component boundary; no secrets/tokens in client bundle; shared route layout used instead of duplicated shell/header markup.                                                    |
| **Logic**        | Consumes API via codes/structured data, not message text; envelope unwrapped once; 401 vs 403 handled correctly; permissions come from backend data, not recreated client-side; no duplicated business logic.                                                                                           |
| **UI**           | Shared component reused before shadcn, shadcn reused before custom; no raw HTML replacing an available component; semantic design tokens/variants used, no hard-coded colors/sizes; shared formatters used for dates/currency/numbers; accessible labels, keyboard support, semantic links vs. buttons. |

## Backend

| Layer            | Checks                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture** | Endpoint lives under the correct portal-owned route; no cross-portal endpoint reuse; domain/application/service logic reused rather than duplicated.                                                                                        |
| **Logic**        | Response follows the standard success/error contract; no hard-coded user-facing language; stable machine-readable codes; validation errors use `VALIDATION_ERROR` with structured details; HTTP status and app error code are both correct. |

---

# 16. Mandatory Compliance Reporting & Orchestration

## Compliance Check report

Every task that touches code ends with a short report, even when nothing was found:

```text
Compliance Check
- Fixed: <violation, file, one-line description> (repeat as needed, or "none")
- Deferred: <violation, file, reason it needed a larger migration, suggested follow-up> (or "none")
- Verified clean: <layers/files checked with no issues found>
```

This report must never be silently omitted. If the answer is "nothing found," say that explicitly rather than leaving the report out.

## Persistent violations backlog

The Compliance Check report only lives in the current conversation — that's not enough for a monorepo worked on incrementally across many sessions. Every "Deferred" item must also be appended to a backlog file at `docs/violations-backlog.md` (create it if it doesn't exist yet), so deferred work survives past the current chat instead of disappearing when it ends.

Format — one row per entry:

```text
| Date       | Portal  | File                         | Layer          | Violation                          | Reason Deferred                                     | Status |
|------------|---------|------------------------------|----------------|-------------------------------------|------------------------------------------------------|--------|
| 2026-08-18 | finance | src/app/finance/invoices/... | Backend/Logic  | Legacy `{ message }` error format   | Shared by 12 consumers; needs coordinated migration  | Open   |
```

Rules for the backlog:

- Before starting work on a file (Section 10, step 1), check this file for open entries covering the files you're about to touch. If one exists, treat it as part of this task's touched scope and attempt to resolve it rather than deferring it again for the same reason.
- When a backlog entry gets fixed, don't delete the row — update its Status to `Resolved` and add the date. That keeps a visible record of what's been cleaned up over time, which matters for tracking progress across an incremental migration.
- Only add an entry when a violation is genuinely deferred under Section 11's large-migration case. Don't use the backlog as a substitute for fixing something that was actually small and safe — that's just deferring by a different name.
- A growing backlog is a signal of real technical debt, not a reason to stop logging entries. It should stay visible, not get swept under a report that vanishes at the end of the session.

## Subagent auditor pattern

For any non-trivial task, after implementing the requested change, spawn a subagent whose only job is to re-read the touched files against Sections 0–15 and flag anything the implementation pass missed or rationalized away. The orchestrator folds the auditor's findings into the Compliance Check report before treating the task as complete. Use this especially when the change spans both frontend and backend, since it's easy for a single pass to focus on one side and skim the other.

A task is not done until the Compliance Check report has been produced.
