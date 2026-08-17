## Purpose

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

When modifying existing code, always check whether the part being modified follows the rules below. If it does not, fix it when the correction is reasonably within the scope of the current work.

Please don't use e2e test!! our app not stable yet. just review your changes to make sure evrything ok and clean..

you can use subagent when thats it can be helpfull and Axelarate the processes and you work as orchestrator..

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

When modifying a page or endpoint, check whether it depends on another portal's API. If it does, correct the ownership when reasonably within scope.

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
{
  "message": "..."
}
```

or:

```json
{
  "error": "..."
}
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
        "email": {
          "code": "INVALID_EMAIL"
        },
        "name": {
          "code": "REQUIRED"
        }
      }
    }
  }
}
```

The exact error codes used by the project must remain consistent.

### Existing endpoints

When modifying an existing endpoint, inspect its current response format.

If it violates this contract, **fix the endpoint as part of the work** when reasonably within scope. Do not preserve an inconsistent response merely because it is old.

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

When modifying an endpoint that currently returns human-readable messages, change it to the standardized contract.

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

Understand the existing implementation and its dependencies.

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

### 8. Fix violations

If the code being modified violates these rules, fix the relevant violation when reasonably within scope.

### 9. Implement the requested change

Do not introduce new patterns that contradict these rules.

### 10. Validate

Verify that the implementation still follows the API, UI, localization, ownership, and reuse rules.

---

# 11. Handling Existing Violations

Existing code is not automatically a valid pattern to follow.

If a violation is found in code that is being modified:

- Fix it immediately when the change is small and safe.
- Refactor it when the violation directly affects the current task.
- If the correction requires a larger migration, make a clear plan and avoid introducing additional dependency on the incorrect pattern.

Do not perform unrelated large-scale refactoring.

Most importantly:

> Do not introduce new code that violates an established rule simply because similar violations already exist elsewhere.

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

> **Every area we touch should move toward the established architecture, and no new work should introduce another violation.**
