# Backend Production Contract Hardening Plan

Status: Execution plan for backend production readiness before frontend contract work  
Scope: `apps/api`, `packages/shared`, backend-facing contract docs, and verification gates  
Goal: Make the backend safe, deterministic, and contract-driven for a SaaS MVP/production launch.

---

## 1. Why This Plan Exists

The backend already has important foundations:

- NestJS global `/v1` prefix.
- Global API response envelope.
- Global exception filter.
- `ApiException` with stable `error.code` support.
- Notification message key catalog with English fallback and Arabic catalogs.
- Shared locale enum with supported locales.
- Cookie-based auth and refresh-token flow.

But the backend is not yet fully production-contract solid because:

- Many modules still throw generic Nest exceptions.
- Some places throw raw `Error`.
- Some responses return nested `{ success: true }` or raw `{ message: ... }` payloads.
- `packages/shared` mixes stable business enums with Arabic display labels.
- Some validation messages are user-facing strings instead of contract-first codes/details.
- Full backend e2e verification is currently blocked by a seed idempotency issue.

This plan turns the backend into a stable contract that frontend can safely consume without parsing English messages or guessing behavior.

---

## 2. Production Goals

After this plan is complete, the backend must provide:

1. Stable API error codes for business behavior.
2. English fallback messages only; frontend must not depend on message text.
3. Deterministic locale behavior.
4. Consistent API envelope.
5. No accidental raw business errors as `INTERNAL_ERROR`.
6. Notification localization through typed message keys.
7. Shared package as stable business truth, not mixed UI copy.
8. Testable and documented frontend/backend contracts.
9. Full API e2e suite passing.
10. A backend ready for frontend V2 integration and production launch.

---

## 3. Non-Negotiable Contracts

### 3.1 API Envelope Contract

All normal JSON API responses are wrapped once by the backend interceptor:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

All failed requests must return:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "English fallback message",
    "details": null
  }
}
```

Rules:

- `error.code` is the contract.
- `error.message` is English fallback/debug copy, not frontend logic.
- `error.details` may contain structured safe metadata.
- Do not include secrets in `details`.
- Do not return nested `{ success: true }` from service/controller methods unless it is deliberately part of a documented resource shape.

### 3.2 Error Code Contract

Use `ApiException` or domain error helpers for business/domain failures.

Required pattern:

```ts
throw new ApiException(
  "TASK_NOT_FOUND",
  "Task not found",
  404,
);
```

Preferred after helper creation:

```ts
throw notFound("TASK_NOT_FOUND", "Task not found");
throw badRequest("TASK_INVALID_STATUS", "Task status is invalid", { status });
throw forbidden("CHAT_MESSAGE_EDIT_FORBIDDEN", "You can only edit your own messages");
throw conflict("USER_EMAIL_ALREADY_EXISTS", "Email is already in use");
```

Rules:

- Codes are uppercase `DOMAIN_REASON` identifiers.
- Codes are stable; changing copy must not change the code.
- New domain codes must be documented in `docs/API_ERROR_CATALOG.md` in the same change.
- Frontend must branch on `error.code`, never `message`.
- Validation errors use `VALIDATION_FAILED` with details.
- Unmigrated HTTP exceptions may temporarily use generic fallback codes, but targeted modules must not keep them.

### 3.3 Localization Contract

Backend-generated user-facing text must be English by default.

Supported locales:

```ts
"en" | "ar"
```

Rules:

- Default locale is `en`.
- Backend accepts locale preference from `x-locale` or `Accept-Language`.
- Unsupported locales fallback to English.
- Backend sets `Content-Language` for HTTP responses.
- Backend notification rendering priority:
  1. Explicit locale passed to notification call.
  2. Request locale.
  3. Company `language` setting.
  4. English fallback.
- Do not translate user-generated content.
- Do not hardcode Arabic literals in API source except dedicated locale catalogs such as `notification-messages.ar.ts`.
- Numeric interpolation in backend-generated text uses Latin digits with no grouping separators.
- Do not use `toLocale*`, `Intl.NumberFormat`, or `Intl.DateTimeFormat` in active API presentation code.

### 3.4 Notification Contract

Notifications must use typed keys and params:

```ts
createLocalizedNotification({
  messageKey: "task.assigned",
  messageParams: { taskTitle, department },
  ...
});
```

or:

```ts
notifyUsersWithMessage({
  messageKey: "chat.new_message",
  messageParams: { sender, content },
  ...
});
```

Rules:

- No raw `createNotification` / `notifyUsers` call sites outside `NotificationsService`.
- Notification templates must keep user content as params.
- Missing Arabic templates may fall back to English, but missing message keys must not compile.
- Notification event types, entity IDs, recipient IDs, and metadata must stay stable.

### 3.5 Shared Package Contract

`packages/shared` must be business-contract truth.

Allowed:

- Stable enums/codes.
- Zod schemas.
- Request/response/shared data types.
- Locale enum.

Forbidden long-term:

- Arabic UI labels embedded in enum objects.
- User-facing copy that belongs to frontend dictionaries.
- Backend notification copy outside notification catalogs.
- Locale-dependent formatting.

Target state:

- Shared exposes codes.
- Frontend maps codes to UI labels.
- Backend maps notification keys to backend-generated notification text only.

### 3.6 Frontend Must Respect This Backend Contract

When frontend work starts:

- Unwrap API envelope exactly once.
- Use `error.code` for behavior.
- Do not parse backend English messages.
- Use stable enum/code fields from API/shared.
- Translate UI in frontend dictionaries.
- Preserve user-generated content as-is.
- Send `Accept-Language` or `x-locale` as preference.
- Do not expect backend to translate general API data labels for UI.
- Do not use shared Arabic enum labels as the V2 translation source.

---

## 4. Current Backend Scan Report

Scan date: current repository state at time of plan creation.

### 4.1 Direct Nest Exceptions

Total direct exceptions found in active API source:

```txt
336
```

By exception type:

```txt
NotFoundException: 245
BadRequestException: 72
ForbiddenException: 12
ConflictException: 5
HttpException: 1
InternalServerErrorException: 1
```

By module:

```txt
admin: 103
marketing: 23
projects: 23
requests: 22
portal: 20
chat: 20
disputes: 18
crm: 17
contracts: 15
pm: 12
settings: 10
finance: 9
tasks: 8
ai: 8
core: 6
proposals: 6
team: 6
auth: 4
ai-assistant: 2
services: 2
notifications: 2
```

Top files:

```txt
20 apps/api/src/modules/requests/requests.service.ts
19 apps/api/src/modules/admin/services/admin-users.service.ts
17 apps/api/src/modules/portal/services/portal.service.ts
16 apps/api/src/modules/chat/services/chat.service.ts
15 apps/api/src/modules/projects/services/project-periods.service.ts
15 apps/api/src/modules/disputes/services/disputes.service.ts
11 apps/api/src/modules/admin/services/admin-contract-migration-review.service.ts
11 apps/api/src/modules/admin/services/admin-projects.service.ts
10 apps/api/src/modules/settings/services/currency-settings.service.ts
9  apps/api/src/modules/finance/services/finance.service.ts
9  apps/api/src/modules/marketing/services/campaigns.service.ts
8  apps/api/src/modules/tasks/services/tasks.service.ts
8  apps/api/src/modules/marketing/services/marketing-strategy.service.ts
7  apps/api/src/modules/contracts/services/contract-payment-plan.service.ts
7  apps/api/src/modules/projects/services/projects.service.ts
7  apps/api/src/modules/admin/services/admin-contracts.service.ts
7  apps/api/src/modules/pm/services/pm-project-actions.service.ts
6  apps/api/src/modules/contracts/services/contracts.service.ts
6  apps/api/src/modules/ai/services/ai-provider.service.ts
6  apps/api/src/modules/admin/services/admin-finance.service.ts
```

### 4.2 Raw `throw new Error(...)`

Found active raw errors in:

```txt
apps/api/src/common/storage/storage.service.ts
apps/api/src/modules/ai/adapters/google.adapter.ts
apps/api/src/modules/ai/adapters/anthropic.adapter.ts
apps/api/src/modules/ai/adapters/openai-compatible.adapter.ts
apps/api/src/modules/projects/controllers/projects.controller.ts
apps/api/src/modules/tasks/controllers/tasks.controller.ts
apps/api/src/modules/ai-assistant/tools/tool-registry.service.ts
apps/api/src/modules/crm/services/client-counter.service.ts
apps/api/src/modules/payments/services/payments.service.ts
apps/api/src/modules/settings/controllers/currency-settings.controller.ts
apps/api/src/modules/disputes/services/disputes.scheduler.ts
apps/api/src/modules/admin/controllers/admin-settings-configuration.controller.ts
apps/api/src/modules/admin/services/admin-system-events.service.ts
```

These must be reviewed. Business/user errors should become `ApiException`. True internal programmer failures may remain internal, but must not expose secrets.

### 4.3 Raw Notification Calls

Scan result:

```txt
No raw createNotification / notifyUsers call sites outside NotificationsService.
```

This area is currently good.

### 4.4 Locale-Dependent Formatting

Scan result:

```txt
No active API/shared toLocale / Intl.NumberFormat / Intl.DateTimeFormat usage found.
```

Keep this invariant.

### 4.5 Arabic Literals Outside Allowed Catalogs

Found mostly in `packages/shared`:

```txt
packages/shared/src/schemas/intake-form-v2.schema.ts
packages/shared/src/schemas/marketing-strategy.schema.ts
packages/shared/src/enums/*.ts
```

This is a shared-contract cleanup task. It is not all inside `apps/api`, but it affects backend/frontend contract clarity.

### 4.6 Response Shape Inconsistencies

Found patterns:

```ts
return { success: true };
return { success: false };
return { message: "..." };
return { url, statusCode: 302 };
```

These must be audited. Some are acceptable for health/status/redirect/special endpoints, but business endpoints should not create nested envelope confusion.

### 4.7 Test Blocker

Current API e2e startup is blocked by seed issue:

```txt
apps/api/prisma/seed.ts:305
paymentGateway.upsert()
Unique constraint failed on fields: name
```

This must be fixed before relying on full API e2e verification.

---

## 5. Execution Rules for Subagents

### 5.1 General Rules

- Work backend-first.
- Do not touch frontend in backend phases unless explicitly assigned.
- Do not change business behavior unless a task explicitly requires it.
- Replace errors without changing state machine rules.
- Keep backend messages English fallback.
- Do not add Arabic literals to API source except locale catalogs.
- Add or update API error catalog entries with every new code.
- Prefer small module-scoped PRs/patches.
- Do not use `prisma db push`.
- Run package-local verification before handoff.

### 5.2 Error Replacement Rules

When replacing:

```ts
throw new NotFoundException("Task not found");
```

use:

```ts
throw notFound("TASK_NOT_FOUND", "Task not found");
```

or:

```ts
throw new ApiException("TASK_NOT_FOUND", "Task not found", 404);
```

Keep dynamic details structured:

```ts
throw notFound("TASK_NOT_FOUND", "Task not found", { taskId: id });
```

Do not put user content into error codes.

### 5.3 Verification Per Subagent

Minimum:

```bash
npm run typecheck --workspace=api
```

When shared is changed:

```bash
npm run build --workspace=@hassad/shared
npm run typecheck --workspace=api
```

When tests are available/fixed:

```bash
npm run test:e2e --workspace=api -- <target>
```

Always run:

```bash
git diff --check
```

Final integration after all backend phases:

```bash
npm run build --workspace=@hassad/shared
npm run typecheck --workspace=api
npm run test:e2e --workspace=api
git diff --check
```

Then repository integration if requested:

```bash
turbo build
```

---

## 6. Phase Plan

## Phase 0 — Verification Blocker and Baseline

### Goal

Make backend tests runnable and create baseline contract tests.

### Tasks

1. Fix seed idempotency issue:
   - File: `apps/api/prisma/seed.ts`
   - Problem: `paymentGateway.upsert()` fails on unique `name`.
   - Expected: seed can run repeatedly.

2. Run e2e startup:

   ```bash
   npm run test:e2e --workspace=api -- notification-messages
   ```

3. Add/verify baseline scans:
   - direct exception count
   - raw `throw new Error` count
   - raw notification call count
   - Arabic literals outside allowed catalogs
   - locale formatting violations

### Done Criteria

- Seed is idempotent.
- E2e runner starts.
- Baseline counts are documented in this plan or follow-up report.

---

## Phase 1 — Error Helper Foundation

### Goal

Make all module error replacements consistent and easy to review.

### Files

Create:

```txt
apps/api/src/common/errors/domain-errors.ts
apps/api/src/test/api-error-contract.spec.ts
```

Update if needed:

```txt
apps/api/src/common/errors/api-error.ts
apps/api/src/common/filters/http-exception.filter.ts
```

### Required Helpers

```ts
badRequest(code, message, details?)
notFound(code, message, details?)
forbidden(code, message, details?)
conflict(code, message, details?)
internal(code, message, details?)
```

### Tests

Cover:

- helper creates `ApiException` with correct status/code/details
- global filter keeps envelope shape
- validation errors produce `VALIDATION_FAILED`
- unknown errors produce `INTERNAL_ERROR`
- direct unmigrated Nest exceptions still fallback correctly during migration

### Done Criteria

- Helpers exist.
- Tests pass.
- `docs/API_ERROR_CATALOG.md` conventions updated if needed.

---

## Phase 2 — Auth Contract

### Goal

Make login/session/account errors deterministic.

### Files

```txt
apps/api/src/auth/auth.service.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/auth/strategies/*.ts
apps/api/src/auth/guards/*.ts
```

### Current Count

```txt
auth direct exceptions: 4
```

### Required Codes

```txt
AUTH_ACCOUNT_LOCKED
AUTH_REFRESH_SECRET_MISSING
AUTH_EMAIL_ALREADY_EXISTS
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_SUSPENDED
AUTH_ACCOUNT_INACTIVE
AUTH_INVALID_RESET_TOKEN
AUTH_UNAUTHORIZED
AUTH_REFRESH_TOKEN_MISSING
AUTH_ROLE_MISSING
AUTH_ROLE_FORBIDDEN
```

Some already exist; reuse them.

### Response Cleanup

Review these message responses:

```ts
return { message: "Logged out successfully" }
return { message: "If this email exists..." }
return { message: "Password has been reset successfully." }
```

They can remain if documented as auth action payloads, but frontend must not treat them as localization source.

### Done Criteria

- No direct `HttpException`, `ConflictException`, `InternalServerErrorException` in targeted auth files.
- Auth codes documented.
- Auth tests/typecheck pass.

---

## Phase 3 — Requests and CRM Intake

### Goal

Make sales intake/request pipeline contract stable.

### Files

```txt
apps/api/src/modules/requests/requests.service.ts
apps/api/src/modules/requests/canonical-client.service.ts
apps/api/src/modules/crm/services/crm-orders.service.ts
apps/api/src/modules/crm/services/automation.service.ts
```

### Current Count

```txt
requests: 22
crm total: 17
```

### Required Codes

```txt
REQUEST_NOT_FOUND
REQUEST_INVALID_STATUS_TRANSITION
REQUEST_CREATE_FAILED
REQUEST_SERVICE_REQUIRED
REQUEST_REFERENCE_REQUIRED
REQUEST_EXISTING_CLIENT_REQUIRED
REQUEST_NEW_CLIENT_REQUIRED
REQUEST_CLIENT_PAYLOAD_REQUIRED
REQUEST_CANONICAL_NOT_FOUND
CLIENT_NOT_FOUND
CLIENT_STOPPED
CLIENT_EMAIL_ALREADY_EXISTS
CLIENT_ROLE_NOT_FOUND
CLIENT_IDENTITY_CONFLICT
CLIENT_CANONICAL_RESOLUTION_FAILED
AUTOMATION_RULE_NOT_FOUND
AUTOMATION_REQUEST_NOT_FOUND
```

### Done Criteria

- No direct exceptions in targeted request/intake files.
- Request lifecycle errors documented.
- Existing state-machine behavior preserved.

---

## Phase 4 — Admin Users and Employee Management

### Goal

Make admin user management safe for frontend employee screens.

### Files

```txt
apps/api/src/modules/admin/services/admin-users.service.ts
apps/api/src/modules/admin/controllers/admin-users.controller.ts
apps/api/src/modules/core/services/users.service.ts
apps/api/src/modules/core/controllers/users.controller.ts
```

### Current Count

```txt
admin-users.service.ts: 19
core users: 6
```

### Required Codes

```txt
USER_NOT_FOUND
USER_EMAIL_ALREADY_EXISTS
USER_ROLE_NOT_FOUND
USER_DEPARTMENT_NOT_FOUND
USER_PROFILE_UPDATE_FORBIDDEN
USER_PROFILE_FIELDS_FORBIDDEN
USER_IMPERSONATE_ADMIN_FORBIDDEN
USER_IMPERSONATE_SELF_FORBIDDEN
USER_ALREADY_SUSPENDED
USER_NOT_SUSPENDED
```

### Done Criteria

- Admin user endpoints return domain codes.
- Profile/impersonation/suspension behavior preserved.
- Codes documented.

---

## Phase 5 — Contracts and Payment Plans

### Goal

Make revenue contract workflows deterministic.

### Files

```txt
apps/api/src/modules/contracts/services/contracts.service.ts
apps/api/src/modules/contracts/services/contract-payment-plan.service.ts
apps/api/src/modules/contracts/controllers/contracts.controller.ts
apps/api/src/modules/admin/services/admin-contracts.service.ts
apps/api/src/modules/crm/services/crm-contracts.service.ts
```

### Current Count

```txt
contracts: 15
admin-contracts: 7
crm-contracts: 3
```

### Required Codes

```txt
CONTRACT_NOT_FOUND
CONTRACT_HANDOVER_NOT_FOUND
CONTRACT_LINK_EXPIRED
CONTRACT_PDF_REQUIRED
CONTRACT_VERSION_PDF_REQUIRED
CONTRACT_PM_REQUIRED
CONTRACT_NOT_CONVERTIBLE
CONTRACT_ALREADY_CONVERTED
CONTRACT_REQUEST_REQUIRED
CONTRACT_PROPOSAL_REQUIRED
CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND
CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_DUPLICATE
CONTRACT_PAYMENT_PLAN_PERCENT_INVALID
CONTRACT_PAYMENT_PLAN_AMOUNT_INVALID
CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL
```

### Done Criteria

- Contract and payment-plan errors are code-driven.
- Payment plan validation details are structured.
- No behavior changes to signing/activation/project creation.

---

## Phase 6 — Finance, Payments, Currency Settings

### Goal

Make money/configuration workflows production-safe.

### Files

```txt
apps/api/src/modules/finance/services/finance.service.ts
apps/api/src/modules/admin/services/admin-finance.service.ts
apps/api/src/modules/payments/services/payments.service.ts
apps/api/src/modules/settings/services/currency-settings.service.ts
apps/api/src/modules/settings/controllers/currency-settings.controller.ts
apps/api/src/modules/admin/controllers/admin-settings-configuration.controller.ts
```

### Current Count

```txt
finance: 9
settings: 10
admin-finance: 6
raw Error also exists in payments/settings controllers
```

### Required Codes

```txt
INVOICE_NOT_FOUND
INVOICE_REFUND_NOT_ALLOWED
PAYMENT_TICKET_NOT_FOUND
PAYMENT_GATEWAY_CONFIG_MISSING
PAYMENT_GATEWAY_UNAVAILABLE
PAYROLL_EMPLOYEE_NOT_FOUND
PAYROLL_SALARY_NOT_FOUND
WEBHOOK_LOG_NOT_FOUND
WEBHOOK_ALREADY_PROCESSED
WEBHOOK_RETRY_FAILED
CURRENCY_SYMBOL_REQUIRED
CURRENCY_SVG_INLINE_REQUIRED
CURRENCY_SVG_UPLOAD_REQUIRED
CURRENCY_SVG_FILE_REQUIRED
CURRENCY_SETTING_NOT_FOUND
CURRENCY_DEFAULT_MUST_BE_ACTIVE
CURRENCY_DEFAULT_MUST_REMAIN_ACTIVE
CURRENCY_DELETE_DEFAULT_FORBIDDEN
```

### Done Criteria

- No raw `Error` for user/config upload failures.
- Finance/payment/currency codes documented.
- No locale-dependent formatting introduced.

---

## Phase 7 — Projects and Project Periods

### Goal

Make delivery lifecycle errors stable.

### Files

```txt
apps/api/src/modules/projects/services/projects.service.ts
apps/api/src/modules/projects/services/project-periods.service.ts
apps/api/src/modules/projects/controllers/projects.controller.ts
apps/api/src/modules/admin/services/admin-projects.service.ts
apps/api/src/modules/pm/services/pm-project-actions.service.ts
apps/api/src/modules/pm/services/pm-projects.service.ts
```

### Current Count

```txt
projects: 23
pm project actions: 7
admin-projects: 11
raw Error in projects controller
```

### Required Codes

```txt
PROJECT_NOT_FOUND
PROJECT_FILE_NOT_FOUND
PROJECT_REPORT_REQUIRED
PROJECT_REPORT_NOT_AVAILABLE
PROJECT_NOT_ARCHIVED
PROJECT_PM_NOT_FOUND
PROJECT_PERIOD_NOT_FOUND
PROJECT_PERIOD_TRANSITION_INVALID
PROJECT_PERIODS_EMPTY
PROJECT_MEETING_NOT_FOUND
PROJECT_RETAINER_PERIOD_REQUIRED
PROJECT_ACCESS_DENIED
```

### Done Criteria

- Project/period lifecycle errors are code-driven.
- State transitions unchanged.
- History/audit behavior unchanged.

---

## Phase 8 — Tasks, PM, Team

### Goal

Make task workflow frontend-safe.

### Files

```txt
apps/api/src/modules/tasks/services/tasks.service.ts
apps/api/src/modules/tasks/controllers/tasks.controller.ts
apps/api/src/modules/team/services/team-tasks.service.ts
apps/api/src/modules/pm/services/pm-tasks.service.ts
apps/api/src/modules/admin/services/admin-tasks.service.ts
```

### Current Count

```txt
tasks: 8
team: 6
pm tasks: 2
admin tasks: 4
raw Error in tasks controller
```

### Required Codes

```txt
TASK_NOT_FOUND
TASK_ASSIGNEE_NOT_FOUND
TASK_FILE_NOT_FOUND
TASK_FILE_REQUIRED
TASK_TEAM_TRANSITION_NOT_ALLOWED
TASK_PM_FILE_REQUIRED
TASK_INVALID_STATUS
TASK_INVALID_START_STATUS
TASK_INVALID_SUBMIT_STATUS
TASK_INVALID_APPROVAL_STATUS
TASK_INVALID_REVISION_STATUS
TASK_TODO_REVERSION_NOT_ALLOWED
```

Reuse existing task codes where present.

### Done Criteria

- No direct exceptions/raw Error in targeted task files.
- Workflow state-machine behavior unchanged.

---

## Phase 9 — Marketing

### Goal

Make marketing strategy/campaign workflows stable.

### Files

```txt
apps/api/src/modules/marketing/services/campaigns.service.ts
apps/api/src/modules/marketing/services/marketing-strategy.service.ts
apps/api/src/modules/marketing/services/marketing-workspace.service.ts
apps/api/src/modules/admin/services/admin-marketing.service.ts
apps/api/src/modules/marketing/controllers/marketing-strategy.controller.ts
apps/api/src/modules/marketing/controllers/marketing-workspace.controller.ts
```

### Current Count

```txt
marketing: 23
```

### Required Codes

```txt
CAMPAIGN_NOT_FOUND
CAMPAIGN_ORIGINAL_NOT_FOUND
MARKETING_TASK_NOT_FOUND
MARKETING_CLIENT_NOT_FOUND
MARKETING_STRATEGY_NOT_FOUND
MARKETING_CAMPAIGN_NOT_FOUND
MARKETING_STATUS_INVALID
STRATEGY_PDF_REQUIRED
STRATEGY_PDF_INVALID
STRATEGY_ACTION_NOT_AUTHORIZED
STRATEGY_INVALID_SEND_STATUS
STRATEGY_INVALID_APPROVAL_STATUS
STRATEGY_INVALID_REJECTION_STATUS
STRATEGY_INVALID_REVISION_STATUS
STRATEGY_INVALID_RESUBMIT_STATUS
```

Reuse existing marketing codes where present.

### Done Criteria

- Strategy/campaign workflow errors are code-driven.
- PDF validation remains explicit.
- Notification keys remain stable.

---

## Phase 10 — Disputes

### Goal

Make dispute lifecycle and portal/admin/PM dispute behavior stable.

### Files

```txt
apps/api/src/modules/disputes/services/disputes.service.ts
apps/api/src/modules/disputes/controllers/portal-disputes.controller.ts
apps/api/src/modules/disputes/services/disputes-notifications.service.ts
apps/api/src/modules/disputes/services/disputes.scheduler.ts
```

### Current Count

```txt
disputes: 18
raw Error in disputes.scheduler.ts
```

### Required Codes

```txt
DISPUTE_TICKET_NOT_FOUND
DISPUTE_PROJECT_NOT_FOUND
DISPUTE_CLIENT_ACCESS_DENIED
DISPUTE_SYSTEM_ADMIN_MISSING
DISPUTE_ACCESS_DENIED
DISPUTE_ALREADY_OPEN
DISPUTE_NOT_EDITABLE
DISPUTE_NOT_AWAITING_APPROVAL
DISPUTE_NOT_AWAITING_CONFIRMATION
DISPUTE_NOT_RESOLVABLE
DISPUTE_NOT_CLOSABLE
DISPUTE_MANAGER_CHANGE_NOT_ALLOWED
```

Reuse existing dispute codes where present.

### Done Criteria

- All dispute lifecycle errors are code-driven.
- Scheduler internal failure is explicit and safe.
- Notification behavior unchanged.

---

## Phase 11 — Portal

### Goal

Make customer-facing portal errors stable and safe.

### Files

```txt
apps/api/src/modules/portal/services/portal.service.ts
apps/api/src/modules/portal/controllers/portal.controller.ts
apps/api/src/modules/portal/services/snooze-reminder.scheduler.ts
```

### Current Count

```txt
portal: 20
```

### Required Codes

```txt
PORTAL_PROJECT_NOT_FOUND
PORTAL_PROJECT_ACCESS_DENIED
PORTAL_INVOICE_NOT_FOUND
PORTAL_REPORT_NOT_AVAILABLE
PORTAL_FILE_NOT_FOUND
PORTAL_FILE_UNAVAILABLE
PORTAL_DELIVERABLE_NOT_FOUND
PORTAL_CONTRACT_NOT_FOUND
PORTAL_CAMPAIGN_NOT_FOUND
PORTAL_MARKETING_STRATEGY_NOT_FOUND
PORTAL_ACCESS_DENIED
PORTAL_ACTION_NOT_AUTHORIZED
```

### Response Cleanup

Review:

```ts
return { success: false };
return { success: true };
```

Replace with explicit action result payloads where needed.

### Done Criteria

- Portal errors are stable and safe.
- No nested success confusion in important portal endpoints.
- No customer-facing behavior regression.

---

## Phase 12 — Chat

### Goal

Make chat errors stable across all workspaces.

### Files

```txt
apps/api/src/modules/chat/services/chat.service.ts
apps/api/src/modules/chat/controllers/chat.controller.ts
apps/api/src/modules/admin/controllers/admin-chat-workspace.controller.ts
apps/api/src/modules/crm/controllers/crm-chat.controller.ts
apps/api/src/modules/marketing/controllers/marketing-chat.controller.ts
apps/api/src/modules/pm/controllers/pm-chat.controller.ts
apps/api/src/modules/team/controllers/team-chat.controller.ts
```

### Current Count

```txt
chat: 20
workspace chat controller duplicates exist across modules
```

### Required Codes

```txt
CHAT_CONVERSATION_NOT_FOUND
CHAT_DIRECT_CONVERSATION_CREATE_FAILED
CHAT_PROJECT_GROUP_NOT_FOUND
CHAT_GROUP_MEMBERSHIP_REQUIRED
CHAT_MESSAGE_NOT_FOUND
CHAT_MESSAGE_EDIT_FORBIDDEN
CHAT_MESSAGE_DELETE_FORBIDDEN
CHAT_MESSAGE_DELETED_EDIT_FORBIDDEN
CHAT_TARGET_USER_NOT_FOUND
CHAT_REPLY_TARGET_NOT_FOUND
```

### Done Criteria

- Chat behavior uses domain codes.
- Duplicate chat controllers use same codes.
- No notification regressions.

---

## Phase 13 — AI and AI Assistant

### Goal

Make AI provider/model/tool errors explicit without leaking provider secrets.

### Files

```txt
apps/api/src/modules/ai/services/ai-provider.service.ts
apps/api/src/modules/ai/controllers/ai-provider.controller.ts
apps/api/src/modules/ai/adapters/*.ts
apps/api/src/modules/ai/services/ai.service.ts
apps/api/src/modules/ai-assistant/ai-assistant.service.ts
apps/api/src/modules/ai-assistant/tools/tool-registry.service.ts
apps/api/src/modules/ai-assistant/ai-assistant.controller.ts
```

### Current Count

```txt
ai: 8 direct exceptions
raw Error in AI adapters and tool registry
ai-assistant: 2 direct exceptions
```

### Required Codes

```txt
AI_PROVIDER_NOT_FOUND
AI_PROVIDER_MODEL_FETCH_FAILED
AI_PROVIDER_MODEL_UNSUPPORTED
AI_PROVIDER_ADAPTER_UNSUPPORTED
AI_PROVIDER_TEST_FAILED
AI_LOG_NOT_FOUND
AI_CONVERSATION_NOT_FOUND
AI_TOOL_NOT_FOUND
AI_ASSISTANT_STREAM_FAILED
```

### Done Criteria

- Provider/API errors do not leak API keys or raw secrets.
- Tool lookup failures are domain-coded.
- AI controller response shape is documented and not nested-confusing.

---

## Phase 14 — Remaining Admin and Support Modules

### Goal

Finish all remaining direct exceptions and response inconsistencies.

### Files/Areas

```txt
apps/api/src/modules/admin/services/admin-automation.service.ts
apps/api/src/modules/admin/services/admin-backups.service.ts
apps/api/src/modules/admin/services/admin-business-goal.service.ts
apps/api/src/modules/admin/services/admin-campaigns.service.ts
apps/api/src/modules/admin/services/admin-chat.service.ts
apps/api/src/modules/admin/services/admin-clients.service.ts
apps/api/src/modules/admin/services/admin-contract-migration-review.service.ts
apps/api/src/modules/admin/services/admin-integrations.service.ts
apps/api/src/modules/admin/services/admin-notification-templates.service.ts
apps/api/src/modules/admin/services/admin-portal.service.ts
apps/api/src/modules/admin/services/admin-proposals.service.ts
apps/api/src/modules/admin/services/admin-reports.service.ts
apps/api/src/modules/admin/services/admin-requests.service.ts
apps/api/src/modules/admin/services/admin-sessions.service.ts
apps/api/src/modules/admin/services/admin-team.service.ts
apps/api/src/modules/admin/services/admin-system-events.service.ts
apps/api/src/modules/notifications/services/notification-templates.service.ts
apps/api/src/modules/services/services/service-catalog.service.ts
```

### Required Code Families

```txt
ADMIN_AUTOMATION_RULE_NOT_FOUND
ADMIN_BACKUP_INVALID_REQUEST
BUSINESS_GOAL_NOT_FOUND
ADMIN_CAMPAIGN_NOT_FOUND
ADMIN_CLIENT_NOT_FOUND
ADMIN_CLIENT_ALREADY_SUSPENDED
ADMIN_CLIENT_NOT_SUSPENDED
ADMIN_CONTRACT_MIGRATION_REVIEW_NOT_FOUND
ADMIN_CONTRACT_MIGRATION_REVIEW_RESOLVED
ADMIN_INTEGRATION_WEBHOOK_LOG_NOT_FOUND
ADMIN_NOTIFICATION_TEMPLATE_NOT_FOUND
ADMIN_PROPOSAL_NOT_FOUND
ADMIN_PROPOSAL_NOT_CONVERTIBLE
ADMIN_REPORT_TYPE_NOT_FOUND
ADMIN_REQUEST_NOT_FOUND
ADMIN_SESSION_NOT_FOUND
ADMIN_TEAM_WORKLOAD_NOT_FOUND
SYSTEM_EVENT_NOT_FOUND
SERVICE_NOT_FOUND
NOTIFICATION_TEMPLATE_NOT_FOUND
```

### Done Criteria

- Direct exception scan returns zero for targeted exception types, except intentional framework-only cases if documented.
- Raw `throw new Error` scan has no business/user cases.

---

## Phase 15 — Shared Package Contract Cleanup

### Goal

Separate stable shared business truth from UI/localized labels.

### Files

```txt
packages/shared/src/enums/*.ts
packages/shared/src/schemas/*.ts
```

### Current Issues

Arabic literals exist in shared enum label maps and schemas.

### Required Work

1. Identify label maps that are Arabic display copy.
2. Replace with stable enum/code exports or move labels to frontend dictionaries later.
3. Replace Arabic validation messages with English fallback messages or structured schema issue keys if feasible.
4. Preserve exported enum values if backend/frontend currently depend on them.
5. Avoid breaking API contracts without migration notes.

### Done Criteria

- No Arabic literals in `packages/shared` except explicitly approved locale catalog files if introduced.
- Shared remains buildable.
- Frontend gets clear instruction to own UI labels.

---

## Phase 16 — Response Envelope Audit

### Goal

Remove accidental nested envelope/data ambiguity.

### Scan Patterns

Review active API code for:

```txt
return { success: true }
return { success: false }
return { message: "..." }
return { statusCode: ... }
@Res
res.json
res.status
```

### Rules

Allowed:

- Auth cookie setting with `@Res({ passthrough: true })`.
- OAuth redirects.
- File downloads/redirects when documented.
- Health/debug endpoints if their shape is intentionally documented.

Avoid in business endpoints:

```ts
return { success: true };
```

Prefer:

```ts
return { ok: true };
return { deleted: true };
return { updated: true };
return actualResource;
```

### Done Criteria

- Important business endpoints do not produce nested `success` confusion.
- Special cases documented.

---

## Phase 17 — Final Backend Verification and Readiness Report

### Required Commands

```bash
npm run build --workspace=@hassad/shared
npm run typecheck --workspace=api
npm run test:e2e --workspace=api
git diff --check
```

Then if requested:

```bash
turbo build
```

### Required Final Report

Produce a final backend readiness report including:

1. Direct exception count before/after.
2. Raw `Error` count before/after.
3. Arabic literal scan before/after.
4. Locale formatting scan before/after.
5. Raw notification call scan.
6. Response envelope audit result.
7. API error catalog updated status.
8. Test results.
9. Known intentionally deferred items, if any.

---

## 7. Recommended Parallelization for Subagents

### Sequence Rule

Some phases must be sequential:

```txt
Phase 0 -> Phase 1 -> Phase 2+
```

After Phase 1, modules can be grouped, but avoid multiple agents editing the same file.

### Suggested Subagent Groups

#### Group A — Auth and Users

- Phase 2 Auth
- Phase 4 Admin users/Core users

#### Group B — Sales and Revenue

- Phase 3 Requests/CRM intake
- Phase 5 Contracts/payment plans
- Phase 6 Finance/payments/currency

#### Group C — Delivery Operations

- Phase 7 Projects/periods
- Phase 8 Tasks/PM/Team
- Phase 10 Disputes

#### Group D — Client/Communication

- Phase 11 Portal
- Phase 12 Chat
- Phase 9 Marketing if not assigned to Delivery

#### Group E — Admin/AI/Support

- Phase 13 AI
- Phase 14 Remaining admin/support

#### Group F — Shared Contract

- Phase 15 Shared package cleanup
- Must coordinate with all backend and later frontend work.

### Conflict Avoidance

- Only one subagent should edit `docs/API_ERROR_CATALOG.md` at a time, or one integrator should merge code additions.
- Only one subagent should edit shared helper files.
- Do not split one service file across agents.

---

## 8. Code Review Checklist

For every backend hardening patch:

- [ ] Uses `ApiException` or domain error helper for business errors.
- [ ] New codes are documented.
- [ ] Messages are English fallback.
- [ ] No Arabic hardcoded API copy added.
- [ ] No frontend behavior depends on message text.
- [ ] No user-generated content translated or rewritten.
- [ ] No locale-dependent number/date formatting added.
- [ ] No raw notification creation outside `NotificationsService`.
- [ ] No accidental nested `{ success: true }` in business endpoint output.
- [ ] Typecheck passes.
- [ ] Targeted tests pass where possible.
- [ ] `git diff --check` passes.

---

## 9. Frontend Handoff Contract After Backend Completion

Frontend V2 should receive this backend contract:

1. API base: `/v1`.
2. JSON envelope is always unwrapped once.
3. Errors use `error.code`.
4. Messages are fallback display only.
5. Data uses stable enum/code values.
6. Frontend owns UI translation dictionaries.
7. Backend owns notification generated copy.
8. Shared package owns stable codes and schemas.
9. Frontend sends locale preference.
10. Frontend must support English default first, Arabic only when frontend dictionaries and RTL QA are complete.

---

## 10. Final Definition of Backend Production Ready

Backend is production ready for MVP when:

- Seed and migrations are repeatable.
- Full API e2e passes.
- Important business modules use domain error codes.
- No business/user raw `Error` remains.
- API error catalog is complete.
- Notification localization contract is respected.
- Shared package does not leak UI translation responsibilities.
- Response envelope is consistent.
- Frontend can implement behavior without parsing backend English messages.

Only after this should broad frontend V2 integration proceed.
